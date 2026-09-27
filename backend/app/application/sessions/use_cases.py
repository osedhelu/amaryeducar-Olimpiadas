from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import ActualizarSesionRequest, CrearSesionRequest, JoinRequest
from app.application.ports import RealtimePublisher
from app.core.exceptions import (
    ClaveIncorrecta,
    DatosInvalidos,
    PinNoEncontrado,
    SesionNoActiva,
)
from app.core.security import crear_jwt, validar_clave_admin
from app.domain.entities import entity_to_dict
from app.domain.enums import EstadoSesion, RolJWT
from app.domain.rules import es_grado_grupal
from app.infrastructure.db.repositories import (
    AlumnoRepo,
    ColegioRepo,
    GradoRepo,
    JugadorRepo,
    ParametroRepo,
    PreguntaRepo,
    RespuestaRepo,
    SesionPreguntaRepo,
    SesionRepo,
    generar_pin_unico,
)

PARAMETROS_DEFAULT: dict[str, str] = {
    "nombre_institucion": "Amar y Educar",
    "nombre_evento": "Olimpiadas de Inglés 2026",
    "subtitulo_evento": "Preguntas y respuestas en inglés",
    "texto_bienvenida": "Nos alegra enormemente darles la bienvenida a esta jornada de conocimiento, idioma y superación.",
    "texto_unirse": "Únete a la Olimpiada",
    "texto_join_ayuda": "Ingresa el PIN y toca tu nombre en la lista",
    "texto_panel_docente": "Panel del Docente",
    "texto_unirme_estudiante": "Unirme como Estudiante",
    "texto_pin_label": "PIN de la sesión",
    "texto_ronda_completada": "¡Ronda completada!",
    "retos_habilitados": "false",
    "modo_quiz": "false",
    "preguntas_por_sesion": "10",
    "clave_admin": "ADMadm1234",
}

PARAMETROS_SECRETOS = {"clave_admin"}

RETOS_HABILITADOS_CLAVE = "retos_habilitados"


def _es_booleano_verdadero(valor: str | None) -> bool:
    return str(valor or "").strip().lower() in ("true", "1", "si", "sí")


async def retos_habilitados(db: AsyncSession) -> bool:
    """Indica si las pruebas lúdicas (retos) están habilitadas por parámetro."""
    if db is None:
        return False
    valor = await ParametroRepo(db).obtener(
        RETOS_HABILITADOS_CLAVE, PARAMETROS_DEFAULT[RETOS_HABILITADOS_CLAVE]
    )
    return _es_booleano_verdadero(valor)


async def modo_quiz(db: AsyncSession) -> bool:
    """Modo competencia individual: N preguntas al azar por sala y podium por alumno."""
    if db is None:
        return False
    valor = await ParametroRepo(db).obtener(
        "modo_quiz", PARAMETROS_DEFAULT.get("modo_quiz", "false")
    )
    return _es_booleano_verdadero(valor)


async def preguntas_por_sesion(db: AsyncSession) -> int:
    if db is None:
        return int(PARAMETROS_DEFAULT.get("preguntas_por_sesion", "10"))
    valor = await ParametroRepo(db).obtener(
        "preguntas_por_sesion", PARAMETROS_DEFAULT.get("preguntas_por_sesion", "10")
    )
    try:
        return max(1, int(str(valor).strip()))
    except ValueError:
        return 10


class AuthUseCases:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _clave_admin_valida(self, clave: str) -> bool:
        if validar_clave_admin(clave):
            return True
        if self.db is None:
            return False
        parametros = await ParametroRepo(self.db).listar()
        almacenada = parametros.get("clave_admin")
        return bool(almacenada) and clave == almacenada

    async def login_docente(self, clave: str) -> dict:
        if not await self._clave_admin_valida(clave):
            raise ClaveIncorrecta()
        return {"token": crear_jwt(RolJWT.DOCENTE.value), "role": RolJWT.DOCENTE.value}

    async def listar_parametros(self, incluir_secretos: bool = False) -> dict[str, str]:
        parametros = {**PARAMETROS_DEFAULT, **await ParametroRepo(self.db).listar()}
        if not incluir_secretos:
            for clave in PARAMETROS_SECRETOS:
                parametros.pop(clave, None)
        return parametros

    async def actualizar_parametros(self, valores: dict[str, str]) -> dict[str, str]:
        limpios = {
            clave: str(valor)
            for clave, valor in valores.items()
            if isinstance(clave, str) and valor is not None
        }
        await ParametroRepo(self.db).upsert_muchos(limpios)
        return await self.listar_parametros(incluir_secretos=True)

    async def token_estudiante(self, jugador_id: str, sesion_id: str) -> dict:
        return {
            "token": crear_jwt(RolJWT.ESTUDIANTE.value, jugador_id, sesion_id),
            "role": RolJWT.ESTUDIANTE.value,
        }

    async def token_anonimo(self) -> dict:
        return {"token": crear_jwt(RolJWT.ANON.value), "role": RolJWT.ANON.value}

    async def listar_grados(self) -> list[dict]:
        return [entity_to_dict(g) for g in await GradoRepo(self.db).listar()]

    async def listar_colegios(self) -> list[dict]:
        return [entity_to_dict(c) for c in await ColegioRepo(self.db).listar()]


class SesionUseCases:
    def __init__(self, db: AsyncSession, realtime: RealtimePublisher):
        self.db = db
        self.realtime = realtime

    async def crear(self, req: CrearSesionRequest) -> dict:
        pin = await generar_pin_unico(self.db)
        sesion = await SesionRepo(self.db).crear(
            pin,
            req.grado_id,
            EstadoSesion.LOBBY.value,
            tipo=req.tipo,
            colegio_id=req.colegio_id,
        )
        await self.db.commit()

        # Modo quiz (competición individual): fija N preguntas al azar para la sala.
        if req.tipo == "oficial" and await modo_quiz(self.db):
            grado = await GradoRepo(self.db).por_id(req.grado_id)
            if grado and grado.orden >= 4:
                n = await preguntas_por_sesion(self.db)
                await SesionPreguntaRepo(self.db).asignar_aleatorias(
                    sesion.id, req.grado_id, n
                )
                await self.db.commit()

        return entity_to_dict(sesion)

    async def preguntas_de_sesion(self, sesion_id: str) -> list[dict]:
        """Preguntas fijadas para la sesión; si no hay, todas las activas del grado."""
        sesion = await SesionRepo(self.db).por_id(uuid.UUID(sesion_id))
        if not sesion:
            raise PinNoEncontrado()
        preguntas = await SesionPreguntaRepo(self.db).listar_preguntas(sesion.id)
        if not preguntas:
            preguntas = await PreguntaRepo(self.db).listar_por_grado(sesion.grado_id)
        return [entity_to_dict(p) for p in preguntas]

    async def unirse(self, req: JoinRequest) -> dict:
        sesion_repo = SesionRepo(self.db)
        jugador_repo = JugadorRepo(self.db)
        alumno_repo = AlumnoRepo(self.db)

        sesion = await sesion_repo.por_pin(req.pin)
        if not sesion or sesion.estado == EstadoSesion.BORRADOR.value:
            raise PinNoEncontrado()

        alumno = await alumno_repo.por_id(req.alumno_id)
        if not alumno:
            raise DatosInvalidos("Alumno no encontrado en el registro")
        if alumno.grado_id != sesion.grado_id:
            raise DatosInvalidos("El alumno no pertenece al grado de esta sesión")
        if sesion.tipo == "prueba":
            if alumno.id not in (sesion.alumno_a_id, sesion.alumno_b_id):
                raise DatosInvalidos("Este alumno no participa en esta prueba")

        jugador = await jugador_repo.por_sesion_y_alumno(sesion.id, alumno.id)
        if jugador:
            await jugador_repo.actualizar(
                jugador.id,
                conectado=True,
                colegio_id=alumno.colegio_id,
                alumno_id=alumno.id,
            )
            jugador.colegio_id = alumno.colegio_id
            await self.db.commit()
            await self.realtime.publish(
                "jugador_cambio", entity_to_dict(jugador), str(sesion.id)
            )
        else:
            jugador = await jugador_repo.crear(
                sesion.id, alumno.nombre, alumno.colegio_id, alumno.id
            )
            await self.db.commit()
            await self.realtime.publish(
                "jugador_unido", entity_to_dict(jugador), str(sesion.id)
            )

        token = crear_jwt(RolJWT.ESTUDIANTE.value, str(jugador.id), str(sesion.id))
        return {
            "token": token,
            "jugadorId": str(jugador.id),
            "sesionId": str(sesion.id),
            "nombre": alumno.nombre,
            "alumnoId": str(alumno.id),
            "colegioId": str(alumno.colegio_id) if alumno.colegio_id else None,
        }

    async def listar(self) -> list[dict]:
        return [entity_to_dict(s) for s in await SesionRepo(self.db).listar()]

    async def obtener(self, sesion_id: str) -> dict | None:
        sesion = await SesionRepo(self.db).por_id(uuid.UUID(sesion_id))
        return entity_to_dict(sesion) if sesion else None

    async def obtener_por_pin(self, pin: str) -> dict | None:
        sesion = await SesionRepo(self.db).por_pin(pin)
        if not sesion or sesion.estado == EstadoSesion.BORRADOR.value:
            return None
        return entity_to_dict(sesion)

    async def listar_jugadores(self, sesion_id: str) -> list[dict]:
        return [
            entity_to_dict(j)
            for j in await JugadorRepo(self.db).listar_por_sesion(uuid.UUID(sesion_id))
        ]

    async def actualizar(self, sesion_id: str, req: ActualizarSesionRequest) -> dict:
        sesion = await SesionRepo(self.db).por_id(uuid.UUID(sesion_id))
        if not sesion:
            raise PinNoEncontrado()

        pide_reto = (
            req.estado in (EstadoSesion.RETO.value, EstadoSesion.RETO_PODIUM.value)
            or req.reto_activo_id is not None
        )
        if pide_reto and not await retos_habilitados(self.db):
            raise DatosInvalidos("Las pruebas lúdicas están deshabilitadas")

        updated = await SesionRepo(self.db).actualizar(
            sesion.id,
            estado=req.estado,
            pregunta_activa_id=req.pregunta_activa_id,
            reto_activo_id=req.reto_activo_id,
            cronometro_inicio=req.cronometro_inicio,
            cronometro_segundos=req.cronometro_segundos,
            reset_pregunta=bool(req.reset_pregunta),
        )
        await self.db.commit()
        if updated:
            data = entity_to_dict(updated)
            await self.realtime.publish("sesion_cambio", data, str(sesion.id))
        return entity_to_dict(updated) if updated else {}

    async def finalizar(self, sesion_id: str) -> dict:
        sesion_repo = SesionRepo(self.db)
        sesion = await sesion_repo.por_id(uuid.UUID(sesion_id))
        if not sesion:
            raise PinNoEncontrado()

        await JugadorRepo(self.db).desconectar_todos(sesion.id)
        await sesion_repo.actualizar(sesion.id, estado=EstadoSesion.FINAL.value)
        await self.db.commit()

        updated = await sesion_repo.por_id(sesion.id)
        if updated:
            await self.realtime.publish(
                "sesion_cambio", entity_to_dict(updated), str(sesion.id)
            )
        return entity_to_dict(updated) if updated else {}


class ControlRondaUseCases:
    def __init__(self, db: AsyncSession, realtime: RealtimePublisher):
        self.db = db
        self.realtime = realtime

    async def listar_preguntas(
        self, grado_id: str, incluir_inactivas: bool = False
    ) -> list[dict]:
        return [
            entity_to_dict(p)
            for p in await PreguntaRepo(self.db).listar_por_grado(
                uuid.UUID(grado_id), solo_activas=not incluir_inactivas
            )
        ]

    async def obtener_pregunta(self, pregunta_id: str) -> dict | None:
        pregunta = await PreguntaRepo(self.db).por_id(uuid.UUID(pregunta_id))
        return entity_to_dict(pregunta) if pregunta else None

    async def listar_retos(self, grado_id: str) -> list[dict]:
        from app.infrastructure.db.repositories import RetoRepo

        if not await retos_habilitados(self.db):
            return []
        return [
            entity_to_dict(r)
            for r in await RetoRepo(self.db).listar_por_grado(uuid.UUID(grado_id))
        ]

    async def lanzar_pregunta(
        self,
        sesion_id: str,
        pregunta_id: str,
        cronometro_inicio: datetime | None = None,
        cronometro_segundos: int | None = None,
    ) -> dict:
        sesion_repo = SesionRepo(self.db)
        sesion = await sesion_repo.por_id(uuid.UUID(sesion_id))
        if not sesion:
            raise PinNoEncontrado()

        pregunta = await PreguntaRepo(self.db).por_id(uuid.UUID(pregunta_id))
        if not pregunta:
            raise DatosInvalidos("Pregunta no encontrada")

        inicio = cronometro_inicio or datetime.now(timezone.utc)
        segundos = cronometro_segundos or pregunta.tiempo_limite

        # Al (re)lanzar se limpian las respuestas previas de esta pregunta en
        # la sesión: así, si se reinicia, los estudiantes pueden responder de nuevo.
        await RespuestaRepo(self.db).eliminar_por_pregunta_sesion(
            pregunta.id, sesion.id
        )

        updated = await sesion_repo.actualizar(
            sesion.id,
            estado=EstadoSesion.PREGUNTA.value,
            pregunta_activa_id=pregunta.id,
            cronometro_inicio=inicio,
            cronometro_segundos=segundos,
        )
        await self.db.commit()
        if updated:
            # Al (re)lanzar, reiniciar el flag conectado: primero apagar todos
            # y luego encender solo los que tienen WebSocket abierto AHORA.
            # Así se eliminan "fantasmas" (conectado=true de conexiones ya
            # caídas) que inflaban el conteo y rompían el auto-cierre.
            await JugadorRepo(self.db).desconectar_todos(sesion.id)
            conectados = await self.realtime.jugadores_conectados(str(sesion.id))
            if conectados:
                await JugadorRepo(self.db).marcar_conectados(sesion.id, conectados)
            await self.db.commit()
            data = entity_to_dict(updated)
            await self.realtime.publish("sesion_cambio", data, str(sesion.id))
        return entity_to_dict(updated) if updated else {}

    async def cerrar_pregunta(self, sesion_id: str) -> dict:
        sesion_repo = SesionRepo(self.db)
        sesion = await sesion_repo.por_id(uuid.UUID(sesion_id))
        if not sesion:
            raise PinNoEncontrado()
        updated = await sesion_repo.actualizar(
            sesion.id, estado=EstadoSesion.RESULTADO.value
        )
        await self.db.commit()
        if updated:
            await self.realtime.publish(
                "sesion_cambio", entity_to_dict(updated), str(sesion.id)
            )
            from app.infrastructure.db.repositories import RespuestaRepo

            respuestas = await RespuestaRepo(self.db).listar_por_sesion(
                sesion.id, updated.pregunta_activa_id
            )
            await self.realtime.publish(
                "resultado_pregunta",
                {
                    "pregunta_id": (
                        str(updated.pregunta_activa_id)
                        if updated.pregunta_activa_id
                        else None
                    ),
                    "respuestas": [entity_to_dict(r) for r in respuestas],
                },
                str(sesion.id),
            )
        return entity_to_dict(updated) if updated else {}

    async def siguiente_pregunta(self, sesion_id: str) -> dict:
        sesion_repo = SesionRepo(self.db)
        sesion = await sesion_repo.por_id(uuid.UUID(sesion_id))
        if not sesion:
            raise PinNoEncontrado()
        preguntas = await PreguntaRepo(self.db).listar_por_grado(sesion.grado_id)
        if not preguntas:
            raise DatosInvalidos("Sin preguntas para este grado")
        if sesion.pregunta_activa_id:
            idx = next(
                (
                    i
                    for i, p in enumerate(preguntas)
                    if p.id == sesion.pregunta_activa_id
                ),
                -1,
            )
            siguiente = (
                preguntas[idx + 1] if idx != -1 and idx + 1 < len(preguntas) else None
            )
        else:
            siguiente = preguntas[0]
        if siguiente:
            return await self.lanzar_pregunta(sesion_id, str(siguiente.id))
        updated = await sesion_repo.actualizar(
            sesion.id, estado=EstadoSesion.FINAL.value
        )
        await self.db.commit()
        if updated:
            await self.realtime.publish(
                "sesion_cambio", entity_to_dict(updated), str(sesion.id)
            )
        return entity_to_dict(updated) if updated else {}

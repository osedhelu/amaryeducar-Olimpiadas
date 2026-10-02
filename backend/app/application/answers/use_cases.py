from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import AprobarRespuestaRequest, EnviarRespuestaRequest
from app.application.ports import RealtimePublisher
from app.application.vidas.use_cases import vidas_config
from app.core.exceptions import (
    DatosInvalidos,
    PreguntaNoActiva,
    SesionNoActiva,
    SinVidas,
)
from app.domain.entities import entity_to_dict
from app.domain.entities import Jugador
from app.domain.enums import EstadoSesion
from app.domain.rules import (
    calcular_puntos,
    corregir_reloj,
    es_correcta_opcion,
)
from app.domain.vidas import calcular_estados_vidas
from app.infrastructure.db.repositories import (
    GradoRepo,
    JugadorRepo,
    PreguntaRepo,
    RespuestaRepo,
    SesionRepo,
    obtener_podium_rows,
)
from app.infrastructure.db.models import JugadorORM, RespuestaORM


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


class RespuestaUseCases:
    def __init__(self, db: AsyncSession, realtime: RealtimePublisher):
        self.db = db
        self.realtime = realtime

    async def enviar(self, req: EnviarRespuestaRequest) -> dict:
        """Replica del trigger SQL calcular_puntos_respuesta + auto cierre."""
        jugador_repo = JugadorRepo(self.db)
        pregunta_repo = PreguntaRepo(self.db)
        sesion_repo = SesionRepo(self.db)
        respuesta_repo = RespuestaRepo(self.db)

        jugador = await jugador_repo.por_id(req.jugador_id)
        if not jugador:
            raise DatosInvalidos("Jugador no encontrado")

        sesion = await sesion_repo.por_id(jugador.sesion_id)
        if not sesion or sesion.estado != EstadoSesion.PREGUNTA.value:
            raise SesionNoActiva()
        if sesion.pregunta_activa_id != req.pregunta_id:
            raise PreguntaNoActiva()

        pregunta = await pregunta_repo.por_id(req.pregunta_id)
        if not pregunta:
            raise DatosInvalidos("Pregunta no encontrada")

        respuesta_existente = await respuesta_repo.por_id_existente(
            req.pregunta_id, req.jugador_id
        )
        if respuesta_existente:
            # Idempotente: reenvío / doble clic → devolver la respuesta ya guardada
            r_dict = entity_to_dict(respuesta_existente)
            r_dict["jugador_nombre"] = jugador.nombre
            r_dict["secuencia"] = respuesta_existente.secuencia
            return r_dict

        # Sistema de vidas: un jugador eliminado ya no puede responder.
        if await self._jugador_eliminado(jugador, sesion):
            raise SinVidas()

        enviado_en = corregir_reloj(req.enviado_en, _ahora())
        assert enviado_en is not None

        # Calcular correcta según tipo
        if pregunta.tipo == "opcion-multiple":
            correcta = es_correcta_opcion(
                req.opcion_seleccionada, pregunta.respuesta_correcta
            )
        elif pregunta.tipo == "abierta":
            correcta = None  # la aprueba el docente luego
        else:
            raise DatosInvalidos("Tipo de pregunta inválido")

        # secuencia: usamos timestamp con microsegundos como desempate aproximado;
        # la BD genera la secuencia real (BIGSERIAL) que usamos en el desempate final.
        secuencia_ref = int(enviado_en.timestamp() * 1_000_000)

        if correcta is True:
            orden_correcto = (
                await respuesta_repo.contar_correctas_previas(
                    req.pregunta_id, jugador.sesion_id, enviado_en, secuencia_ref
                )
                + 1
            )
            puntos = calcular_puntos(pregunta.puntos_por_puesto, orden_correcto)
        else:
            orden_correcto = None
            puntos = 0

        numero_orden = (
            await respuesta_repo.contar_anteriores(
                req.pregunta_id, jugador.sesion_id, enviado_en, secuencia_ref
            )
            + 1
        )

        # Insertar respuesta (secuencia real la pone la BD)
        respuesta = await respuesta_repo.crear(
            pregunta_id=req.pregunta_id,
            jugador_id=req.jugador_id,
            opcion=req.opcion_seleccionada,
            texto=req.texto_respuesta,
            correcta=correcta,
            enviado_en=enviado_en,
            numero_orden=numero_orden,
            puntos=puntos,
        )
        await self.db.commit()

        # Broadcast de la respuesta recibida (con nombre del jugador)
        r_dict = entity_to_dict(respuesta)
        r_dict["jugador_nombre"] = jugador.nombre
        r_dict["secuencia"] = respuesta.secuencia
        await self.realtime.publish(
            "respuesta_recibida", r_dict, str(jugador.sesion_id)
        )

        # Estado de vidas tras responder (puede haber eliminado al jugador).
        mi_estado = await self._estado_jugador(jugador, sesion)
        if mi_estado:
            r_dict["vidas_restantes"] = mi_estado["vidas_restantes"]
            r_dict["errores"] = mi_estado["errores"]
            r_dict["eliminado"] = mi_estado["eliminado"]
            await self.realtime.publish(
                "vidas_cambio", mi_estado, str(jugador.sesion_id)
            )

        # Auto-cierre: si todos los CONECTADOS con vidas respondieron → resultado
        await self._auto_cerrar_si_todos(sesion, req.pregunta_id)

        return r_dict

    async def _datos_vidas(self, sesion) -> tuple:
        """(jugadores, respuestas, preguntas, habilitadas, max_vidas) de la sesión."""
        jugadores = await JugadorRepo(self.db).listar_por_sesion(sesion.id)
        respuestas = await RespuestaRepo(self.db).listar_por_sesion(sesion.id)
        preguntas = await PreguntaRepo(self.db).listar_por_grado(sesion.grado_id)
        hab, max_vidas = await vidas_config(self.db)
        return jugadores, respuestas, preguntas, hab, max_vidas

    async def _estado_jugador(self, jugador: Jugador, sesion) -> dict | None:
        """Estado de vidas de UN jugador (dict para publicar) o None si no aplica."""
        if not jugador:
            return None
        jugadores, respuestas, preguntas, hab, max_vidas = await self._datos_vidas(
            sesion
        )
        estados = calcular_estados_vidas(
            jugadores, respuestas, preguntas, habilitadas=hab, max_vidas=max_vidas
        )
        estado = estados.get(jugador.id)
        return estado.a_dict() if estado else None

    async def _jugador_eliminado(self, jugador: Jugador, sesion) -> bool:
        if not jugador:
            return False
        estado = await self._estado_jugador(jugador, sesion)
        return bool(estado and estado["eliminado"])

    async def _auto_cerrar_si_todos(self, sesion, pregunta_id: uuid.UUID) -> None:
        """Cierra la pregunta y publica el resultado cuando respondieron todos
        los jugadores CONECTADOS que aún tienen vidas.

        Los eliminados no se esperan (no pueden responder) y por tanto NO
        bloquean el cierre. Si todos los conectados quedaron eliminados, la
        pregunta también cierra.

        Publica SIEMPRE los eventos al alcanzarse el umbral, incluso si la
        sesión ya está en 'resultado' (p. ej. un trigger legacy de la BD la
        cerró antes). Así el frontend nunca se queda sin el aviso de resultado.
        """
        sesion_repo = SesionRepo(self.db)

        jugadores, respuestas, preguntas, hab, max_vidas = await self._datos_vidas(
            sesion
        )
        estados = calcular_estados_vidas(
            jugadores, respuestas, preguntas, habilitadas=hab, max_vidas=max_vidas
        )

        conectados = [e for e in estados.values() if e.conectado]
        if not conectados:
            return

        respondieron = {
            r.jugador_id for r in respuestas if r.pregunta_id == pregunta_id
        }
        pendientes = [
            e
            for e in estados.values()
            if e.conectado and not e.eliminado and e.jugador_id not in respondieron
        ]
        if pendientes:
            return

        # Cerrar (idempotente): solo si sigue en 'pregunta'.
        sesion_actual = await sesion_repo.por_id(sesion.id)
        if sesion_actual and sesion_actual.estado == EstadoSesion.PREGUNTA.value:
            updated = await sesion_repo.actualizar(
                sesion.id, estado=EstadoSesion.RESULTADO.value
            )
            await self.db.commit()
        else:
            updated = sesion_actual

        if not updated:
            return

        await self.realtime.publish(
            "sesion_cambio", entity_to_dict(updated), str(sesion.id)
        )

        respuestas_pregunta = [
            e for e in respuestas if e.pregunta_id == updated.pregunta_activa_id
        ]
        await self.realtime.publish(
            "resultado_pregunta",
            {
                "pregunta_id": (
                    str(updated.pregunta_activa_id)
                    if updated.pregunta_activa_id
                    else None
                ),
                "respuestas": [entity_to_dict(r) for r in respuestas_pregunta],
                "estados": [e.a_dict() for e in estados.values()],
            },
            str(sesion.id),
        )

    async def existe_respuesta(self, pregunta_id: str, jugador_id: str) -> dict | None:
        respuesta_repo = RespuestaRepo(self.db)
        try:
            existe = await respuesta_repo.existe(
                uuid.UUID(pregunta_id), uuid.UUID(jugador_id)
            )
        except ValueError:
            return None
        if not existe:
            return None
        respuesta = await respuesta_repo.por_id_existente(
            uuid.UUID(pregunta_id), uuid.UUID(jugador_id)
        )
        if respuesta:
            data = entity_to_dict(respuesta)
            return data
        return None

    async def aprobar_abierta(
        self, respuesta_id: str, req: AprobarRespuestaRequest
    ) -> dict:
        """Replica de aprobar_respuesta_abierta: el docente aprueba y se calculan puntos."""
        respuesta_repo = RespuestaRepo(self.db)
        jugador_repo = JugadorRepo(self.db)
        pregunta_repo = PreguntaRepo(self.db)
        grado_repo = GradoRepo(self.db)

        respuesta = await respuesta_repo.por_id(uuid.UUID(respuesta_id))
        if not respuesta:
            raise DatosInvalidos("Respuesta no encontrada")

        await respuesta_repo.aprobar(respuesta.id, req.correcta)
        jugador: Jugador | None = None
        if req.correcta:
            jugador = await jugador_repo.por_id(respuesta.jugador_id)
            pregunta = await pregunta_repo.por_id(respuesta.pregunta_id)
            assert jugador and pregunta
            grado = await grado_repo.por_id(pregunta.grado_id)
            assert grado

            enviado = respuesta.enviado_en or _ahora()
            orden = (
                await respuesta_repo.contar_correctas_previas(
                    pregunta.id, jugador.sesion_id, enviado, 0
                )
                + 1
            )
            puntos = calcular_puntos(pregunta.puntos_por_puesto, orden)
            await respuesta_repo.asignar_puntos(respuesta.id, puntos)

        await self.db.commit()
        actualizada = await respuesta_repo.por_id(respuesta.id)
        data = entity_to_dict(actualizada) if actualizada else {}
        sesion_id = str(jugador.sesion_id) if jugador else None
        await self.realtime.publish("respuesta_cambio", data, sesion_id)
        return data


class PodiumUseCases:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def obtener(self, sesion_id: str) -> list[dict]:
        rows = await obtener_podium_rows(self.db, uuid.UUID(sesion_id))
        return [
            {
                "puesto": r.puesto,
                "nombre": r.nombre,
                "puntos_total": r.puntos_total,
                "es_colegio": r.es_colegio,
                "entity_id": str(r.entity_id),
                "aciertos": r.aciertos,
                "respondidas": r.respondidas,
            }
            for r in rows
        ]

    async def respuestas_sesion(
        self, sesion_id: str, pregunta_id: str | None = None
    ) -> list[dict]:
        pid = uuid.UUID(pregunta_id) if pregunta_id else None
        respuestas = await RespuestaRepo(self.db).listar_por_sesion(
            uuid.UUID(sesion_id), pid
        )
        return [entity_to_dict(r) for r in respuestas]

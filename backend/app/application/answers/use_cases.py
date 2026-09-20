from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import AprobarRespuestaRequest, EnviarRespuestaRequest
from app.application.ports import RealtimePublisher
from app.core.exceptions import (
    DatosInvalidos,
    PreguntaNoActiva,
    RespuestaDuplicada,
    SesionNoActiva,
)
from app.domain.entities import entity_to_dict
from app.domain.entities import Jugador
from app.domain.enums import EstadoSesion
from app.domain.rules import (
    calcular_puntos,
    corregir_reloj,
    es_correcta_opcion,
)
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

        if await respuesta_repo.existe(req.pregunta_id, req.jugador_id):
            raise RespuestaDuplicada()

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

        # Auto-cierre: si todos los CONECTADOS respondieron → resultado
        await self._auto_cerrar_si_todos(sesion, req.pregunta_id)

        return r_dict

    async def _auto_cerrar_si_todos(self, sesion, pregunta_id: uuid.UUID) -> None:
        """Replica del trigger auto_cerrar_cuando_todos_respondan."""
        sesion_repo = SesionRepo(self.db)
        jugador_repo = JugadorRepo(self.db)
        respuesta_repo = RespuestaRepo(self.db)

        total_conectados = await jugador_repo.contar_conectados(sesion.id)
        if total_conectados <= 0:
            return

        total_respuestas = await respuesta_repo.contar_por_pregunta_sesion(
            pregunta_id, sesion.id
        )
        if total_respuestas < total_conectados:
            return

        # Solo si la sesión sigue en pregunta (evita cerrar dos veces)
        sesion_actual = await sesion_repo.por_id(sesion.id)
        if sesion_actual and sesion_actual.estado == EstadoSesion.PREGUNTA.value:
            updated = await sesion_repo.actualizar(
                sesion.id, estado=EstadoSesion.RESULTADO.value
            )
            await self.db.commit()
            if updated:
                await self.realtime.publish(
                    "sesion_cambio", entity_to_dict(updated), str(sesion.id)
                )
                respuestas = await respuesta_repo.listar_por_sesion(sesion.id)
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
            }
            for r in rows
        ]

    async def respuestas_sesion(self, sesion_id: str) -> list[dict]:
        respuestas = await RespuestaRepo(self.db).listar_por_sesion(
            uuid.UUID(sesion_id)
        )
        return [entity_to_dict(r) for r in respuestas]

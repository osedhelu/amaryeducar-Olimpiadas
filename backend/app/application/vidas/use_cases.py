"""Caso de uso del sistema de vidas: lectura de estados y revivir jugadores."""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import RealtimePublisher
from app.core.exceptions import DatosInvalidos, PinNoEncontrado
from app.domain.vidas import calcular_estados_vidas, respuestas_error_ordenadas
from app.infrastructure.db.repositories import (
    JugadorRepo,
    ParametroRepo,
    PreguntaRepo,
    RespuestaRepo,
    SesionRepo,
)

VIDAS_HABILITADAS_CLAVE = "vidas_habilitadas"
VIDAS_POR_SESION_CLAVE = "vidas_por_sesion"


async def vidas_config(db: AsyncSession | None) -> tuple[bool, int]:
    """(habilitadas, vidas por sesión) leído de parámetros, con defaults."""
    if db is None:
        return True, 3
    repo = ParametroRepo(db)
    hab_raw = await repo.obtener(VIDAS_HABILITADAS_CLAVE, "true")
    max_raw = await repo.obtener(VIDAS_POR_SESION_CLAVE, "3")
    hab = str(hab_raw or "true").strip().lower() in ("true", "1", "si", "sí")
    try:
        max_vidas = max(1, int(str(max_raw).strip()))
    except (TypeError, ValueError):
        max_vidas = 3
    return hab, max_vidas


class VidasUseCases:
    def __init__(self, db: AsyncSession, realtime: RealtimePublisher | None = None):
        self.db = db
        self.realtime = realtime

    async def _datos(self, sesion_id: uuid.UUID):
        sesion = await SesionRepo(self.db).por_id(sesion_id)
        if not sesion:
            raise PinNoEncontrado()
        jugadores = await JugadorRepo(self.db).listar_por_sesion(sesion.id)
        respuestas = await RespuestaRepo(self.db).listar_por_sesion(sesion.id)
        preguntas = await PreguntaRepo(self.db).listar_por_grado(sesion.grado_id)
        return jugadores, respuestas, preguntas

    async def estado(self, sesion_id: str) -> list[dict]:
        jugadores, respuestas, preguntas = await self._datos(uuid.UUID(sesion_id))
        hab, max_vidas = await vidas_config(self.db)
        estados = calcular_estados_vidas(
            jugadores,
            respuestas,
            preguntas,
            habilitadas=hab,
            max_vidas=max_vidas,
        )
        out = [e.a_dict() for e in estados.values()]
        out.sort(
            key=lambda x: (x["eliminado"], x["conectado"] is False, x["nombre"].lower())
        )
        return out

    async def revivir(
        self, sesion_id: str, jugador_id: str, todas: bool = False
    ) -> dict:
        """Devuelve una vida (borra el error más reciente) o revive completo."""
        sid = uuid.UUID(sesion_id)
        jid = uuid.UUID(jugador_id)
        jugadores, respuestas, preguntas = await self._datos(sid)

        if jid not in {j.id for j in jugadores}:
            raise DatosInvalidos("El jugador no pertenece a esta sesión")

        hab, max_vidas = await vidas_config(self.db)
        if not hab:
            raise DatosInvalidos("El sistema de vidas está deshabilitado")

        errores = respuestas_error_ordenadas(jid, respuestas, preguntas)
        if errores:
            borrar = errores if todas else errores[-1:]
            await RespuestaRepo(self.db).eliminar_muchas([r.id for r in borrar])
            await self.db.commit()
            jugadores, respuestas, _ = await self._datos(sid)

        estado = self._estado_uno(jugadores, respuestas, preguntas, hab, max_vidas, jid)
        if self.realtime:
            await self.realtime.publish("vidas_cambio", estado, str(sid))
        return estado

    def _estado_uno(
        self,
        jugadores,
        respuestas,
        preguntas,
        hab: bool,
        max_vidas: int,
        jid: uuid.UUID,
    ) -> dict:
        estados = calcular_estados_vidas(
            jugadores, respuestas, preguntas, habilitadas=hab, max_vidas=max_vidas
        )
        return estados[jid].a_dict()

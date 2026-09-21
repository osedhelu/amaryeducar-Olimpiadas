from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import RealtimePublisher
from app.core.exceptions import DatosInvalidos
from app.domain.entities import entity_to_dict
from app.infrastructure.db.repositories import (
    ColegioRepo,
    JugadorRepo,
    PuntajeRetoRepo,
    RetoRepo,
)


class RetoUseCases:
    def __init__(self, db: AsyncSession, realtime: RealtimePublisher):
        self.db = db
        self.realtime = realtime

    async def asignar_puesto(
        self,
        reto_id: str,
        sesion_id: str,
        jugador_id: str | None,
        colegio_id: str | None,
        puesto: int,
    ) -> dict:
        """El jurado asigna un puesto del reto a un participante, en la sesión.

        - Retos individuales → `jugador_id`.
        - Retos grupales → `colegio_id`.
        - Los puntos quedan atados a la sesión (no se mezclan entre sesiones).
        - Un puesto solo puede tener un participante en la sesión: al asignarlo
          se limpia cualquier puntaje previo del mismo reto+sesión en ese puesto.
        - Un participante solo puede tener un puesto por reto en la sesión.
        """
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        puntos = int(reto.puntos_por_puesto.get(str(puesto), 0))
        if puntos <= 0:
            raise DatosInvalidos("El puesto no tiene puntos asignados en este reto")

        pid = uuid.UUID(jugador_id) if jugador_id else None
        cid = uuid.UUID(colegio_id) if colegio_id else None
        sid = uuid.UUID(sesion_id)
        if not pid and not cid:
            raise DatosInvalidos("Indica un jugador o un colegio")

        repo = PuntajeRetoRepo(self.db)
        existentes = await repo.listar_por_reto(reto.id, sid)

        # 1. Quitar el puesto a quien lo tuviera (posiciones únicas por sesión).
        for p in existentes:
            if p.puesto == int(puesto):
                await repo.eliminar_por_participante(
                    reto.id, sid, p.jugador_id, p.colegio_id
                )

        # 2. Quitar el puntaje previo del participante en esta sesión.
        await repo.eliminar_por_participante(reto.id, sid, pid, cid)

        # 3. Guardar el nuevo puntaje.
        await repo.upsert(reto.id, sid, pid, cid, puesto=int(puesto), puntos=puntos)
        await self.db.commit()

        await self.realtime.publish(
            "reto",
            {
                "reto_id": str(reto.id),
                "sesion_id": sesion_id,
                "nombre": reto.nombre,
                "puesto": int(puesto),
                "puntos": puntos,
                "jugador_id": jugador_id,
                "colegio_id": colegio_id,
            },
            sesion_id,
        )

        asignados = await repo.listar_por_reto(reto.id, sid)
        return {
            "reto_id": str(reto.id),
            "sesion_id": sesion_id,
            "puesto": int(puesto),
            "puntos": puntos,
            "puntajes": [entity_to_dict(p) for p in asignados],
        }

    async def listar_puntajes(self, reto_id: str, sesion_id: str) -> list[dict]:
        """Puntajes ya asignados de un reto en una sesión, con nombre del participante."""
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        sid = uuid.UUID(sesion_id)
        puntajes = await PuntajeRetoRepo(self.db).listar_por_reto(reto.id, sid)
        out = []
        for p in puntajes:
            d = entity_to_dict(p)
            d["nombre"] = await self._nombre_participante(p.jugador_id, p.colegio_id)
            out.append(d)
        return out

    async def quitar_puesto(
        self,
        reto_id: str,
        sesion_id: str,
        jugador_id: str | None,
        colegio_id: str | None,
    ) -> dict:
        """El jurado deshace/corrige un puesto ya asignado en la sesión."""
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        pid = uuid.UUID(jugador_id) if jugador_id else None
        cid = uuid.UUID(colegio_id) if colegio_id else None
        sid = uuid.UUID(sesion_id)
        repo = PuntajeRetoRepo(self.db)
        await repo.eliminar_por_participante(reto.id, sid, pid, cid)
        await self.db.commit()

        return {
            "reto_id": str(reto.id),
            "sesion_id": sesion_id,
            "jugador_id": jugador_id,
            "colegio_id": colegio_id,
            "puntajes": [
                entity_to_dict(p) for p in await repo.listar_por_reto(reto.id, sid)
            ],
        }

    async def _nombre_participante(
        self, jugador_id: uuid.UUID | None, colegio_id: uuid.UUID | None
    ) -> str | None:
        if jugador_id:
            j = await JugadorRepo(self.db).por_id(jugador_id)
            return j.nombre if j else None
        if colegio_id:
            c = await ColegioRepo(self.db).por_id(colegio_id)
            return c.nombre if c else None
        return None

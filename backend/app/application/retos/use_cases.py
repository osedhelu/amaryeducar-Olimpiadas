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
        jugador_id: str | None,
        colegio_id: str | None,
        puesto: int,
    ) -> dict:
        """El jurado asigna un puesto del reto a un participante.

        - Retos individuales → `jugador_id`.
        - Retos grupales → `colegio_id`.
        - Un puesto solo puede tener un participante: al asignarlo se limpia
          cualquier puntaje previo del mismo reto en ese puesto.
        - Un participante solo puede tener un puesto por reto (se reemplaza).
        """
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        puntos = int(reto.puntos_por_puesto.get(str(puesto), 0))
        if puntos <= 0:
            raise DatosInvalidos("El puesto no tiene puntos asignados en este reto")

        pid = uuid.UUID(jugador_id) if jugador_id else None
        cid = uuid.UUID(colegio_id) if colegio_id else None
        if not pid and not cid:
            raise DatosInvalidos("Indica un jugador o un colegio")

        repo = PuntajeRetoRepo(self.db)
        existentes = await repo.listar_por_reto(reto.id)

        # 1. Quitar el puesto a quien lo tuviera (posiciones únicas).
        for p in existentes:
            if p.puesto == int(puesto):
                await repo.eliminar_por_participante(
                    reto.id, p.jugador_id, p.colegio_id
                )

        # 2. Quitar el puntaje previo del participante (lo reemplaza).
        await repo.eliminar_por_participante(reto.id, pid, cid)

        # 3. Guardar el nuevo puntaje.
        await repo.upsert(reto.id, pid, cid, puesto=int(puesto), puntos=puntos)
        await self.db.commit()

        await self.realtime.publish(
            "reto",
            {
                "reto_id": str(reto.id),
                "nombre": reto.nombre,
                "puesto": int(puesto),
                "puntos": puntos,
                "jugador_id": jugador_id,
                "colegio_id": colegio_id,
            },
            None,
        )

        asignados = await repo.listar_por_reto(reto.id)
        return {
            "reto_id": str(reto.id),
            "puesto": int(puesto),
            "puntos": puntos,
            "puntajes": [entity_to_dict(p) for p in asignados],
        }

    async def listar_puntajes(self, reto_id: str) -> list[dict]:
        """Puntajes ya asignados de un reto, con nombre del jugador/colegio."""
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        puntajes = await PuntajeRetoRepo(self.db).listar_por_reto(reto.id)
        out = []
        for p in puntajes:
            d = entity_to_dict(p)
            d["nombre"] = await self._nombre_participante(p.jugador_id, p.colegio_id)
            out.append(d)
        return out

    async def quitar_puesto(
        self,
        reto_id: str,
        jugador_id: str | None,
        colegio_id: str | None,
    ) -> dict:
        """El jurado deshace/corrige un puesto ya asignado."""
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        pid = uuid.UUID(jugador_id) if jugador_id else None
        cid = uuid.UUID(colegio_id) if colegio_id else None
        await PuntajeRetoRepo(self.db).eliminar_por_participante(reto.id, pid, cid)
        await self.db.commit()

        return {
            "reto_id": str(reto.id),
            "jugador_id": jugador_id,
            "colegio_id": colegio_id,
            "puntajes": [
                entity_to_dict(p)
                for p in await PuntajeRetoRepo(self.db).listar_por_reto(reto.id)
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

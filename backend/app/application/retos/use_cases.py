from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.ports import RealtimePublisher
from app.core.exceptions import DatosInvalidos
from app.domain.entities import entity_to_dict
from app.infrastructure.db.repositories import (
    GradoRepo,
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
        reto = await RetoRepo(self.db).por_id(uuid.UUID(reto_id))
        if not reto:
            raise DatosInvalidos("Reto no encontrado")

        puntos = int(reto.puntos_por_puesto.get(str(puesto), 0))

        pid = uuid.UUID(jugador_id) if jugador_id else None
        cid = uuid.UUID(colegio_id) if colegio_id else None

        await PuntajeRetoRepo(self.db).upsert(
            reto.id, pid, cid, puesto=int(puesto), puntos=puntos
        )
        await self.db.commit()

        # Broadcast para que presente/estudiantes vean el reto resuelto
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
        return {"reto_id": str(reto.id), "puesto": int(puesto), "puntos": puntos}

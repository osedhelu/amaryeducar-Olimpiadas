from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import ActualizarPreguntaRequest, CrearPreguntaRequest
from app.core.exceptions import DatosInvalidos
from app.domain.entities import entity_to_dict
from app.infrastructure.db.repositories import GradoRepo, PreguntaRepo

# 6 MB de binario; el cliente comprime antes de subir.
MAX_IMAGEN_BYTES = 6 * 1024 * 1024
MIMES_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def _uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError) as exc:
        raise DatosInvalidos("Identificador inválido") from exc


class PreguntasUseCases:
    """CRUD de preguntas del banco del docente (no control de ronda)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def crear(self, body: CrearPreguntaRequest) -> dict:
        repo = PreguntaRepo(self.db)
        grado = await GradoRepo(self.db).por_id(body.grado_id)
        if not grado:
            raise DatosInvalidos("Grado no encontrado")

        orden = await repo.siguiente_orden(body.grado_id, body.sesion)
        puntos = body.puntos_por_puesto or (
            grado.puntos_sesion1 if body.sesion == "1" else grado.puntos_sesion2
        )
        pregunta = await repo.crear(
            {
                "grado_id": body.grado_id,
                "sesion": body.sesion,
                "tipo": body.tipo,
                "enunciado": body.enunciado,
                "opciones": body.opciones,
                "respuesta_correcta": body.respuesta_correcta,
                "tiempo_limite": body.tiempo_limite,
                "puntos_por_puesto": puntos,
                "orden": orden,
                "activa": True,
            }
        )
        await self.db.commit()
        return entity_to_dict(pregunta)

    async def actualizar(
        self, pregunta_id: str, body: ActualizarPreguntaRequest
    ) -> dict:
        data = body.model_dump(exclude_unset=True)
        pregunta = await PreguntaRepo(self.db).actualizar(_uuid(pregunta_id), data)
        if not pregunta:
            raise DatosInvalidos("Pregunta no encontrada")
        await self.db.commit()
        return entity_to_dict(pregunta)

    async def eliminar(self, pregunta_id: str) -> dict:
        # Borrado lógico: se conserva el historial de respuestas de la pregunta.
        pregunta = await PreguntaRepo(self.db).actualizar(
            _uuid(pregunta_id), {"activa": False}
        )
        if not pregunta:
            raise DatosInvalidos("Pregunta no encontrada")
        await self.db.commit()
        return entity_to_dict(pregunta)

    async def mover(self, pregunta_id: str, delta: int) -> dict:
        pregunta = await PreguntaRepo(self.db).mover(_uuid(pregunta_id), delta)
        if not pregunta:
            raise DatosInvalidos("Pregunta no encontrada")
        await self.db.commit()
        return entity_to_dict(pregunta)

    # ── Imagen ───────────────────────────────────────────────

    async def guardar_imagen(
        self,
        pregunta_id: str,
        mime: str,
        data: bytes,
        ancho: int | None,
        alto: int | None,
    ) -> dict:
        if mime not in MIMES_PERMITIDOS:
            raise DatosInvalidos("Formato no permitido (usa JPG, PNG, WEBP o GIF)")
        if not data:
            raise DatosInvalidos("La imagen está vacía")
        if len(data) > MAX_IMAGEN_BYTES:
            raise DatosInvalidos("La imagen supera los 6 MB")

        pid = _uuid(pregunta_id)
        repo = PreguntaRepo(self.db)
        if not await repo.por_id(pid):
            raise DatosInvalidos("Pregunta no encontrada")
        await repo.guardar_imagen(pid, mime, data, ancho, alto)
        await self.db.commit()
        pregunta = await repo.por_id(pid)
        return entity_to_dict(pregunta)

    async def obtener_imagen(self, pregunta_id: str) -> tuple[bytes, str] | None:
        return await PreguntaRepo(self.db).obtener_imagen(_uuid(pregunta_id))

    async def eliminar_imagen(self, pregunta_id: str) -> dict:
        pid = _uuid(pregunta_id)
        repo = PreguntaRepo(self.db)
        if not await repo.por_id(pid):
            raise DatosInvalidos("Pregunta no encontrada")
        await repo.eliminar_imagen(pid)
        await self.db.commit()
        pregunta = await repo.por_id(pid)
        return entity_to_dict(pregunta)

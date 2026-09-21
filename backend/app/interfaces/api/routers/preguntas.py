from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import (
    ActualizarPreguntaRequest,
    CrearPreguntaRequest,
    MoverPreguntaRequest,
)
from app.application.preguntas.use_cases import PreguntasUseCases
from app.core.exceptions import DomainError
from app.interfaces.api.deps import get_db, require_docente

router = APIRouter()


def _handle(exc: DomainError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


# ── CRUD (solo docente) ─────────────────────────────────────


@router.post("/preguntas")
async def crear_pregunta(
    body: CrearPreguntaRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),  # noqa: B008
) -> dict:
    try:
        return await PreguntasUseCases(db).crear(body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.patch("/preguntas/{pregunta_id}")
async def actualizar_pregunta(
    pregunta_id: str,
    body: ActualizarPreguntaRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),  # noqa: B008
) -> dict:
    try:
        return await PreguntasUseCases(db).actualizar(pregunta_id, body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.delete("/preguntas/{pregunta_id}")
async def eliminar_pregunta(
    pregunta_id: str,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),  # noqa: B008
) -> dict:
    """Borrado lógico: marca la pregunta como inactiva."""
    try:
        return await PreguntasUseCases(db).eliminar(pregunta_id)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.post("/preguntas/{pregunta_id}/mover")
async def mover_pregunta(
    pregunta_id: str,
    body: MoverPreguntaRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),  # noqa: B008
) -> dict:
    try:
        return await PreguntasUseCases(db).mover(pregunta_id, body.delta)
    except DomainError as exc:
        raise _handle(exc) from exc


# ── Imagen ──────────────────────────────────────────────────


@router.post("/preguntas/{pregunta_id}/imagen")
async def subir_imagen_pregunta(
    pregunta_id: str,
    archivo: UploadFile = File(...),
    ancho: int | None = Form(default=None),
    alto: int | None = Form(default=None),
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),  # noqa: B008
) -> dict:
    data = await archivo.read()
    mime = archivo.content_type or "application/octet-stream"
    try:
        return await PreguntasUseCases(db).guardar_imagen(
            pregunta_id, mime, data, ancho, alto
        )
    except DomainError as exc:
        raise _handle(exc) from exc


@router.get("/preguntas/{pregunta_id}/imagen")
async def obtener_imagen_pregunta(
    pregunta_id: str, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> Response:
    try:
        data = await PreguntasUseCases(db).obtener_imagen(pregunta_id)
    except DomainError as exc:
        raise _handle(exc) from exc
    if not data:
        raise HTTPException(status_code=404, detail="La pregunta no tiene imagen")
    contenido, mime = data
    return Response(
        content=contenido,
        media_type=mime,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


@router.delete("/preguntas/{pregunta_id}/imagen")
async def eliminar_imagen_pregunta(
    pregunta_id: str,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),  # noqa: B008
) -> dict:
    try:
        return await PreguntasUseCases(db).eliminar_imagen(pregunta_id)
    except DomainError as exc:
        raise _handle(exc) from exc

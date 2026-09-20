from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import (
    ActualizarAlumnoRequest,
    ActualizarColegioRequest,
    CrearAlumnoRequest,
    CrearColegioRequest,
    CrearDueloRequest,
)
from app.application.registro.use_cases import (
    DueloUseCases,
    EnfrentamientoUseCases,
    RegistroUseCases,
)
from app.core.exceptions import DomainError
from app.interfaces.api.deps import get_db, get_manager

router = APIRouter()


def _handle(exc: DomainError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)


# ── Colegios ────────────────────────────────────────────────


@router.get("/colegios")
async def listar_colegios(
    db: AsyncSession = Depends(get_db),
) -> list[dict]:  # noqa: B008
    return await RegistroUseCases(db).listar_colegios()


@router.post("/colegios")
async def crear_colegio(
    body: CrearColegioRequest, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> dict:
    try:
        return await RegistroUseCases(db).crear_colegio(body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.patch("/colegios/{colegio_id}")
async def actualizar_colegio(
    colegio_id: str,
    body: ActualizarColegioRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await RegistroUseCases(db).actualizar_colegio(colegio_id, body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.delete("/colegios/{colegio_id}")
async def eliminar_colegio(
    colegio_id: str, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> dict:
    try:
        return await RegistroUseCases(db).eliminar_colegio(colegio_id)
    except DomainError as exc:
        raise _handle(exc) from exc


# ── Alumnos ─────────────────────────────────────────────────


@router.get("/alumnos")
async def listar_alumnos(
    grado_id: str | None = None,
    colegio_id: str | None = None,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> list[dict]:
    return await RegistroUseCases(db).listar_alumnos(grado_id, colegio_id)


@router.post("/alumnos")
async def crear_alumno(
    body: CrearAlumnoRequest, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> dict:
    try:
        return await RegistroUseCases(db).crear_alumno(body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.patch("/alumnos/{alumno_id}")
async def actualizar_alumno(
    alumno_id: str,
    body: ActualizarAlumnoRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await RegistroUseCases(db).actualizar_alumno(alumno_id, body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.delete("/alumnos/{alumno_id}")
async def eliminar_alumno(
    alumno_id: str, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> dict:
    try:
        return await RegistroUseCases(db).eliminar_alumno(alumno_id)
    except DomainError as exc:
        raise _handle(exc) from exc


# ── Enfrentamiento (todos contra todos) ─────────────────────


@router.get("/tabla/{grado_id}")
async def tabla_grado(
    grado_id: str, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> list[dict]:
    return await EnfrentamientoUseCases(db).tabla_por_grado(grado_id)


# ── Duelo 1v1 (prueba) ──────────────────────────────────────


@router.post("/duelos")
async def crear_duelo(
    body: CrearDueloRequest, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> dict:
    try:
        return await DueloUseCases(db, get_manager()).crear(body)
    except DomainError as exc:
        raise _handle(exc) from exc


@router.get("/duelos")
async def listar_duelos(db: AsyncSession = Depends(get_db)) -> list[dict]:  # noqa: B008
    return await DueloUseCases(db, get_manager()).listar_duelos()

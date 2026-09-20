from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import (
    ActualizarSesionRequest,
    CrearSesionRequest,
)
from app.application.sessions.use_cases import ControlRondaUseCases, SesionUseCases
from app.core.exceptions import DomainError
from app.interfaces.api.deps import get_db, get_manager

router = APIRouter()


@router.post("/sessions")
async def crear_sesion(
    body: CrearSesionRequest, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    try:
        return await SesionUseCases(db, get_manager()).crear(body)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/sessions")
async def listar_sesiones(
    db: AsyncSession = Depends(get_db),
) -> list[dict]:  # noqa: B008
    return await SesionUseCases(db, get_manager()).listar()


@router.get("/sessions/by-pin/{pin}")
async def obtener_sesion_por_pin(
    pin: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    s = await SesionUseCases(db, get_manager()).obtener_por_pin(pin)
    if not s:
        raise HTTPException(status_code=404, detail="PIN no encontrado")
    return s


@router.get("/sessions/by-pin/{pin}/alumnos")
async def alumnos_por_pin(
    pin: str, db: AsyncSession = Depends(get_db)
) -> dict | None:  # noqa: B008
    from app.application.registro.use_cases import EnfrentamientoUseCases
    from app.core.exceptions import DomainError

    try:
        return await EnfrentamientoUseCases(db).alumnos_por_pin(pin)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/sessions/{sesion_id}")
async def obtener_sesion(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    s = await SesionUseCases(db, get_manager()).obtener(sesion_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return s


@router.get("/sessions/{sesion_id}/jugadores")
async def listar_jugadores(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict]:  # noqa: B008
    try:
        return await SesionUseCases(db, get_manager()).listar_jugadores(sesion_id)
    except (ValueError, DomainError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/sessions/{sesion_id}")
async def actualizar_sesion(
    sesion_id: str,
    body: ActualizarSesionRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await SesionUseCases(db, get_manager()).actualizar(sesion_id, body)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/sessions/{sesion_id}/finalizar")
async def finalizar_sesion(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    try:
        return await SesionUseCases(db, get_manager()).finalizar(sesion_id)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/preguntas")
async def listar_preguntas(
    grado_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict]:  # noqa: B008
    return await ControlRondaUseCases(db, get_manager()).listar_preguntas(grado_id)


@router.get("/preguntas/{pregunta_id}")
async def obtener_pregunta(
    pregunta_id: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    pregunta = await ControlRondaUseCases(db, get_manager()).obtener_pregunta(
        pregunta_id
    )
    if not pregunta:
        raise HTTPException(status_code=404, detail="Pregunta no encontrada")
    return pregunta


@router.get("/retos")
async def listar_retos(
    grado_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict]:  # noqa: B008
    return await ControlRondaUseCases(db, get_manager()).listar_retos(grado_id)


@router.post("/sessions/{sesion_id}/preguntas/{pregunta_id}/lanzar")
async def lanzar_pregunta(
    sesion_id: str,
    pregunta_id: str,
    db: AsyncSession = Depends(get_db),  # noqa: B008
    cronometro_segundos: int | None = None,
) -> dict:
    try:
        return await ControlRondaUseCases(db, get_manager()).lanzar_pregunta(
            sesion_id, pregunta_id, cronometro_segundos=cronometro_segundos
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/sessions/{sesion_id}/cerrar-pregunta")
async def cerrar_pregunta(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    try:
        return await ControlRondaUseCases(db, get_manager()).cerrar_pregunta(sesion_id)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/sessions/{sesion_id}/siguiente-pregunta")
async def siguiente_pregunta(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    try:
        return await ControlRondaUseCases(db, get_manager()).siguiente_pregunta(
            sesion_id
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/sessions/{sesion_id}/podium")
async def ir_a_podium(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    try:
        return await SesionUseCases(db, get_manager()).actualizar(
            sesion_id, ActualizarSesionRequest(estado="podium")
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/podium/{sesion_id}")
async def obtener_podium(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict]:  # noqa: B008
    from app.application.answers.use_cases import PodiumUseCases

    return await PodiumUseCases(db).obtener(sesion_id)


@router.get("/sessions/{sesion_id}/respuestas")
async def respuestas_sesion(
    sesion_id: str, db: AsyncSession = Depends(get_db)
) -> list[dict]:  # noqa: B008
    from app.application.answers.use_cases import PodiumUseCases

    return await PodiumUseCases(db).respuestas_sesion(sesion_id)

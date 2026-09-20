from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.answers.use_cases import RespuestaUseCases
from app.application.dto import AprobarRespuestaRequest, EnviarRespuestaRequest
from app.application.retos.use_cases import RetoUseCases
from app.core.exceptions import DomainError
from app.interfaces.api.deps import get_db, get_manager

router = APIRouter()


@router.post("/answers")
async def enviar_respuesta(
    body: EnviarRespuestaRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await RespuestaUseCases(db, get_manager()).enviar(body)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/answers/check")
async def verificar_respuesta(
    pregunta_id: str,
    jugador_id: str,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict | None:
    return await RespuestaUseCases(db, get_manager()).existe_respuesta(
        pregunta_id, jugador_id
    )


@router.patch("/answers/{respuesta_id}/aprobar")
async def aprobar_respuesta(
    respuesta_id: str,
    body: AprobarRespuestaRequest,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await RespuestaUseCases(db, get_manager()).aprobar_abierta(
            respuesta_id, body
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/retos/{reto_id}/puestos")
async def asignar_puesto(
    reto_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await RetoUseCases(db, get_manager()).asignar_puesto(
            reto_id,
            jugador_id=body.get("jugador_id"),
            colegio_id=body.get("colegio_id"),
            puesto=body.get("puesto") or 0,
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/retos/{reto_id}/puntajes")
async def listar_puntajes_reto(
    reto_id: str, db: AsyncSession = Depends(get_db)  # noqa: B008
) -> list[dict]:
    try:
        return await RetoUseCases(db, get_manager()).listar_puntajes(reto_id)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.delete("/retos/{reto_id}/puestos")
async def quitar_puesto(
    reto_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),  # noqa: B008
) -> dict:
    try:
        return await RetoUseCases(db, get_manager()).quitar_puesto(
            reto_id,
            jugador_id=body.get("jugador_id"),
            colegio_id=body.get("colegio_id"),
        )
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

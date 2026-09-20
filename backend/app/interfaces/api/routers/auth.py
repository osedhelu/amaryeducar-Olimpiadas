from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.application.dto import JoinRequest
from app.application.sessions.use_cases import AuthUseCases, SesionUseCases
from app.core.exceptions import DomainError
from app.interfaces.api.deps import get_db, get_manager
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post("/auth/login")
async def login(
    body: dict[str, str], db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    uc = AuthUseCases(db)
    try:
        return await uc.login_docente(body.get("clave", ""))
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/auth/student")
async def student_token(
    body: dict[str, str], db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    uc = AuthUseCases(db)
    jugador_id = body.get("jugadorId", "")
    sesion_id = body.get("sesionId", "")
    if not jugador_id or not sesion_id:
        raise HTTPException(status_code=400, detail="Faltan jugadorId/sesionId")
    return await uc.token_estudiante(jugador_id, sesion_id)


@router.get("/auth/anon")
async def anon_token(db: AsyncSession = Depends(get_db)) -> dict:  # noqa: B008
    uc = AuthUseCases(db)
    return await uc.token_anonimo()


@router.post("/session/join")
async def join_session(
    body: JoinRequest, db: AsyncSession = Depends(get_db)
) -> dict:  # noqa: B008
    manager = get_manager()
    uc = SesionUseCases(db, manager)
    try:
        return await uc.unirse(body)
    except DomainError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/grados")
async def grados(db: AsyncSession = Depends(get_db)) -> list[dict]:  # noqa: B008
    return await AuthUseCases(db).listar_grados()


@router.get("/colegios")
async def colegios(db: AsyncSession = Depends(get_db)) -> list[dict]:  # noqa: B008
    return await AuthUseCases(db).listar_colegios()

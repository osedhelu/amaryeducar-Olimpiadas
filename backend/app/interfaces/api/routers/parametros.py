from __future__ import annotations

from fastapi import APIRouter, Body, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.sessions.use_cases import AuthUseCases
from app.interfaces.api.deps import get_db, require_docente

router = APIRouter()


@router.get("/parametros")
async def listar_parametros(db: AsyncSession = Depends(get_db)) -> dict:  # noqa: B008
    return await AuthUseCases(db).listar_parametros(incluir_secretos=False)


@router.get("/parametros/admin")
async def listar_parametros_admin(
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),
) -> dict:
    return await AuthUseCases(db).listar_parametros(incluir_secretos=True)


@router.put("/parametros")
async def actualizar_parametros(
    body: dict[str, str] = Body(default_factory=dict),
    db: AsyncSession = Depends(get_db),  # noqa: B008
    _: dict = Depends(require_docente),
) -> dict:
    return await AuthUseCases(db).actualizar_parametros(body)

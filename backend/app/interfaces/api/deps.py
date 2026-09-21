from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.exceptions import DomainError
from app.core.security import verificar_jwt
from app.infrastructure.db.session import get_db
from app.infrastructure.realtime.manager import ConnectionManager


def get_manager() -> ConnectionManager:
    # El manager es un singleton creado en app.main
    from app.main import manager

    return manager


def get_current_usuario(
    authorization: str | None = None,
) -> dict | None:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        payload = verificar_jwt(token)
        if payload:
            return payload
    return None


def require_docente(
    authorization: str | None = Header(default=None),
) -> dict:
    payload = get_current_usuario(authorization)
    if not payload or payload.get("role") != "docente":
        raise HTTPException(status_code=401, detail="No autorizado")
    return payload


def require_estudiante(
    authorization: str | None = Header(default=None),
) -> dict:
    payload = get_current_usuario(authorization)
    if not payload or payload.get("role") not in ("estudiante", "docente"):
        raise HTTPException(status_code=401, detail="No autorizado")
    return payload


def error_handler(exc: DomainError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.message)

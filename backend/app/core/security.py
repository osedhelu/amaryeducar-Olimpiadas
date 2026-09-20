from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import get_settings
from app.domain.enums import RolJWT


def _now() -> datetime:
    return datetime.now(timezone.utc)


def crear_jwt(
    role: str,
    jugador_id: str | None = None,
    sesion_id: str | None = None,
) -> str:
    settings = get_settings()
    payload: dict = {
        "role": role,
        "iat": _now(),
    }
    if jugador_id:
        payload["jugador_id"] = jugador_id
    if sesion_id:
        payload["sesion_id"] = sesion_id

    if role == RolJWT.DOCENTE.value:
        payload["exp"] = _now() + timedelta(seconds=settings.jwt_docente_expires)
    elif role == RolJWT.ESTUDIANTE.value:
        payload["exp"] = _now() + timedelta(seconds=settings.jwt_estudiante_expires)
    else:
        payload["exp"] = _now() + timedelta(seconds=86400)

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verificar_jwt(token: str) -> dict | None:
    settings = get_settings()
    try:
        return jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError:
        return None


def validar_clave_admin(clave: str) -> bool:
    return clave == get_settings().clave_admin

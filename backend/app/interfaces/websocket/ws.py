from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.infrastructure.db.session import SessionLocal
from app.infrastructure.db.repositories import JugadorRepo
from app.infrastructure.realtime.manager import ConnectionManager

logger = logging.getLogger("ws")
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    role = ws.query_params.get("role", "presentacion")
    session_id = ws.query_params.get("sessionId", "")
    jugador_id = ws.query_params.get("jugadorId", "")

    manager: ConnectionManager = ws.app.state.manager
    await manager.conectar(ws, role, session_id, jugador_id)

    # Marcar conectado al estudiante en la BD
    if role == "student" and jugador_id:
        try:
            async with SessionLocal() as db:
                await JugadorRepo(db).marcar_conectado(jugador_id, True)
                await db.commit()
        except Exception as exc:  # noqa: BLE001
            logger.warning("No se pudo marcar conectado: %s", exc)

    try:
        while True:
            msg = await ws.receive_text()
            # heartbeat: cualquier mensaje del cliente indica que está vivo;
            # responder pong al ping del servidor para mantener is_alive.
            ws.is_alive = True  # type: ignore[attr-defined]
            if msg == "__ping__" or msg == "__pong__":
                await ws.send_text("__pong__")
    except WebSocketDisconnect:
        meta = manager.desconectar(ws)
    except Exception:  # noqa: BLE001
        meta = manager.desconectar(ws)
    finally:
        meta = manager.desconectar(ws)
        if meta and meta.get("role") == "student" and meta.get("jugador_id"):
            try:
                async with SessionLocal() as db:
                    await JugadorRepo(db).marcar_conectado(meta["jugador_id"], False)
                    await db.commit()
            except Exception:  # noqa: BLE001
                pass

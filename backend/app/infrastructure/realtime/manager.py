from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket

from app.application.ports import RealtimePublisher
from app.core.config import get_settings

logger = logging.getLogger("realtime")


class ConnectionManager(RealtimePublisher):
    """Maneja todas las conexiones WebSocket por sala de sesión.

    - `_rooms[session_id]` → conjunto de WebSockets de esa sesión
    - `_clients[ws]` → metadatos (role, session_id, jugador_id)
    - El rol `admin` recibe TODAS las sesiones.
    - Heartbeat nativo: cada 30s se envía PING y se terminan los que no respondan.
    """

    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = {}
        self._clients: dict[WebSocket, dict[str, str]] = {}
        self._heartbeat_task: asyncio.Task | None = None

    # ── Ciclo de vida del servidor ──────────────────────────────────────

    async def start(self) -> None:
        settings = get_settings()
        self._heartbeat_task = asyncio.create_task(
            self._heartbeat_loop(settings.ws_heartbeat_seconds)
        )
        logger.info(
            "ConnectionManager iniciado con heartbeat cada %ss",
            settings.ws_heartbeat_seconds,
        )

    async def stop(self) -> None:
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass

    # ── Conexión / desconexión ──────────────────────────────────────────

    async def conectar(
        self, ws: WebSocket, role: str, session_id: str, jugador_id: str = ""
    ) -> None:
        await ws.accept()

        # Deduplicación: si el mismo estudiante ya tiene una conexión abierta
        # (misma sesión y mismo jugador), cerrar la conexión anterior para
        # evitar que "el mismo usuario se conecte 2 veces".
        if role == "student" and jugador_id:
            for ws_ant, meta_ant in list(self._clients.items()):
                if (
                    meta_ant.get("role") == "student"
                    and meta_ant.get("jugador_id") == jugador_id
                    and meta_ant.get("session_id") == session_id
                    and ws_ant is not ws
                ):
                    logger.info(
                        "Cerrando WS duplicado del jugador %s (sesión %s)",
                        jugador_id,
                        session_id,
                    )
                    try:
                        await ws_ant.close(
                            code=1000, reason="reemplazado por nueva conexión"
                        )
                    except Exception:  # noqa: BLE001
                        pass
                    self.desconectar(ws_ant)

        ws.is_alive = True  # type: ignore[attr-defined]

        self._clients[ws] = {
            "role": role,
            "session_id": session_id,
            "jugador_id": jugador_id,
        }
        self._rooms.setdefault(session_id, set()).add(ws)
        logger.info(
            "WS conectado: role=%s session=%s total=%d",
            role,
            session_id,
            len(self._clients),
        )

    def desconectar(self, ws: WebSocket) -> dict[str, str] | None:
        meta = self._clients.pop(ws, None)
        if meta:
            room = self._rooms.get(meta["session_id"])
            if room:
                room.discard(ws)
                if not room:
                    self._rooms.pop(meta["session_id"], None)
        return meta

    # ── Envío ───────────────────────────────────────────────────────────

    async def enviar(self, ws: WebSocket, mensaje: dict[str, Any]) -> None:
        try:
            if ws.client_state and ws.client_state.name == "CONNECTED":
                await ws.send_json(mensaje)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Error enviando mensaje: %s", exc)

    async def broadcast(
        self, mensaje: dict[str, Any], sesion_id: str | None = None
    ) -> None:
        """Envía a una sala concreta o a todas si sesion_id es None."""
        targets: set[WebSocket] = set()
        if sesion_id and sesion_id in self._rooms:
            targets.update(self._rooms[sesion_id])
        elif sesion_id is None:
            for room in self._rooms.values():
                targets.update(room)
        for ws in targets:
            await self.enviar(ws, mensaje)

    # ── Implementación de RealtimePublisher ─────────────────────────────

    async def publicar_evento(
        self,
        tipo: str,
        data: dict[str, Any],
        sesion_id: str | None = None,
    ) -> None:
        """Enviar a la sala de la sesión + a todos los admins."""
        mensaje: dict[str, Any] = {
            "tipo": tipo,
            "data": data,
            "ts": datetime.now(timezone.utc).isoformat(),
        }
        for ws, meta in list(self._clients.items()):
            if meta["role"] == "admin":
                await self.enviar(ws, mensaje)
            elif sesion_id is not None and meta["session_id"] == sesion_id:
                await self.enviar(ws, mensaje)

    # ── Alias públicos (los usa el resto de la app) ─────────────────────

    async def publish(
        self, tipo: str, data: dict[str, Any], sesion_id: str | None = None
    ) -> None:
        await self.publicar_evento(tipo, data, sesion_id)

    async def broadcast_sesion(
        self, sesion_id: str, tipo: str, data: dict[str, Any]
    ) -> None:
        await self.publicar_evento(tipo, data, sesion_id)

    async def programar_cierre(
        self, sesion_id: str, cronometro_inicio: datetime, segundos: int
    ) -> None:
        """El cronómetro es SOLO VISUAL: la pregunta no se cierra por tiempo.

        El estudiante siempre puede responder. La pregunta se cierra cuando
        el último jugador conectado responde (auto-cierre en
        RespuestaUseCases) o cuando el docente la cierra a mano.
        """
        logger.info(
            "Sesión %s: cronómetro de %ss (visual; no cierra la pregunta)",
            sesion_id,
            segundos,
        )

    async def jugadores_conectados(self, sesion_id: str) -> list[str]:
        """IDs de jugadores con WebSocket abierto en la sesión."""
        return [
            meta["jugador_id"]
            for meta in self._clients.values()
            if meta.get("role") == "student"
            and meta.get("session_id") == sesion_id
            and meta.get("jugador_id")
        ]

    # ── Heartbeat ───────────────────────────────────────────────────────

    async def _heartbeat_loop(self, intervalo: int) -> None:
        while True:
            await asyncio.sleep(intervalo)
            for ws, meta in list(self._clients.items()):
                if not getattr(ws, "is_alive", True):
                    logger.info(
                        "Terminando WS inactivo session=%s", meta.get("session_id", "")
                    )
                    try:
                        await ws.close(code=1008, reason="heartbeat timeout")
                    except Exception:  # noqa: BLE001
                        pass
                    self.desconectar(ws)
                    continue
                ws.is_alive = False  # type: ignore[attr-defined]
                # Enviamos ping_keep=true como mensaje; el cliente responde pong
                try:
                    import json

                    await ws.send_text(json.dumps({"tipo": "__ping__"}))
                except Exception:  # noqa: BLE001
                    pass

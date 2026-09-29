"""Pruebas unitarias del WebSocket: ConnectionManager y endpoint /ws.

Validan que los eventos se envían a quien corresponde y que un estudiante
queda conectado/desconectado correctamente, sin tocar la red ni la BD real.
"""

from __future__ import annotations

import uuid
from types import SimpleNamespace

import pytest
from fastapi import WebSocketDisconnect

from app.infrastructure.realtime.manager import ConnectionManager
from tests.fakes import FakeWebSocket


@pytest.fixture
def manager():
    return ConnectionManager()


class TestConnectionManager:
    async def test_conectar_acepta_y_registra(self, manager):
        ws = FakeWebSocket()
        await manager.conectar(ws, "presentacion", "sesion-1")
        assert ws.accepted is True
        # Un broadcast a la sala le llega
        await manager.broadcast_sesion("sesion-1", "sesion_cambio", {"id": "sesion-1"})
        assert ws.recibio("sesion_cambio")

    async def test_publicar_llega_a_sala_y_admins_no_a_otras_salas(self, manager):
        admin = FakeWebSocket()
        estudiante_s1 = FakeWebSocket()
        estudiante_s2 = FakeWebSocket()
        await manager.conectar(admin, "admin", "")
        await manager.conectar(estudiante_s1, "student", "sesion-1", "jug-1")
        await manager.conectar(estudiante_s2, "student", "sesion-2", "jug-2")

        await manager.publish("respuesta_recibida", {"id": "r1"}, "sesion-1")

        # El admin recibe TODO; la sala 1 recibe; la sala 2 NO recibe.
        assert admin.recibio("respuesta_recibida")
        assert estudiante_s1.recibio("respuesta_recibida")
        assert not estudiante_s2.recibio("respuesta_recibida")

    async def test_mensaje_incluye_tipo_data_y_ts(self, manager):
        admin = FakeWebSocket()
        await manager.conectar(admin, "admin", "")
        await manager.publish("sesion_cambio", {"estado": "pregunta"}, "s1")
        msg = admin.sent_json[-1]
        assert msg["tipo"] == "sesion_cambio"
        assert msg["data"] == {"estado": "pregunta"}
        assert "ts" in msg and isinstance(msg["ts"], str)

    async def test_deduplicacion_cierra_socket_anterior_del_mismo_jugador(
        self, manager
    ):
        viejo = FakeWebSocket()
        nuevo = FakeWebSocket()
        await manager.conectar(viejo, "student", "sesion-1", "jug-1")
        await manager.conectar(nuevo, "student", "sesion-1", "jug-1")

        # El socket anterior se cerró y ya no recibe.
        assert viejo.closed is not None and viejo.closed[0] == 1000
        await manager.publish("respuesta_recibida", {"id": "r"}, "sesion-1")
        assert not viejo.recibio("respuesta_recibida")
        assert nuevo.recibio("respuesta_recibida")

    async def test_jugadores_conectados_solo_students_de_la_sesion(self, manager):
        await manager.conectar(FakeWebSocket(), "admin", "")
        await manager.conectar(FakeWebSocket(), "student", "s1", "jug-1")
        await manager.conectar(FakeWebSocket(), "student", "s1", "jug-2")
        await manager.conectar(FakeWebSocket(), "student", "s2", "jug-3")
        await manager.conectar(FakeWebSocket(), "presentacion", "s1")

        assert sorted(await manager.jugadores_conectados("s1")) == ["jug-1", "jug-2"]
        assert await manager.jugadores_conectados("s2") == ["jug-3"]

    async def test_desconectar_quita_de_la_sala(self, manager):
        ws = FakeWebSocket()
        await manager.conectar(ws, "student", "s1", "jug-1")
        manager.desconectar(ws)
        await manager.publish("respuesta_recibida", {"id": "r"}, "s1")
        assert not ws.recibio("respuesta_recibida")
        assert await manager.jugadores_conectados("s1") == []

    async def test_enviar_ignora_socket_desconectado(self, manager):
        ws = FakeWebSocket()  # nunca se acepta → client_state DISCONNECTED
        await manager.enviar(ws, {"tipo": "x"})
        assert ws.sent_json == []

    async def test_un_socket_que_falla_no_rompe_el_broadcast(self, manager):
        roto = FakeWebSocket()
        sano = FakeWebSocket()
        await manager.conectar(roto, "admin", "")
        await manager.conectar(sano, "student", "s1", "jug-1")

        async def _explota(_mensaje):
            raise RuntimeError("socket caído")

        roto.send_json = _explota  # type: ignore[assignment]
        await manager.publish("respuesta_recibida", {"id": "r"}, "s1")
        # El sano igual recibe; el error quedó contenido.
        assert sano.recibio("respuesta_recibida")


class _FakeSessionCtx:
    async def __aenter__(self):
        from tests.fakes import FakeDb

        return FakeDb()

    async def __aexit__(self, *args):
        return False


class EndpointWS(FakeWebSocket):
    """WebSocket para probar directamente el handler /ws."""

    def __init__(self, query: dict[str, str], manager: ConnectionManager):
        super().__init__()
        self.query_params = query
        self.app = SimpleNamespace(state=SimpleNamespace(manager=manager))

    async def receive_text(self) -> str:
        raise WebSocketDisconnect(1005)


class TestWebSocketEndpoint:
    async def test_student_sin_jugador_id_se_rechaza(self, manager):
        from app.interfaces.websocket import ws as ws_module

        ws = EndpointWS({"role": "student", "sessionId": "s1"}, manager)
        await ws_module.websocket_endpoint(ws)
        assert ws.accepted is True
        assert ws.closed is not None and ws.closed[0] == 4401
        # No quedó registrado en el manager.
        assert await manager.jugadores_conectados("s1") == []

    async def test_endpoint_registra_y_marca_conectado(self, manager, monkeypatch):
        from app.interfaces.websocket import ws as ws_module

        jugador_id = uuid.uuid4()
        llamadas: list[tuple[str, bool]] = []

        class _FakeJugadorRepo:
            def __init__(self, db):
                pass

            async def marcar_conectado(self, jid, conectado):
                llamadas.append((str(jid), conectado))

        monkeypatch.setattr(ws_module, "SessionLocal", lambda: _FakeSessionCtx())
        monkeypatch.setattr(ws_module, "JugadorRepo", _FakeJugadorRepo)

        ws = EndpointWS(
            {"role": "student", "sessionId": "s1", "jugadorId": str(jugador_id)},
            manager,
        )
        await ws_module.websocket_endpoint(ws)

        # Quedó registrado mientras estuvo abierto y se marcó conectado/desconectado.
        assert (str(jugador_id), True) in llamadas
        assert (str(jugador_id), False) in llamadas

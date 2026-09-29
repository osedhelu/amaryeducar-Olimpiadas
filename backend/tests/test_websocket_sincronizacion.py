"""Sincronización por WebSocket del flujo de respuesta.

Usa el ConnectionManager REAL con WebSockets falsos para verificar que:
  - los eventos llegan al admin y a la sala que corresponde,
  - NO se filtran a otras salas,
  - cuando un estudiante responde se publica `respuesta_recibida`,
  - al responder todos los conectados se publica `sesion_cambio` (resultado)
    y `resultado_pregunta`.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.application.answers.use_cases import RespuestaUseCases
from app.application.dto import (
    ActualizarSesionRequest,
    CrearSesionRequest,
    EnviarRespuestaRequest,
    JoinRequest,
)
from app.application.sessions.use_cases import SesionUseCases
from app.domain.enums import EstadoSesion
from app.infrastructure.realtime.manager import ConnectionManager
from tests.fakes import FakeWebSocket


@pytest.fixture
def manager():
    return ConnectionManager()


@pytest.fixture
def reloj():
    return [datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)]


@pytest.fixture
def uc_sesion(monkeypatch, repos, manager):
    import app.application.sessions.use_cases as uc
    from tests.fakes import FakeDb

    async def _pin(db=None):
        return "1234"

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "generar_pin_unico", _pin)
    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "GradoRepo", _factory(repos.grado))
    monkeypatch.setattr(uc, "AlumnoRepo", _factory(repos.alumno))
    return SesionUseCases(FakeDb(), manager)


@pytest.fixture
def uc_respuestas(monkeypatch, repos, manager, reloj):
    import app.application.answers.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
    monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
    monkeypatch.setattr(uc, "_ahora", lambda: reloj[0])
    return RespuestaUseCases(FakeDb(), manager)


async def _preparar_sala(uc_sesion, repos, grado, pregunta):
    repos.grado.grados[grado.id] = grado
    repos.pregunta.preguntas[pregunta.id] = pregunta
    sesion = await uc_sesion.crear(CrearSesionRequest(grado_id=grado.id))
    return sesion["id"]


async def _unir_y_conectar(manager, uc_sesion, repos, colegio_id, grado_id, nombre):
    alumno = await repos.alumno.crear(colegio_id, grado_id, nombre)
    res = await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=alumno.id))
    ws = FakeWebSocket()
    await manager.conectar(ws, "student", res["sesionId"], res["jugadorId"])
    return res, ws


async def test_respuesta_llega_al_admin_y_a_la_sala_no_a_otras(
    uc_sesion,
    uc_respuestas,
    repos,
    manager,
    grado_individual,
    colegio_1,
    pregunta_opciones,
):
    sesion_id = await _preparar_sala(
        uc_sesion, repos, grado_individual, pregunta_opciones
    )

    admin_ws = FakeWebSocket()
    await manager.conectar(admin_ws, "admin", "")
    otra_sala_ws = FakeWebSocket()
    await manager.conectar(otra_sala_ws, "student", "otra-sala", "jug-otro")

    ana, ana_ws = await _unir_y_conectar(
        manager, uc_sesion, repos, colegio_1.id, grado_individual.id, "Ana"
    )
    bruno, bruno_ws = await _unir_y_conectar(
        manager, uc_sesion, repos, colegio_1.id, grado_individual.id, "Bruno"
    )

    # El admin (conectado antes de las uniones) ve los jugador_unido.
    assert admin_ws.recibio("jugador_unido")

    # El docente lanza la pregunta.
    await uc_sesion.actualizar(
        sesion_id,
        ActualizarSesionRequest(
            estado=EstadoSesion.PREGUNTA.value,
            pregunta_activa_id=pregunta_opciones.id,
        ),
    )

    # Ana responde.
    await uc_respuestas.enviar(
        EnviarRespuestaRequest(
            pregunta_id=pregunta_opciones.id,
            jugador_id=uuid.UUID(ana["jugadorId"]),
            opcion_seleccionada="4",
            enviado_en=datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc),
        )
    )

    # El evento llegó al admin y a la sala (Ana y Bruno están en ella).
    assert admin_ws.recibio("respuesta_recibida")
    assert ana_ws.recibio("respuesta_recibida")
    assert bruno_ws.recibio("respuesta_recibida")
    # Y NO se filtró a la otra sala.
    assert not otra_sala_ws.recibio("respuesta_recibida")
    assert otra_sala_ws.sent_json == []


async def test_auto_cierre_publica_resultado_por_websocket(
    uc_sesion,
    uc_respuestas,
    repos,
    manager,
    grado_individual,
    colegio_1,
    pregunta_opciones,
):
    sesion_id = await _preparar_sala(
        uc_sesion, repos, grado_individual, pregunta_opciones
    )
    admin_ws = FakeWebSocket()
    await manager.conectar(admin_ws, "admin", "")

    ana, _ = await _unir_y_conectar(
        manager, uc_sesion, repos, colegio_1.id, grado_individual.id, "Ana"
    )
    bruno, _ = await _unir_y_conectar(
        manager, uc_sesion, repos, colegio_1.id, grado_individual.id, "Bruno"
    )

    await uc_sesion.actualizar(
        sesion_id,
        ActualizarSesionRequest(
            estado=EstadoSesion.PREGUNTA.value,
            pregunta_activa_id=pregunta_opciones.id,
        ),
    )

    base = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
    await uc_respuestas.enviar(
        EnviarRespuestaRequest(
            pregunta_id=pregunta_opciones.id,
            jugador_id=uuid.UUID(ana["jugadorId"]),
            opcion_seleccionada="4",
            enviado_en=base,
        )
    )
    # Todavía no cierra: falta Bruno.
    assert not any(m["tipo"] == "resultado_pregunta" for m in admin_ws.sent_json)

    # Bruno responde → todos los conectados respondieron → auto-cierre.
    await uc_respuestas.enviar(
        EnviarRespuestaRequest(
            pregunta_id=pregunta_opciones.id,
            jugador_id=uuid.UUID(bruno["jugadorId"]),
            opcion_seleccionada="4",
            enviado_en=base,
        )
    )

    assert admin_ws.recibio("resultado_pregunta")
    # El último sesion_cambio trae estado resultado.
    cambios = [m for m in admin_ws.sent_json if m["tipo"] == "sesion_cambio"]
    assert any(m["data"].get("estado") == EstadoSesion.RESULTADO.value for m in cambios)
    # El evento de resultado trae las respuestas de la sesión.
    resultado = next(m for m in admin_ws.sent_json if m["tipo"] == "resultado_pregunta")
    assert len(resultado["data"]["respuestas"]) == 2

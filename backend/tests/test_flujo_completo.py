"""Test de integración del flujo completo con 3 estudiantes escalonados.

Escenario (lo que pide el usuario):
  1. El profesor crea la sala (sesión en lobby).
  2. 3 estudiantes se conectan a la sala con el PIN.
  3. El profesor lanza la pregunta.
  4. Los 3 responden correctamente, escalonados en el tiempo:
       - Estudiante 1: responde bien y rápido (primero).
       - Estudiante 2: responde bien, ~1 minuto después del primero.
       - Estudiante 3: responde bien, después del segundo.
  5. Se valida que el orden es 1-2-3 y los puntos por puesto 20/10/5.

El anti-trampa corrige timestamps que se desvían >60s del reloj del servidor,
así que el reloj del servidor avanza con cada respuesta (simulación realista).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

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


@pytest.fixture
def reloj():
    """Reloj mutable del servidor para simular el paso del tiempo."""
    return [datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)]


@pytest.fixture
def uc_sesion(monkeypatch, repos, realtime, reloj):
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
    return SesionUseCases(FakeDb(), realtime)


@pytest.fixture
def uc_respuestas(monkeypatch, repos, realtime, reloj):
    import app.application.answers.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
    monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
    # El reloj del servidor avanza con cada llamada a _ahora()
    monkeypatch.setattr(uc, "_ahora", lambda: reloj[0])
    return RespuestaUseCases(FakeDb(), realtime)


async def _lanzar_pregunta(uc_sesion, sesion_id, pregunta_opciones):
    await uc_sesion.actualizar(
        sesion_id,
        ActualizarSesionRequest(
            estado=EstadoSesion.PREGUNTA.value,
            pregunta_activa_id=pregunta_opciones.id,
        ),
    )


async def _registrar_y_unir(repos, uc_sesion, colegio_id, grado_id, nombre):
    alumno = await repos.alumno.crear(colegio_id, grado_id, nombre)
    res = await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=alumno.id))
    assert res["nombre"] == nombre
    return res


async def test_flujo_completo_3_estudiantes_escalonados(
    uc_sesion,
    uc_respuestas,
    repos,
    realtime,
    reloj,
    grado_individual,
    colegio_1,
    pregunta_opciones,
):
    repos.grado.grados[grado_individual.id] = grado_individual
    repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

    # 1. El profesor crea la sala
    sesion = await uc_sesion.crear(CrearSesionRequest(grado_id=grado_individual.id))
    sesion_id = sesion["id"]
    assert sesion["estado"] == EstadoSesion.LOBBY.value

    # 2. Tres estudiantes (registrados) se conectan con el PIN
    conectados = []
    for nombre in ["Ana", "Bruno", "Carla"]:
        res = await _registrar_y_unir(
            repos, uc_sesion, colegio_1.id, grado_individual.id, nombre
        )
        conectados.append(res)
        assert res["sesionId"] == sesion_id
        assert res["jugadorId"]
    assert len(await repos.jugador.listar_por_sesion(uuid.UUID(sesion_id))) == 3

    # Eventos de unión: 3 jugador_unido
    tipos_unido = [e[0] for e in realtime.eventos if e[0] == "jugador_unido"]
    assert len(tipos_unido) == 3

    # 3. El profesor lanza la pregunta
    await _lanzar_pregunta(uc_sesion, sesion_id, pregunta_opciones)
    sesion_obj = await repos.sesion.por_id(uuid.UUID(sesion_id))
    assert sesion_obj and sesion_obj.estado == EstadoSesion.PREGUNTA.value

    # 4. Los 3 responden bien, escalonados (1º ahora, 2º +1min, 3º +2min)
    tiempos = {
        0: reloj[0],
        1: reloj[0] + timedelta(minutes=1),
        2: reloj[0] + timedelta(minutes=2),
    }

    respuestas = []
    for i, con in enumerate(conectados):
        # El reloj del servidor también avanza para que el desvío no dispare el anti-trampa
        reloj[0] = tiempos[i]
        r = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=uuid.UUID(con["jugadorId"]),
                opcion_seleccionada="4",
                enviado_en=tiempos[i],
            )
        )
        respuestas.append(r)

    # 5. Validaciones
    #    - Todos respondieron correctamente
    assert all(r["correcta"] is True for r in respuestas)
    #    - Orden 1-2-3 según velocidad
    assert [r["numero_orden"] for r in respuestas] == [1, 2, 3]
    #    - Puntos por puesto: 20 / 10 / 5
    assert [r["puntos"] for r in respuestas] == [20, 10, 5]

    #    - Auto-cierre: todos los conectados respondieron → resultado
    sesion_obj = await repos.sesion.por_id(uuid.UUID(sesion_id))
    assert sesion_obj and sesion_obj.estado == EstadoSesion.RESULTADO.value
    tipos = [e[0] for e in realtime.eventos]
    assert "resultado_pregunta" in tipos

    #    - El primer correcto es quien respondió primero
    assert respuestas[0]["jugador_nombre"] == "Ana"


async def test_flujo_completo_mezcla_bien_y_mal(
    uc_sesion,
    uc_respuestas,
    repos,
    realtime,
    reloj,
    grado_individual,
    colegio_1,
    pregunta_opciones,
):
    """El que acierta primero gana más puntos aunque otro acierte después;
    el que falla no suma, y un acierto tardío no supera a uno rápido."""
    repos.grado.grados[grado_individual.id] = grado_individual
    repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

    sesion = await uc_sesion.crear(CrearSesionRequest(grado_id=grado_individual.id))
    sesion_id = sesion["id"]
    conectados = [
        await _registrar_y_unir(
            repos, uc_sesion, colegio_1.id, grado_individual.id, "Ana"
        ),
        await _registrar_y_unir(
            repos, uc_sesion, colegio_1.id, grado_individual.id, "Bruno"
        ),
        await _registrar_y_unir(
            repos, uc_sesion, colegio_1.id, grado_individual.id, "Carla"
        ),
    ]
    await _lanzar_pregunta(uc_sesion, sesion_id, pregunta_opciones)

    t0 = reloj[0]
    resultados = {}
    opciones = {
        "Ana": ("4", t0),
        "Bruno": ("3", t0 + timedelta(minutes=1)),
        "Carla": ("4", t0 + timedelta(minutes=2)),
    }
    for con in conectados:
        opcion, t = opciones[con["nombre"]]
        reloj[0] = t
        r = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=uuid.UUID(con["jugadorId"]),
                opcion_seleccionada=opcion,
                enviado_en=t,
            )
        )
        resultados[con["nombre"]] = r

    assert resultados["Ana"]["correcta"] is True
    assert resultados["Ana"]["puntos"] == 20
    assert resultados["Bruno"]["correcta"] is False
    assert resultados["Bruno"]["puntos"] == 0
    assert resultados["Carla"]["correcta"] is True
    # Carla acierta tarde: no le quita el 20 a Ana, recibe el 2º puesto
    assert resultados["Carla"]["puntos"] == 10
    assert [resultados[n]["numero_orden"] for n in ("Ana", "Bruno", "Carla")] == [
        1,
        2,
        3,
    ]

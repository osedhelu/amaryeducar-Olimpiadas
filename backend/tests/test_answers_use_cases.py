"""Tests de envío de respuestas: puntos, orden, anti-trampa, idempotencia y auto-cierre."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.application.answers.use_cases import RespuestaUseCases
from app.application.dto import EnviarRespuestaRequest
from app.core.exceptions import DatosInvalidos, PreguntaNoActiva, SesionNoActiva
from app.domain.enums import EstadoSesion
from app.infrastructure.db.repositories import (
    JugadorRepo,
    PreguntaRepo,
    RespuestaRepo,
    SesionRepo,
)


@pytest.fixture
def uc_respuestas(monkeypatch, repos, realtime):
    """Instancia RespuestaUseCases con los repos fake inyectados."""
    import app.application.answers.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
    monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
    return RespuestaUseCases(FakeDb(), realtime)


def _sesion_en_pregunta(sesion_lobby, pregunta_opciones):
    sesion_lobby.estado = EstadoSesion.PREGUNTA.value
    sesion_lobby.pregunta_activa_id = pregunta_opciones.id
    return sesion_lobby


class TestEnviar:
    async def test_respuesta_correcta_primer_puesto_puntos_maximos(
        self, uc_respuestas, realtime, repos, sesion_lobby, jugador, pregunta_opciones
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        res = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=jugador.id,
                opcion_seleccionada="4",
            )
        )
        assert res["correcta"] is True
        assert res["puntos"] == 20
        assert res["numero_orden"] == 1
        assert res["jugador_nombre"] == "Ana"
        tipos = [e[0] for e in realtime.eventos]
        assert "respuesta_recibida" in tipos

    async def test_respuesta_incorrecta_puntos_cero(
        self, uc_respuestas, realtime, repos, sesion_lobby, jugador, pregunta_opciones
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        res = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=jugador.id,
                opcion_seleccionada="3",
            )
        )
        assert res["correcta"] is False
        assert res["puntos"] == 0

    async def test_segundo_correcto_recibe_menos_puntos(
        self,
        uc_respuestas,
        realtime,
        repos,
        sesion_lobby,
        pregunta_opciones,
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        j1 = await repos.jugador.crear(sesion_lobby.id, "J1")
        j2 = await repos.jugador.crear(sesion_lobby.id, "J2")
        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j1.id,
                opcion_seleccionada="4",
                enviado_en=datetime.now(timezone.utc),
            )
        )
        res = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j2.id,
                opcion_seleccionada="4",
                enviado_en=datetime.now(timezone.utc) + timedelta(seconds=1),
            )
        )
        assert res["puntos"] == 10

    async def test_jugador_inexistente_lanza_datos_invalidos(
        self, uc_respuestas, realtime, repos, sesion_lobby, pregunta_opciones
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        with pytest.raises(DatosInvalidos):
            await uc_respuestas.enviar(
                EnviarRespuestaRequest(
                    pregunta_id=pregunta_opciones.id,
                    jugador_id=uuid.uuid4(),
                    opcion_seleccionada="4",
                )
            )

    async def test_sesion_no_activa_lanza_sesion_no_activa(
        self, uc_respuestas, realtime, repos, sesion_lobby, jugador, pregunta_opciones
    ):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        with pytest.raises(SesionNoActiva):
            await uc_respuestas.enviar(
                EnviarRespuestaRequest(
                    pregunta_id=pregunta_opciones.id,
                    jugador_id=jugador.id,
                    opcion_seleccionada="4",
                )
            )

    async def test_pregunta_no_activa_lanza_pregunta_no_activa(
        self, uc_respuestas, realtime, repos, sesion_lobby, jugador, pregunta_opciones
    ):
        sesion_lobby.estado = EstadoSesion.PREGUNTA.value
        sesion_lobby.pregunta_activa_id = uuid.uuid4()  # distinta
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        with pytest.raises(PreguntaNoActiva):
            await uc_respuestas.enviar(
                EnviarRespuestaRequest(
                    pregunta_id=pregunta_opciones.id,
                    jugador_id=jugador.id,
                    opcion_seleccionada="4",
                )
            )

    async def test_reenvio_devuelve_respuesta_existente_sin_duplicar(
        self, uc_respuestas, realtime, repos, sesion_lobby, pregunta_opciones
    ):
        """Regresión del fix 409: reenvío/doble clic → devuelve la respuesta guardada.

        Usamos 2 jugadores conectados para que el primer envío no cierre la
        sesión (auto-cierre) y el reenvío ocurra con la sesión aún activa.
        """
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        j1 = await repos.jugador.crear(sesion_lobby.id, "J1")
        await repos.jugador.crear(sesion_lobby.id, "J2")
        primera = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j1.id,
                opcion_seleccionada="4",
            )
        )
        segunda = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j1.id,
                opcion_seleccionada="3",  # opción distinta
            )
        )
        assert segunda["id"] == primera["id"]
        assert segunda["puntos"] == primera["puntos"]
        assert len(repos.respuesta.respuestas) == 1

    async def test_anti_trampa_corrige_reloj_desviado(
        self, uc_respuestas, realtime, repos, sesion_lobby, jugador, pregunta_opciones
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        desviado = datetime.now(timezone.utc) - timedelta(minutes=5)
        res = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=jugador.id,
                opcion_seleccionada="4",
                enviado_en=desviado,
            )
        )
        # No se compara con el timestamp desviado en el orden: puntos intactos
        assert res["correcta"] is True
        assert res["puntos"] == 20


class TestPreguntaAbierta:
    async def test_abierta_no_calcula_puntos_y_queda_para_docente(
        self, uc_respuestas, realtime, repos, sesion_lobby, jugador, pregunta_abierta
    ):
        sesion_lobby.estado = EstadoSesion.PREGUNTA.value
        sesion_lobby.pregunta_activa_id = pregunta_abierta.id
        repos.pregunta.preguntas[pregunta_abierta.id] = pregunta_abierta
        res = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_abierta.id,
                jugador_id=jugador.id,
                texto_respuesta="Porque 2+2=4",
            )
        )
        assert res["correcta"] is None
        assert res["puntos"] == 0


class TestAutoCierre:
    async def test_cierra_sesion_cuando_todos_los_conectados_responden(
        self,
        uc_respuestas,
        realtime,
        repos,
        sesion_lobby,
        pregunta_opciones,
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        j1 = await repos.jugador.crear(sesion_lobby.id, "J1")
        j2 = await repos.jugador.crear(sesion_lobby.id, "J2")
        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j1.id,
                opcion_seleccionada="4",
            )
        )
        assert sesion_lobby.estado == EstadoSesion.PREGUNTA.value
        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j2.id,
                opcion_seleccionada="4",
            )
        )
        assert sesion_lobby.estado == EstadoSesion.RESULTADO.value
        tipos = [e[0] for e in realtime.eventos]
        assert "resultado_pregunta" in tipos
        assert "sesion_cambio" in tipos

    async def test_no_cierra_si_falta_alguien_por_responder(
        self, uc_respuestas, realtime, repos, sesion_lobby, pregunta_opciones
    ):
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        j1 = await repos.jugador.crear(sesion_lobby.id, "J1")
        await repos.jugador.crear(sesion_lobby.id, "J2")
        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j1.id,
                opcion_seleccionada="4",
            )
        )
        assert sesion_lobby.estado == EstadoSesion.PREGUNTA.value

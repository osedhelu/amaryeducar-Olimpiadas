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


class TestRespuestasSesionFiltro:
    """Regresión: la pantalla de resultados NO debe mostrar una fila por
    pregunta respondida (nombres repetidos). Se filtra por pregunta activa."""

    async def test_respuestas_sesion_filtra_por_pregunta(
        self, monkeypatch, repos, grado_individual
    ):
        import app.application.answers.use_cases as uc
        from app.domain.entities import Pregunta, Respuesta
        from tests.fakes import FakeDb

        def _factory(fake):
            return lambda db=None: fake

        monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))

        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        p1 = Pregunta(
            id=uuid.uuid4(), grado_id=grado_individual.id, enunciado="P1", orden=1
        )
        p2 = Pregunta(
            id=uuid.uuid4(), grado_id=grado_individual.id, enunciado="P2", orden=2
        )
        sesion_id = uuid.uuid4()
        jugador_id = uuid.uuid4()
        # Dos preguntas respondidas por el mismo jugador
        for i, p in enumerate((p1, p2)):
            repos.respuesta.respuestas[uuid.uuid4()] = Respuesta(
                id=uuid.uuid4(),
                pregunta_id=p.id,
                jugador_id=jugador_id,
                opcion_seleccionada="4",
                correcta=True,
                enviado_en=now,
                secuencia=i + 1,
                numero_orden=i + 1,
                puntos=20,
            )

        caso = uc.PodiumUseCases(FakeDb())
        todas = await caso.respuestas_sesion(str(sesion_id))
        assert len(todas) == 2  # sin filtro: ambas preguntas
        solo_p1 = await caso.respuestas_sesion(str(sesion_id), str(p1.id))
        assert len(solo_p1) == 1
        assert solo_p1[0]["pregunta_id"] == str(p1.id)


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

    async def test_el_ultimo_conectado_cierra_y_publica_todos_los_eventos(
        self, uc_respuestas, realtime, repos, sesion_lobby, pregunta_opciones
    ):
        """Precisión: N-1 respuestas NO cierran; la enésima cierra y publica
        sesion_cambio + resultado_pregunta con TODAS las respuestas."""
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
        # falta el último: sigue en pregunta, sin evento de resultado
        assert sesion_lobby.estado == EstadoSesion.PREGUNTA.value
        assert "resultado_pregunta" not in [e[0] for e in realtime.eventos]

        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j2.id,
                opcion_seleccionada="4",
            )
        )
        assert sesion_lobby.estado == EstadoSesion.RESULTADO.value
        tipos = [e[0] for e in realtime.eventos]
        assert "sesion_cambio" in tipos
        assert "resultado_pregunta" in tipos
        # resultado_pregunta lleva las DOS respuestas
        ev = next(e for e in realtime.eventos if e[0] == "resultado_pregunta")
        assert len(ev[1]["respuestas"]) == 2

    async def test_no_cuenta_jugador_desconectado_en_el_umbral(
        self, uc_respuestas, realtime, repos, sesion_lobby, pregunta_opciones
    ):
        """Precisión: un jugador conectado=false NO cuenta para el cierre."""
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        j1 = await repos.jugador.crear(sesion_lobby.id, "J1")  # conectado
        j2 = await repos.jugador.crear(sesion_lobby.id, "J2")
        await repos.jugador.actualizar(j2.id, conectado=False)

        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=pregunta_opciones.id,
                jugador_id=j1.id,
                opcion_seleccionada="4",
            )
        )
        # 1 conectado respondió de 1 conectado → cierra (j2 no cuenta)
        assert sesion_lobby.estado == EstadoSesion.RESULTADO.value

    async def test_publica_resultado_aunque_la_sesion_ya_este_en_resultado(
        self, uc_respuestas, realtime, repos, sesion_lobby, pregunta_opciones
    ):
        """Regresión: un trigger legacy de la BD puede dejar la sesión en
        'resultado' antes de que el backend publique. El auto-cierre debe emitir
        los eventos de todos modos para que el frontend siempre avise."""
        _sesion_en_pregunta(sesion_lobby, pregunta_opciones)
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        j1 = await repos.jugador.crear(sesion_lobby.id, "J1")
        # respuesta ya guardada del único conectado
        await repos.respuesta.crear(
            pregunta_id=pregunta_opciones.id,
            jugador_id=j1.id,
            opcion="4",
            texto=None,
            correcta=True,
            enviado_en=datetime.now(timezone.utc),
            numero_orden=1,
            puntos=20,
        )
        # simula que la BD (trigger) ya cerró la sesión
        sesion_lobby.estado = EstadoSesion.RESULTADO.value

        await uc_respuestas._auto_cerrar_si_todos(sesion_lobby, pregunta_opciones.id)

        tipos = [e[0] for e in realtime.eventos]
        assert "sesion_cambio" in tipos
        assert "resultado_pregunta" in tipos

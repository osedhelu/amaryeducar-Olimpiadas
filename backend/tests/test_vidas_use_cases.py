"""Tests del sistema de vidas por sesión.

- Tres errores de opción múltiple eliminan al jugador.
- Las preguntas abiertas nunca quitan vida.
- `enviar` rechaza respuestas de jugadores eliminados (SinVidas).
- El auto-cierre no espera a los eliminados.
- `revivir` devuelve una vida (o todas) borrando errores.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.application.answers.use_cases import RespuestaUseCases
from app.application.dto import EnviarRespuestaRequest
from app.application.vidas.use_cases import VidasUseCases
from app.core.exceptions import SinVidas
from app.domain.enums import EstadoSesion


@pytest.fixture
def uc_vidas(monkeypatch, repos):
    """VidasUseCases con los repos fake inyectados."""
    import app.application.vidas.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
    monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
    return VidasUseCases(FakeDb())


@pytest.fixture
def uc_vidas_realtime(monkeypatch, repos, realtime):
    """VidasUseCases con realtime para publicar vidas_cambio al revivir."""
    import app.application.vidas.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
    monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
    return VidasUseCases(FakeDb(), realtime)


def _n_preguntas(repos, grado_id, n, tipo="opcion-multiple"):
    from app.domain.entities import Pregunta

    out = []
    for i in range(n):
        p = Pregunta(
            id=uuid.uuid4(),
            grado_id=grado_id,
            tipo=tipo,
            enunciado=f"P{i}",
            opciones=["A", "B", "C", "D"],
            respuesta_correcta="A",
            orden=i + 1,
            activa=True,
            puntos_por_puesto={"1": 20, "2": 10},
        )
        repos.pregunta.preguntas[p.id] = p
        out.append(p)
    return out


class TestCalcularVidas:
    async def test_sin_errores_tiene_todas_las_vidas(
        self, repos, sesion_lobby, jugador, uc_vidas, grado_individual
    ):
        _n_preguntas(repos, grado_individual.id, 1)
        estados = await uc_vidas.estado(str(sesion_lobby.id))
        assert len(estados) == 1
        e = estados[0]
        assert e["vidas_restantes"] == 3
        assert e["vidas_max"] == 3
        assert e["eliminado"] is False

    async def test_un_error_resta_una_vida(
        self, repos, sesion_lobby, jugador, uc_vidas, grado_individual
    ):
        p = _n_preguntas(repos, grado_individual.id, 1)[0]
        now = datetime.now(timezone.utc)
        await repos.respuesta.crear(p.id, jugador.id, "B", None, False, now, 1, 0)
        e = (await uc_vidas.estado(str(sesion_lobby.id)))[0]
        assert e["errores"] == 1
        assert e["vidas_restantes"] == 2
        assert e["eliminado"] is False

    async def test_tres_errores_eliminan(
        self, repos, sesion_lobby, jugador, uc_vidas, grado_individual
    ):
        ps = _n_preguntas(repos, grado_individual.id, 3)
        now = datetime.now(timezone.utc)
        for i, p in enumerate(ps):
            await repos.respuesta.crear(
                p.id, jugador.id, "B", None, False, now, i + 1, 0
            )
        e = (await uc_vidas.estado(str(sesion_lobby.id)))[0]
        assert e["errores"] == 3
        assert e["vidas_restantes"] == 0
        assert e["eliminado"] is True

    async def test_abierta_incorrecta_no_resta_vida(
        self, repos, sesion_lobby, jugador, uc_vidas, grado_individual
    ):
        p_abierta = _n_preguntas(repos, grado_individual.id, 1, tipo="abierta")[0]
        now = datetime.now(timezone.utc)
        await repos.respuesta.crear(
            p_abierta.id,
            jugador.id,
            None,
            "texto",
            False,
            now,
            1,
            0,
        )
        e = (await uc_vidas.estado(str(sesion_lobby.id)))[0]
        assert e["errores"] == 0
        assert e["vidas_restantes"] == 3
        assert e["eliminado"] is False


class TestEnviarRechazaEliminado:
    @pytest.fixture
    def uc_respuestas(self, monkeypatch, repos, realtime):
        import app.application.answers.use_cases as uc
        from tests.fakes import FakeDb

        def _factory(fake):
            return lambda db=None: fake

        monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
        monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
        monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
        monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
        return RespuestaUseCases(FakeDb(), realtime)

    async def test_jugador_sin_vidas_no_puede_responder(
        self,
        uc_respuestas,
        repos,
        realtime,
        sesion_lobby,
        jugador,
        grado_individual,
    ):
        ps = _n_preguntas(repos, grado_individual.id, 4)
        now = datetime.now(timezone.utc)
        for i, p in enumerate(ps[:3]):
            await repos.respuesta.crear(
                p.id, jugador.id, "B", None, False, now, i + 1, 0
            )
        # 4º conectado de apoyo para que el auto-cierre no dependa del eliminado
        otro = await repos.jugador.crear(sesion_lobby.id, "Otra")

        sesion_lobby.estado = EstadoSesion.PREGUNTA.value
        sesion_lobby.pregunta_activa_id = ps[3].id

        with pytest.raises(SinVidas):
            await uc_respuestas.enviar(
                EnviarRespuestaRequest(
                    pregunta_id=ps[3].id,
                    jugador_id=jugador.id,
                    opcion_seleccionada="A",
                )
            )

        # El jugador de apoyo sí puede responder
        res = await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=ps[3].id,
                jugador_id=otro.id,
                opcion_seleccionada="A",
            )
        )
        assert res["correcta"] is True


class TestAutoCierreIgnoraEliminados:
    @pytest.fixture
    def uc_respuestas(self, monkeypatch, repos, realtime):
        import app.application.answers.use_cases as uc
        from tests.fakes import FakeDb

        def _factory(fake):
            return lambda db=None: fake

        monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
        monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
        monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
        monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
        return RespuestaUseCases(FakeDb(), realtime)

    async def test_cierra_sin_esperar_al_eliminado(
        self,
        uc_respuestas,
        repos,
        realtime,
        sesion_lobby,
        grado_individual,
    ):
        ps = _n_preguntas(repos, grado_individual.id, 4)
        now = datetime.now(timezone.utc)
        eliminado = await repos.jugador.crear(sesion_lobby.id, "Eliminado")
        vivo = await repos.jugador.crear(sesion_lobby.id, "Vivo")
        for i, p in enumerate(ps[:3]):
            await repos.respuesta.crear(
                p.id, eliminado.id, "B", None, False, now, i + 1, 0
            )

        sesion_lobby.estado = EstadoSesion.PREGUNTA.value
        sesion_lobby.pregunta_activa_id = ps[3].id

        await uc_respuestas.enviar(
            EnviarRespuestaRequest(
                pregunta_id=ps[3].id,
                jugador_id=vivo.id,
                opcion_seleccionada="A",
            )
        )

        # El único conectado con vidas respondió → resultado, sin esperar al
        # eliminado que no respondió esta pregunta.
        assert sesion_lobby.estado == EstadoSesion.RESULTADO.value
        tipos = [e[0] for e in realtime.eventos]
        assert "resultado_pregunta" in tipos
        ev = next(e for e in realtime.eventos if e[0] == "resultado_pregunta")
        assert len(ev[1]["respuestas"]) == 1
        assert ev[1]["estados"]
        eliminado_estado = next(
            e for e in ev[1]["estados"] if e["nombre"] == "Eliminado"
        )
        assert eliminado_estado["eliminado"] is True


class TestRevivir:
    async def test_revivir_devuelve_una_vida(
        self,
        uc_vidas_realtime,
        repos,
        realtime,
        sesion_lobby,
        jugador,
        grado_individual,
    ):
        ps = _n_preguntas(repos, grado_individual.id, 3)
        now = datetime.now(timezone.utc)
        for i, p in enumerate(ps):
            await repos.respuesta.crear(
                p.id, jugador.id, "B", None, False, now, i + 1, 0
            )

        estado = await uc_vidas_realtime.revivir(str(sesion_lobby.id), str(jugador.id))
        assert estado["errores"] == 2
        assert estado["vidas_restantes"] == 1
        assert estado["eliminado"] is False
        assert any(e[0] == "vidas_cambio" for e in realtime.eventos)

    async def test_revivir_todas_devuelve_al_maximo(
        self,
        uc_vidas_realtime,
        repos,
        realtime,
        sesion_lobby,
        jugador,
        grado_individual,
    ):
        ps = _n_preguntas(repos, grado_individual.id, 3)
        now = datetime.now(timezone.utc)
        for i, p in enumerate(ps):
            await repos.respuesta.crear(
                p.id, jugador.id, "B", None, False, now, i + 1, 0
            )

        estado = await uc_vidas_realtime.revivir(
            str(sesion_lobby.id), str(jugador.id), todas=True
        )
        assert estado["errores"] == 0
        assert estado["vidas_restantes"] == 3
        assert estado["eliminado"] is False

    async def test_revivir_al_maximo_no_op(
        self,
        uc_vidas_realtime,
        repos,
        realtime,
        sesion_lobby,
        jugador,
        grado_individual,
    ):
        _n_preguntas(repos, grado_individual.id, 1)
        estado = await uc_vidas_realtime.revivir(str(sesion_lobby.id), str(jugador.id))
        assert estado["vidas_restantes"] == 3
        assert len(repos.respuesta.respuestas) == 0

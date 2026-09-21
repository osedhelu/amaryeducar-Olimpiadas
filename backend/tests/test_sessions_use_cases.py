"""Tests del flujo de conexión del estudiante: SesionUseCases.unirse y AuthUseCases."""

from __future__ import annotations

import uuid

import pytest

from app.application.dto import JoinRequest
from app.application.sessions.use_cases import AuthUseCases, SesionUseCases
from app.core.exceptions import ClaveIncorrecta, DatosInvalidos, PinNoEncontrado
from app.core.security import verificar_jwt
from app.domain.enums import EstadoSesion


@pytest.fixture
def uc_sesion(monkeypatch, repos, realtime):
    """Instancia SesionUseCases con los repos fake inyectados."""
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
    monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
    return SesionUseCases(FakeDb(), realtime)


class TestUnirse:
    async def test_crea_jugador_nuevo_y_firma_token(
        self, uc_sesion, realtime, sesion_lobby, alumno
    ):
        res = await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=alumno.id))
        assert res["sesionId"] == str(sesion_lobby.id)
        assert res["nombre"] == "Ana"
        assert res["jugadorId"]
        payload = verificar_jwt(res["token"])
        assert payload and payload["role"] == "estudiante"
        assert payload["jugador_id"] == res["jugadorId"]
        assert payload["sesion_id"] == str(sesion_lobby.id)
        tipos = [e[0] for e in realtime.eventos]
        assert "jugador_unido" in tipos

    async def test_pin_inexistente_lanza_pin_no_encontrado(
        self, uc_sesion, realtime, sesion_lobby, alumno
    ):
        with pytest.raises(PinNoEncontrado):
            await uc_sesion.unirse(JoinRequest(pin="9999", alumno_id=alumno.id))

    async def test_pin_de_sesion_borrador_lanza_pin_no_encontrado(
        self, uc_sesion, realtime, sesion_lobby, alumno
    ):
        sesion_lobby.estado = EstadoSesion.BORRADOR.value
        with pytest.raises(PinNoEncontrado):
            await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=alumno.id))

    async def test_jugador_existente_se_marca_conectado_y_no_duplica(
        self, uc_sesion, repos, realtime, sesion_lobby, alumno
    ):
        j = await repos.jugador.crear(
            sesion_lobby.id, "Ana", alumno.colegio_id, alumno.id
        )
        j.conectado = False
        res = await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=alumno.id))
        assert res["jugadorId"] == str(j.id)
        assert j.conectado is True
        assert len(await repos.jugador.listar_por_sesion(sesion_lobby.id)) == 1
        tipos = [e[0] for e in realtime.eventos]
        assert "jugador_cambio" in tipos
        assert "jugador_unido" not in tipos

    async def test_alumno_de_otro_grado_rechazado(
        self, uc_sesion, repos, realtime, sesion_lobby, grado_grupal, alumno
    ):
        repos.grado.grados[grado_grupal.id] = grado_grupal
        sesion_lobby.grado_id = grado_grupal.id
        with pytest.raises(DatosInvalidos):
            await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=alumno.id))

    async def test_alumno_no_registrado_rechazado(
        self, uc_sesion, repos, realtime, sesion_lobby
    ):
        with pytest.raises(DatosInvalidos):
            await uc_sesion.unirse(JoinRequest(pin="1234", alumno_id=uuid.uuid4()))

    async def test_alumno_id_obligatorio_en_dto(self):
        with pytest.raises(Exception):
            JoinRequest(pin="1234")

    async def test_pin_de_4_digitos_es_obligatorio(self):
        with pytest.raises(Exception):
            JoinRequest(pin="12", alumno_id=uuid.uuid4())


class TestCrearSesion:
    async def test_crea_sesion_en_lobby(self, uc_sesion, realtime, grado_individual):
        from app.application.dto import CrearSesionRequest

        res = await uc_sesion.crear(CrearSesionRequest(grado_id=grado_individual.id))
        assert res["estado"] == EstadoSesion.LOBBY.value
        assert len(res["pin"]) == 4

    async def test_crea_sesion_prueba(self, uc_sesion, realtime, grado_individual):
        from app.application.dto import CrearSesionRequest

        res = await uc_sesion.crear(
            CrearSesionRequest(grado_id=grado_individual.id, tipo="prueba")
        )
        assert res["tipo"] == "prueba"


class TestCronometroVisual:
    async def test_lanzar_pregunta_no_programa_cierre_por_tiempo(
        self, monkeypatch, repos, realtime, sesion_lobby, pregunta_opciones
    ):
        """El cronómetro es solo visual: no se programa ningún cierre."""
        import app.application.sessions.use_cases as uc
        from app.application.sessions.use_cases import ControlRondaUseCases
        from tests.fakes import FakeDb

        def _factory(fake):
            return lambda db=None: fake

        monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
        monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
        monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

        caso = ControlRondaUseCases(FakeDb(), realtime)
        await caso.lanzar_pregunta(str(sesion_lobby.id), str(pregunta_opciones.id))
        assert realtime.cierres_programados == []
        assert sesion_lobby.estado == EstadoSesion.PREGUNTA.value

    async def test_relanzar_marca_conectados_a_los_del_ws(
        self, monkeypatch, repos, realtime, sesion_lobby, pregunta_opciones
    ):
        """Al re-lanzar (p. ej. sesión reabierta), los jugadores con WS abierto
        se vuelven a marcar conectados para que el auto-cierre funcione."""
        import app.application.sessions.use_cases as uc
        from app.application.sessions.use_cases import ControlRondaUseCases
        from tests.fakes import FakeDb

        def _factory(fake):
            return lambda db=None: fake

        monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
        monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
        monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
        monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

        j = await repos.jugador.crear(sesion_lobby.id, "Ana")
        j.conectado = False  # p. ej. la sesión se finalizó y los desconectó
        realtime.conectados = [str(j.id)]

        caso = ControlRondaUseCases(FakeDb(), realtime)
        await caso.lanzar_pregunta(str(sesion_lobby.id), str(pregunta_opciones.id))
        assert j.conectado is True

    async def test_relanzar_borra_respuestas_previas(
        self, monkeypatch, repos, realtime, sesion_lobby, pregunta_opciones, jugador
    ):
        """Al re-lanzar una pregunta ya respondida, se borran sus respuestas
        para que los estudiantes puedan volver a responder."""
        from datetime import datetime, timezone

        import app.application.sessions.use_cases as uc
        from app.application.sessions.use_cases import ControlRondaUseCases
        from tests.fakes import FakeDb

        def _factory(fake):
            return lambda db=None: fake

        monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
        monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
        monkeypatch.setattr(uc, "RespuestaRepo", _factory(repos.respuesta))
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

        await repos.respuesta.crear(
            pregunta_opciones.id,
            jugador.id,
            "4",
            None,
            True,
            datetime.now(timezone.utc),
            1,
            20,
        )
        assert len(repos.respuesta.respuestas) == 1

        caso = ControlRondaUseCases(FakeDb(), realtime)
        await caso.lanzar_pregunta(str(sesion_lobby.id), str(pregunta_opciones.id))
        assert len(repos.respuesta.respuestas) == 0


class TestAuthUseCases:
    async def test_login_docente_con_clave_correcta(self):
        caso = AuthUseCases(None)
        res = await caso.login_docente("ADMadm1234")
        assert res["role"] == "docente"

    async def test_login_docente_clave_incorrecta(self):
        caso = AuthUseCases(None)
        with pytest.raises(ClaveIncorrecta):
            await caso.login_docente("mal")

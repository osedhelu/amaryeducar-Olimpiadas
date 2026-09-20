"""Tests del flujo de conexión del estudiante: SesionUseCases.unirse y AuthUseCases."""

from __future__ import annotations

import uuid

import pytest

from app.application.dto import JoinRequest
from app.application.sessions.use_cases import AuthUseCases, SesionUseCases
from app.core.exceptions import ClaveIncorrecta, DatosInvalidos, PinNoEncontrado
from app.core.security import verificar_jwt
from app.domain.enums import EstadoSesion
from app.infrastructure.db.repositories import GradoRepo, JugadorRepo, SesionRepo


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
    return SesionUseCases(FakeDb(), realtime)


@pytest.fixture
def grado_presente(repos, grado_individual):
    repos.grado.grados[grado_individual.id] = grado_individual
    return grado_individual


class TestUnirse:
    async def test_crea_jugador_nuevo_y_firma_token(
        self, uc_sesion, realtime, sesion_lobby, grado_presente
    ):
        res = await uc_sesion.unirse(JoinRequest(pin="1234", nombre="Ana"))
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
        self, uc_sesion, realtime, sesion_lobby
    ):
        with pytest.raises(PinNoEncontrado):
            await uc_sesion.unirse(JoinRequest(pin="9999", nombre="Ana"))

    async def test_pin_de_sesion_borrador_lanza_pin_no_encontrado(
        self, uc_sesion, realtime, sesion_lobby, grado_presente
    ):
        sesion_lobby.estado = EstadoSesion.BORRADOR.value
        with pytest.raises(PinNoEncontrado):
            await uc_sesion.unirse(JoinRequest(pin="1234", nombre="Ana"))

    async def test_jugador_existente_se_marca_conectado_y_no_duplica(
        self, uc_sesion, repos, realtime, sesion_lobby, grado_presente, jugador
    ):
        jugador.conectado = False
        res = await uc_sesion.unirse(JoinRequest(pin="1234", nombre="Ana"))
        assert res["jugadorId"] == str(jugador.id)
        assert jugador.conectado is True
        assert len(await repos.jugador.listar_por_sesion(sesion_lobby.id)) == 1
        tipos = [e[0] for e in realtime.eventos]
        assert "jugador_cambio" in tipos
        assert "jugador_unido" not in tipos

    async def test_grado_grupal_requiere_colegio(
        self, uc_sesion, repos, realtime, sesion_lobby, grado_grupal
    ):
        repos.grado.grados[grado_grupal.id] = grado_grupal
        sesion_lobby.grado_id = grado_grupal.id
        with pytest.raises(DatosInvalidos):
            await uc_sesion.unirse(JoinRequest(pin="1234", nombre="Ana"))

    async def test_grado_grupal_con_colegio_ok(
        self, uc_sesion, repos, realtime, sesion_lobby, grado_grupal
    ):
        repos.grado.grados[grado_grupal.id] = grado_grupal
        sesion_lobby.grado_id = grado_grupal.id
        colegio_id = uuid.uuid4()
        res = await uc_sesion.unirse(
            JoinRequest(pin="1234", nombre="Ana", colegioId=colegio_id)
        )
        assert res["jugadorId"]
        j = await repos.jugador.por_id(uuid.UUID(res["jugadorId"]))
        assert j and j.colegio_id == colegio_id

    async def test_nombre_vacio_es_invalido_en_dto(self):
        with pytest.raises(Exception):
            JoinRequest(pin="1234", nombre="")

    async def test_pin_de_4_digitos_es_obligatorio(self):
        with pytest.raises(Exception):
            JoinRequest(pin="12", nombre="Ana")


class TestCrearSesion:
    async def test_crea_sesion_en_lobby(self, uc_sesion, realtime, grado_individual):
        from app.application.dto import CrearSesionRequest

        res = await uc_sesion.crear(CrearSesionRequest(grado_id=grado_individual.id))
        assert res["estado"] == EstadoSesion.LOBBY.value
        assert len(res["pin"]) == 4


class TestAuthUseCases:
    async def test_login_docente_con_clave_correcta(self):
        caso = AuthUseCases(None)
        res = await caso.login_docente("ADMadm1234")
        assert res["role"] == "docente"

    async def test_login_docente_clave_incorrecta(self):
        caso = AuthUseCases(None)
        with pytest.raises(ClaveIncorrecta):
            await caso.login_docente("mal")

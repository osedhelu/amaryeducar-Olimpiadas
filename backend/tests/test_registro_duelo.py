"""Tests del registro (colegios/alumnos), duelo 1v1 y tabla de enfrentamiento."""

from __future__ import annotations

import uuid

import pytest

from app.application.dto import (
    ActualizarAlumnoRequest,
    ActualizarColegioRequest,
    CrearAlumnoRequest,
    CrearColegioRequest,
    CrearDueloRequest,
)
from app.application.registro.use_cases import (
    DueloUseCases,
    EnfrentamientoUseCases,
    RegistroUseCases,
)
from app.core.exceptions import DatosInvalidos, PinNoEncontrado
from app.domain.enums import EstadoSesion


@pytest.fixture
def uc_registro(monkeypatch, repos):
    import app.application.registro.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "ColegioRepo", _factory(repos.colegio))
    monkeypatch.setattr(uc, "AlumnoRepo", _factory(repos.alumno))
    return RegistroUseCases(FakeDb())


@pytest.fixture
def uc_duelo(monkeypatch, repos, realtime):
    import app.application.registro.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "AlumnoRepo", _factory(repos.alumno))

    async def _pin(db=None):
        return "5678"

    monkeypatch.setattr(uc, "generar_pin_unico", _pin)
    return DueloUseCases(FakeDb(), realtime)


@pytest.fixture
def uc_sesion(monkeypatch, repos, realtime):
    import app.application.sessions.use_cases as uc
    from app.application.sessions.use_cases import SesionUseCases
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "GradoRepo", _factory(repos.grado))
    monkeypatch.setattr(uc, "AlumnoRepo", _factory(repos.alumno))
    return SesionUseCases(FakeDb(), realtime)


@pytest.fixture
def uc_enfrentamiento(monkeypatch, repos):
    import app.application.registro.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "SesionRepo", _factory(repos.sesion))
    monkeypatch.setattr(uc, "AlumnoRepo", _factory(repos.alumno))
    return EnfrentamientoUseCases(FakeDb())


class TestRegistroColegios:
    async def test_crear_y_listar_colegio(self, uc_registro, repos):
        creado = await uc_registro.crear_colegio(CrearColegioRequest(nombre="San José"))
        assert creado["nombre"] == "San José"
        lista = await uc_registro.listar_colegios()
        assert any(c["id"] == creado["id"] for c in lista)

    async def test_actualizar_colegio(self, uc_registro, repos, colegio_1):
        repos.colegio.colegios[colegio_1.id] = colegio_1
        res = await uc_registro.actualizar_colegio(
            str(colegio_1.id), ActualizarColegioRequest(nombre="Nuevo Nombre")
        )
        assert res["nombre"] == "Nuevo Nombre"

    async def test_eliminar_colegio(self, uc_registro, repos, colegio_1):
        repos.colegio.colegios[colegio_1.id] = colegio_1
        res = await uc_registro.eliminar_colegio(str(colegio_1.id))
        assert res["ok"] is True
        assert colegio_1.id not in repos.colegio.colegios

    async def test_actualizar_colegio_inexistente(self, uc_registro, repos):
        with pytest.raises(DatosInvalidos):
            await uc_registro.actualizar_colegio(
                str(uuid.uuid4()), ActualizarColegioRequest(nombre="X")
            )


class TestRegistroAlumnos:
    async def test_crear_y_listar_alumno(
        self, uc_registro, repos, grado_individual, colegio_1
    ):
        repos.grado.grados[grado_individual.id] = grado_individual
        repos.colegio.colegios[colegio_1.id] = colegio_1
        creado = await uc_registro.crear_alumno(
            CrearAlumnoRequest(
                colegio_id=colegio_1.id,
                grado_id=grado_individual.id,
                nombre="Ana",
            )
        )
        assert creado["nombre"] == "Ana"
        assert creado["colegio_id"] == str(colegio_1.id)
        assert creado["grado_id"] == str(grado_individual.id)
        lista = await uc_registro.listar_alumnos(
            grado_id=str(grado_individual.id), colegio_id=str(colegio_1.id)
        )
        assert any(a["id"] == creado["id"] for a in lista)

    async def test_listar_alumnos_filtra_por_grado(
        self, uc_registro, repos, grado_individual, grado_grupal, colegio_1
    ):
        repos.colegio.colegios[colegio_1.id] = colegio_1
        a1 = await repos.alumno.crear(colegio_1.id, grado_individual.id, "A")
        await repos.alumno.crear(colegio_1.id, grado_grupal.id, "B")
        lista = await uc_registro.listar_alumnos(grado_id=str(grado_individual.id))
        assert [x["id"] for x in lista] == [str(a1.id)]

    async def test_actualizar_alumno(self, uc_registro, repos, alumno):
        res = await uc_registro.actualizar_alumno(
            str(alumno.id), ActualizarAlumnoRequest(nombre="Ana María")
        )
        assert res["nombre"] == "Ana María"

    async def test_eliminar_alumno(self, uc_registro, repos, alumno):
        res = await uc_registro.eliminar_alumno(str(alumno.id))
        assert res["ok"] is True
        assert alumno.id not in repos.alumno.alumnos


class TestDuelo:
    async def test_crea_duelo_mismo_grado(
        self, uc_duelo, repos, grado_individual, colegio_1, colegio_2, realtime
    ):
        a = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        b = await repos.alumno.crear(colegio_2.id, grado_individual.id, "Bruno")
        res = await uc_duelo.crear(
            CrearDueloRequest(
                grado_id=grado_individual.id,
                alumno_a_id=a.id,
                alumno_b_id=b.id,
            )
        )
        assert res["tipo"] == "prueba"
        assert res["pin"] == "5678"
        assert res["estado"] == EstadoSesion.LOBBY.value
        assert len(res["alumnos"]) == 2

    async def test_crea_duelo_mismo_colegio(
        self, uc_duelo, repos, grado_individual, colegio_1, realtime
    ):
        a = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        b = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Bruno")
        res = await uc_duelo.crear(
            CrearDueloRequest(
                grado_id=grado_individual.id,
                alumno_a_id=a.id,
                alumno_b_id=b.id,
            )
        )
        assert res["tipo"] == "prueba"

    async def test_rechaza_duelo_de_grados_distintos(
        self, uc_duelo, repos, grado_individual, grado_grupal, colegio_1, colegio_2
    ):
        a = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        b = await repos.alumno.crear(colegio_2.id, grado_grupal.id, "Bruno")
        with pytest.raises(DatosInvalidos):
            await uc_duelo.crear(
                CrearDueloRequest(
                    grado_id=grado_individual.id,
                    alumno_a_id=a.id,
                    alumno_b_id=b.id,
                )
            )

    async def test_rechaza_duelo_mismo_alumno(
        self, uc_duelo, repos, grado_individual, colegio_1
    ):
        a = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        with pytest.raises(DatosInvalidos):
            await uc_duelo.crear(
                CrearDueloRequest(
                    grado_id=grado_individual.id,
                    alumno_a_id=a.id,
                    alumno_b_id=a.id,
                )
            )

    async def test_rechaza_alumno_inexistente(self, uc_duelo, repos, grado_individual):
        with pytest.raises(DatosInvalidos):
            await uc_duelo.crear(
                CrearDueloRequest(
                    grado_id=grado_individual.id,
                    alumno_a_id=uuid.uuid4(),
                    alumno_b_id=uuid.uuid4(),
                )
            )

    async def test_join_a_duelo_solo_para_duelistas(
        self, uc_sesion, repos, realtime, grado_individual, colegio_1, colegio_2
    ):
        from app.application.dto import JoinRequest

        a = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        b = await repos.alumno.crear(colegio_2.id, grado_individual.id, "Bruno")
        c = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Carla")

        sesion = await repos.sesion.crear(
            "5678",
            grado_individual.id,
            EstadoSesion.LOBBY.value,
            tipo="prueba",
            alumno_a_id=a.id,
            alumno_b_id=b.id,
        )
        # El duelista A entra OK
        res = await uc_sesion.unirse(JoinRequest(pin="5678", alumno_id=a.id))
        assert res["jugadorId"]
        # El alumno C (no duelista) es rechazado
        with pytest.raises(DatosInvalidos):
            await uc_sesion.unirse(JoinRequest(pin="5678", alumno_id=c.id))


class TestEnfrentamiento:
    async def test_alumnos_por_pin_oficial_lista_grado(
        self,
        uc_enfrentamiento,
        repos,
        sesion_lobby,
        grado_individual,
        colegio_1,
        colegio_2,
    ):
        await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        await repos.alumno.crear(colegio_2.id, grado_individual.id, "Bruno")
        res = await uc_enfrentamiento.alumnos_por_pin("1234")
        assert len(res["alumnos"]) == 2
        assert res["sesion"]["id"] == str(sesion_lobby.id)

    async def test_alumnos_por_pin_prueba_solo_duelistas(
        self, uc_enfrentamiento, repos, grado_individual, colegio_1, colegio_2
    ):
        a = await repos.alumno.crear(colegio_1.id, grado_individual.id, "Ana")
        b = await repos.alumno.crear(colegio_2.id, grado_individual.id, "Bruno")
        await repos.alumno.crear(colegio_1.id, grado_individual.id, "Carla")
        await repos.sesion.crear(
            "5678",
            grado_individual.id,
            EstadoSesion.LOBBY.value,
            tipo="prueba",
            alumno_a_id=a.id,
            alumno_b_id=b.id,
        )
        res = await uc_enfrentamiento.alumnos_por_pin("5678")
        nombres = {x["nombre"] for x in res["alumnos"]}
        assert nombres == {"Ana", "Bruno"}

    async def test_alumnos_por_pin_inexistente(self, uc_enfrentamiento, repos):
        with pytest.raises(PinNoEncontrado):
            await uc_enfrentamiento.alumnos_por_pin("9999")

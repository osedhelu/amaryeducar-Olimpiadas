"""Tests del jurado: asignación de puestos en retos lúdicos."""

from __future__ import annotations

import uuid

import pytest

from app.application.retos.use_cases import RetoUseCases
from app.core.exceptions import DatosInvalidos
from app.domain.entities import Reto


@pytest.fixture
def reto_individual(grado_individual):
    return Reto(
        id=uuid.uuid4(),
        grado_id=grado_individual.id,
        nombre="Memoria",
        instrucciones="Ordena los números",
        tipo="individual",
        puntos_por_puesto={"1": 30, "2": 20},
        orden=1,
    )


@pytest.fixture
def reto_grupal(grado_grupal):
    return Reto(
        id=uuid.uuid4(),
        grado_id=grado_grupal.id,
        nombre="Tangram gigante",
        instrucciones="Arma la figura",
        tipo="grupal",
        puntos_por_puesto={"1": 50, "2": 30, "3": 20, "4": 10},
        orden=1,
    )


@pytest.fixture
def uc_retos(monkeypatch, repos, realtime):
    import app.application.retos.use_cases as uc
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "RetoRepo", _factory(repos.reto))
    monkeypatch.setattr(uc, "JugadorRepo", _factory(repos.jugador))
    monkeypatch.setattr(uc, "ColegioRepo", _factory(repos.colegio))
    monkeypatch.setattr(uc, "PuntajeRetoRepo", _factory(repos.puntaje_reto))
    return RetoUseCases(FakeDb(), realtime)


class TestAsignarPuesto:
    async def test_primero_recibe_maximo(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        res = await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        assert res["puntos"] == 30
        assert len(res["puntajes"]) == 1

    async def test_segundo_recibe_menos(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        j2 = await repos.jugador.crear(sesion_lobby.id, "Bruno")
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        res = await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j2.id), None, 2
        )
        assert res["puntos"] == 20

    async def test_puesto_ya_asignado_se_reemplaza(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        """Posiciones únicas: si se asigna el puesto 1 a otro, queda uno solo."""
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        j2 = await repos.jugador.crear(sesion_lobby.id, "Bruno")
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j2.id), None, 1
        )
        puntajes = await repos.puntaje_reto.listar_por_reto(reto_individual.id)
        assert len(puntajes) == 1
        assert puntajes[0].jugador_id == j2.id

    async def test_mismo_participante_se_reemplaza(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 2
        )
        puntajes = await repos.puntaje_reto.listar_por_reto(reto_individual.id)
        assert len(puntajes) == 1
        assert puntajes[0].puesto == 2
        assert puntajes[0].puntos == 20

    async def test_puesto_sin_puntos_rechazado(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        with pytest.raises(DatosInvalidos):
            await uc_retos.asignar_puesto(
                str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 5
            )

    async def test_requiere_jugador_o_colegio(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        with pytest.raises(DatosInvalidos):
            await uc_retos.asignar_puesto(
                str(reto_individual.id), str(sesion_lobby.id), None, None, 1
            )

    async def test_reto_inexistente(self, uc_retos, repos, sesion_lobby):
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        with pytest.raises(DatosInvalidos):
            await uc_retos.asignar_puesto(
                str(uuid.uuid4()), str(sesion_lobby.id), str(j1.id), None, 1
            )

    async def test_reto_grupal_asigna_a_colegio(
        self, uc_retos, repos, reto_grupal, colegio_1, sesion_lobby
    ):
        repos.reto.retos[reto_grupal.id] = reto_grupal
        res = await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_1.id), 1
        )
        assert res["puntos"] == 50


class TestRetoGrupalMultiplesColegios:
    async def test_dos_colegios_conserva_ambos(
        self, uc_retos, repos, reto_grupal, colegio_1, colegio_2, sesion_lobby
    ):
        """Regresión: asignar puesto a 2 colegios en el mismo reto/sesión conserva ambos."""
        repos.reto.retos[reto_grupal.id] = reto_grupal
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_1.id), 1
        )
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_2.id), 2
        )
        puntajes = await repos.puntaje_reto.listar_por_reto(reto_grupal.id)
        assert len(puntajes) == 2
        colegios_ids = {p.colegio_id for p in puntajes}
        assert colegio_1.id in colegios_ids
        assert colegio_2.id in colegios_ids

    async def test_dos_colegios_listar_por_reto_y_sesion(
        self, uc_retos, repos, reto_grupal, colegio_1, colegio_2, sesion_lobby
    ):
        """listar_por_reto con sesion_id retorna ambos colegios."""
        repos.reto.retos[reto_grupal.id] = reto_grupal
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_1.id), 1
        )
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_2.id), 2
        )
        lista = await repos.puntaje_reto.listar_por_reto(
            reto_grupal.id, sesion_lobby.id
        )
        assert len(lista) == 2
        assert {p.puesto for p in lista} == {1, 2}

    async def test_reemplazar_puesto_colegio_no_borra_otro(
        self,
        uc_retos,
        repos,
        reto_grupal,
        colegio_1,
        colegio_2,
        colegio_3,
        sesion_lobby,
    ):
        """Regresión: reasignar puesto 1 de Colegio A a Colegio B preserva al Colegio C."""
        repos.reto.retos[reto_grupal.id] = reto_grupal
        repos.colegio.colegios[colegio_1.id] = colegio_1
        repos.colegio.colegios[colegio_2.id] = colegio_2
        repos.colegio.colegios[colegio_3.id] = colegio_3
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_1.id), 1
        )
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_2.id), 2
        )
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_3.id), 3
        )
        # Reasignar puesto 1 a Colegio B (desplaza a Colegio A, que sale del reto)
        await uc_retos.asignar_puesto(
            str(reto_grupal.id), str(sesion_lobby.id), None, str(colegio_2.id), 1
        )
        puntajes = await repos.puntaje_reto.listar_por_reto(reto_grupal.id)
        assert len(puntajes) == 2
        by_id = {p.colegio_id: p for p in puntajes}
        assert by_id[colegio_2.id].puesto == 1
        assert by_id[colegio_3.id].puesto == 3


class TestListarPuntajes:
    async def test_lista_con_nombre(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        lista = await uc_retos.listar_puntajes(
            str(reto_individual.id), str(sesion_lobby.id)
        )
        assert len(lista) == 1
        assert lista[0]["nombre"] == "Ana"
        assert lista[0]["puesto"] == 1

    async def test_no_mezcla_puntajes_entre_sesiones(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        """Regresión: los puntos del reto quedan atados a su sesión."""
        import uuid as _uuid
        from app.domain.entities import SesionJuego

        repos.reto.retos[reto_individual.id] = reto_individual
        sesion2 = SesionJuego(
            id=_uuid.uuid4(),
            pin="9999",
            grado_id=reto_individual.grado_id,
            estado="lobby",
        )
        repos.sesion.sesiones[sesion2.id] = sesion2

        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        j2 = await repos.jugador.crear(sesion2.id, "Bruno")
        # Mismo reto, misma posición, en dos sesiones distintas
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion2.id), str(j2.id), None, 1
        )
        assert len(await repos.puntaje_reto.listar_por_reto(reto_individual.id)) == 2
        s1 = await uc_retos.listar_puntajes(
            str(reto_individual.id), str(sesion_lobby.id)
        )
        assert len(s1) == 1 and s1[0]["nombre"] == "Ana"


class TestQuitarPuesto:
    async def test_quita_puesto_de_jugador(
        self, uc_retos, repos, reto_individual, sesion_lobby
    ):
        repos.reto.retos[reto_individual.id] = reto_individual
        j1 = await repos.jugador.crear(sesion_lobby.id, "Ana")
        j2 = await repos.jugador.crear(sesion_lobby.id, "Bruno")
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None, 1
        )
        await uc_retos.asignar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j2.id), None, 2
        )
        res = await uc_retos.quitar_puesto(
            str(reto_individual.id), str(sesion_lobby.id), str(j1.id), None
        )
        assert len(res["puntajes"]) == 1
        assert res["puntajes"][0]["jugador_id"] == str(j2.id)

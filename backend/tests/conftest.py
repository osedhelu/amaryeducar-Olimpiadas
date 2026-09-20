"""Fixtures compartidos: fakes de repos, realtime y objetos de dominio."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.domain.entities import Grado, Jugador, Pregunta, SesionJuego
from tests.fakes import FakeRealtime, FakeRepos


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


@pytest.fixture
def realtime():
    return FakeRealtime()


@pytest.fixture
def repos():
    return FakeRepos()


@pytest.fixture
def grado_individual():
    return Grado(
        id=uuid.uuid4(), nombre="3ro", orden=3, puntos_sesion1={}, puntos_sesion2={}
    )


@pytest.fixture
def grado_grupal():
    return Grado(
        id=uuid.uuid4(), nombre="5to", orden=5, puntos_sesion1={}, puntos_sesion2={}
    )


@pytest.fixture
def sesion_lobby(repos, grado_individual):
    s = SesionJuego(
        id=uuid.uuid4(),
        pin="1234",
        grado_id=grado_individual.id,
        estado="lobby",
        creado_en=_ahora(),
    )
    repos.sesion.sesiones[s.id] = s
    return s


@pytest.fixture
def jugador(repos, sesion_lobby):
    j = Jugador(
        id=uuid.uuid4(),
        sesion_id=sesion_lobby.id,
        nombre="Ana",
        conectado=True,
        creado_en=_ahora(),
    )
    repos.jugador.jugadores[j.id] = j
    return j


@pytest.fixture
def pregunta_opciones(grado_individual):
    return Pregunta(
        id=uuid.uuid4(),
        grado_id=grado_individual.id,
        tipo="opcion-multiple",
        enunciado="2+2?",
        opciones=["3", "4", "5"],
        respuesta_correcta="4",
        tiempo_limite=30,
        puntos_por_puesto={"1": 20, "2": 10, "3": 5},
        orden=1,
        activa=True,
    )


@pytest.fixture
def pregunta_abierta(grado_individual):
    return Pregunta(
        id=uuid.uuid4(),
        grado_id=grado_individual.id,
        tipo="abierta",
        enunciado="Explica...",
        tiempo_limite=60,
        puntos_por_puesto={"1": 20, "2": 10},
        orden=2,
        activa=True,
    )

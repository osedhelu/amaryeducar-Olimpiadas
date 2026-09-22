"""Tests de agregación de puntos (domain/scoring.py).

Cubren podium y tabla para grados 1-3 (individual) y 4-5 (grupal).
Incluye la regresión del bug: en 4°-5° los retos INDIVIDUALES no se
sumaban al total del colegio.
"""

from __future__ import annotations

import uuid

from app.domain.entities import Colegio, Jugador, PuntajeReto, Respuesta
from app.domain.scoring import agregar_podium, agregar_tabla_colegios


def _jugador(sesion_id, nombre, colegio_id=None):
    return Jugador(
        id=uuid.uuid4(),
        sesion_id=sesion_id,
        nombre=nombre,
        colegio_id=colegio_id,
        conectado=True,
    )


def _resp(jugador_id, puntos, correcta=True):
    return Respuesta(
        id=uuid.uuid4(),
        pregunta_id=uuid.uuid4(),
        jugador_id=jugador_id,
        correcta=correcta,
        puntos=puntos,
    )


def _puntaje(jugador_id=None, colegio_id=None, puntos=0, puesto=1, reto_id=None):
    return PuntajeReto(
        id=uuid.uuid4(),
        reto_id=reto_id or uuid.uuid4(),
        jugador_id=jugador_id,
        colegio_id=colegio_id,
        puesto=puesto,
        puntos=puntos,
    )


class TestPodiumIndividual:
    """Grados 1-3: podium por jugador (respuestas + retos individuales)."""

    def test_suma_respuestas_y_retos_por_jugador(self):
        sesion = uuid.uuid4()
        ana = _jugador(sesion, "Ana")
        bruno = _jugador(sesion, "Bruno")
        carla = _jugador(sesion, "Carla")

        respuestas = [
            _resp(ana.id, 20),  # 1er acierto
            _resp(bruno.id, 0, correcta=False),  # falló
            _resp(carla.id, 10),  # 2º acierto
        ]
        puntajes = [
            _puntaje(jugador_id=ana.id, puntos=30, puesto=1),
            _puntaje(jugador_id=carla.id, puntos=20, puesto=2),
        ]

        podium = agregar_podium(
            respuestas,
            puntajes,
            [ana, bruno, carla],
            [],
            es_grupal=False,
        )

        totales = {e.nombre: e.puntos_total for e in podium}
        assert totales == {"Ana": 50, "Carla": 30}
        # Bruno (0 puntos) no aparece: se preserva el comportamiento actual.
        assert [e.nombre for e in podium] == ["Ana", "Carla"]
        assert [e.puesto for e in podium] == [1, 2]
        assert podium[0].es_colegio is False

    def test_varias_preguntas_se_acumulan(self):
        sesion = uuid.uuid4()
        ana = _jugador(sesion, "Ana")
        respuestas = [_resp(ana.id, 20), _resp(ana.id, 20), _resp(ana.id, 10)]
        podium = agregar_podium(respuestas, [], [ana], [], es_grupal=False)
        assert podium[0].puntos_total == 50

    def test_empate_desempata_por_nombre(self):
        sesion = uuid.uuid4()
        ana = _jugador(sesion, "Ana")
        zoe = _jugador(sesion, "Zoe")
        podium = agregar_podium(
            [_resp(ana.id, 20), _resp(zoe.id, 20)], [], [ana, zoe], [], es_grupal=False
        )
        assert [e.nombre for e in podium] == ["Ana", "Zoe"]


class TestPodiumGrupal:
    """Grados 4-5: podium por colegio.

    Debe sumar: respuestas correctas + retos GRUPALES + retos INDIVIDUALES
    (atribuidos al colegio del jugador).
    """

    def test_regresion_5to_retos_individuales_suman_al_colegio(self):
        """El bug reportado: en 5° los retos individuales no sumaban."""
        sesion = uuid.uuid4()
        aye = Colegio(id=uuid.uuid4(), nombre="Amar y Educar")
        sp = Colegio(id=uuid.uuid4(), nombre="San Pablo")
        nsr = Colegio(id=uuid.uuid4(), nombre="Nuestra Señora")

        diego = _jugador(sesion, "Diego", aye.id)
        eliab = _jugador(sesion, "Eliab", aye.id)
        barbara = _jugador(sesion, "Bárbara", sp.id)
        julian = _jugador(sesion, "Julian", sp.id)
        luis = _jugador(sesion, "Luis", nsr.id)
        gael = _jugador(sesion, "Gael", nsr.id)
        jugadores = [diego, eliab, barbara, julian, luis, gael]

        # Pregunta 1: 1º Diego(AYE)=50, 2º Bárbara(SP)=30, 3º Luis(NSR)=20
        respuestas = [
            _resp(diego.id, 50),
            _resp(barbara.id, 30),
            _resp(luis.id, 20),
        ]

        # Reto individual "Organiza las fichas": Diego(AYE)=50, Julian(SP)=30, Gael(NSR)=20
        # Reto grupal "Tangram": AYE=50, NSR=30, SP=20
        reto_ind = uuid.uuid4()
        reto_grupal = uuid.uuid4()
        puntajes = [
            _puntaje(jugador_id=diego.id, puntos=50, puesto=1, reto_id=reto_ind),
            _puntaje(jugador_id=julian.id, puntos=30, puesto=2, reto_id=reto_ind),
            _puntaje(jugador_id=gael.id, puntos=20, puesto=3, reto_id=reto_ind),
            _puntaje(colegio_id=aye.id, puntos=50, puesto=1, reto_id=reto_grupal),
            _puntaje(colegio_id=nsr.id, puntos=30, puesto=2, reto_id=reto_grupal),
            _puntaje(colegio_id=sp.id, puntos=20, puesto=3, reto_id=reto_grupal),
        ]

        podium = agregar_podium(
            respuestas,
            puntajes,
            jugadores,
            [aye, sp, nsr],
            es_grupal=True,
        )

        totales = {e.nombre: e.puntos_total for e in podium}
        # AYE: 50 resp + 50 reto indiv + 50 grupal = 150
        # SP:  30 resp + 30 reto indiv + 20 grupal = 80
        # NSR: 20 resp + 20 reto indiv + 30 grupal = 70
        assert totales == {
            "Amar y Educar": 150,
            "San Pablo": 80,
            "Nuestra Señora": 70,
        }
        assert [e.nombre for e in podium] == [
            "Amar y Educar",
            "San Pablo",
            "Nuestra Señora",
        ]
        assert all(e.es_colegio for e in podium)

    def test_reto_individual_no_se_atribuye_a_otro_colegio(self):
        sesion = uuid.uuid4()
        a = Colegio(id=uuid.uuid4(), nombre="Colegio A")
        b = Colegio(id=uuid.uuid4(), nombre="Colegio B")
        jugador_a = _jugador(sesion, "Alumno A", a.id)
        jugador_b = _jugador(sesion, "Alumno B", b.id)

        puntajes = [_puntaje(jugador_id=jugador_a.id, puntos=50, puesto=1)]
        podium = agregar_podium(
            [], puntajes, [jugador_a, jugador_b], [a, b], es_grupal=True
        )
        totales = {e.nombre: e.puntos_total for e in podium}
        assert totales == {"Colegio A": 50}
        assert "Colegio B" not in totales

    def test_jugador_sin_colegio_no_aporta(self):
        sesion = uuid.uuid4()
        a = Colegio(id=uuid.uuid4(), nombre="Colegio A")
        sin_colegio = _jugador(sesion, "Sin colegio", None)
        con_colegio = _jugador(sesion, "Con colegio", a.id)
        puntajes = [
            _puntaje(jugador_id=sin_colegio.id, puntos=50),
            _puntaje(jugador_id=con_colegio.id, puntos=30, puesto=2),
        ]
        podium = agregar_podium(
            [], puntajes, [sin_colegio, con_colegio], [a], es_grupal=True
        )
        assert [(e.nombre, e.puntos_total) for e in podium] == [("Colegio A", 30)]


class TestTablaColegios:
    """Tabla todos contra todos: por colegio, incluye ceros."""

    def test_suma_individuales_y_grupales(self):
        sesion = uuid.uuid4()
        a = Colegio(id=uuid.uuid4(), nombre="Colegio A")
        b = Colegio(id=uuid.uuid4(), nombre="Colegio B")
        ja = _jugador(sesion, "A1", a.id)
        jb = _jugador(sesion, "B1", b.id)

        respuestas = [_resp(ja.id, 50), _resp(jb.id, 30)]
        puntajes = [
            _puntaje(jugador_id=ja.id, puntos=50, puesto=1),  # individual -> A
            _puntaje(colegio_id=b.id, puntos=50, puesto=1),  # grupal -> B
        ]

        tabla = agregar_tabla_colegios(respuestas, puntajes, [ja, jb], [a, b])
        totales = {fila["nombre"]: fila["puntos_total"] for fila in tabla}
        assert totales == {"Colegio A": 100, "Colegio B": 80}
        assert [f["puesto"] for f in tabla] == [1, 2]
        assert all(f["es_colegio"] for f in tabla)

    def test_incluye_colegios_con_cero_puntos(self):
        sesion = uuid.uuid4()
        a = Colegio(id=uuid.uuid4(), nombre="Colegio A")
        cero = Colegio(id=uuid.uuid4(), nombre="Colegio Cero")
        ja = _jugador(sesion, "A1", a.id)

        tabla = agregar_tabla_colegios([_resp(ja.id, 50)], [], [ja], [a, cero])
        totales = {fila["nombre"]: fila["puntos_total"] for fila in tabla}
        assert totales == {"Colegio A": 50, "Colegio Cero": 0}
        assert [f["nombre"] for f in tabla] == ["Colegio A", "Colegio Cero"]

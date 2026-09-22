"""Agregación de puntos para podium y tabla (lógica pura, sin BD).

Reemplaza la agregación SQL de ``repositories.obtener_podium_rows`` y
``repositories.obtener_tabla_colegios`` para poder probarla sin base de datos.

Reglas:
- Grados 1-3 (individual): se agrupa por JUGADOR. Suma respuestas correctas
  más los retos individuales (``puntajes_retos.jugador_id``).
- Grados 4-5 (grupal): se agrupa por COLEGIO. Suma respuestas correctas del
  colegio (vía ``jugador.colegio_id``), retos grupales
  (``puntajes_retos.colegio_id``) y retos individuales atribuidos al colegio
  del jugador (``puntajes_retos.jugador_id -> jugador.colegio_id``).
"""

from __future__ import annotations

import uuid

from app.domain.entities import (
    Colegio,
    Jugador,
    PuntajeReto,
    PodiumEntry,
    Respuesta,
)


def _sumar_puntos(
    respuestas: list[Respuesta],
    puntajes_retos: list[PuntajeReto],
    *,
    es_grupal: bool,
    jugadores_por_id: dict[uuid.UUID, Jugador],
) -> dict[uuid.UUID, int]:
    """Devuelve ``entity_id -> total`` donde la entidad es jugador o colegio."""

    totales: dict[uuid.UUID, int] = {}

    def _add(entity_id: uuid.UUID | None, puntos: int) -> None:
        if entity_id is None:
            return
        totales[entity_id] = totales.get(entity_id, 0) + puntos

    for r in respuestas:
        if not r.correcta:
            continue
        if es_grupal:
            jugador = jugadores_por_id.get(r.jugador_id)
            _add(jugador.colegio_id if jugador else None, r.puntos)
        else:
            _add(r.jugador_id, r.puntos)

    for p in puntajes_retos:
        if es_grupal:
            if p.colegio_id is not None:
                # Reto grupal: el puntaje ya viene atado al colegio.
                _add(p.colegio_id, p.puntos)
            elif p.jugador_id is not None:
                # Reto individual dentro de un grado grupal: se atribuye al
                # colegio del jugador (esto antes se perdía).
                jugador = jugadores_por_id.get(p.jugador_id)
                _add(jugador.colegio_id if jugador else None, p.puntos)
        elif p.jugador_id is not None:
            _add(p.jugador_id, p.puntos)

    return totales


def _nombres(entidades: list[Colegio] | list[Jugador]) -> dict[uuid.UUID, str]:
    return {e.id: e.nombre for e in entidades}


def _rankear(
    totales: dict[uuid.UUID, int],
    nombres: dict[uuid.UUID, str],
    *,
    es_colegio: bool,
) -> list[PodiumEntry]:
    ordenados = sorted(totales.items(), key=lambda kv: (-kv[1], nombres.get(kv[0], "")))
    return [
        PodiumEntry(
            puesto=i + 1,
            nombre=nombres.get(entity_id, ""),
            puntos_total=total,
            es_colegio=es_colegio,
            entity_id=entity_id,
        )
        for i, (entity_id, total) in enumerate(ordenados)
    ]


def agregar_podium(
    respuestas: list[Respuesta],
    puntajes_retos: list[PuntajeReto],
    jugadores: list[Jugador],
    colegios: list[Colegio],
    *,
    es_grupal: bool,
) -> list[PodiumEntry]:
    """Podium de una sesión. No incluye participantes con 0 puntos.

    Solo considera participantes de la sesión (jugadores para grados 1-3,
    colegios con jugadores en la sesión para 4-5).
    """
    jugadores_por_id = {j.id: j for j in jugadores}
    totales = _sumar_puntos(
        respuestas,
        puntajes_retos,
        es_grupal=es_grupal,
        jugadores_por_id=jugadores_por_id,
    )

    if es_grupal:
        permitidos = {j.colegio_id for j in jugadores if j.colegio_id}
        nombres = _nombres(colegios)
    else:
        permitidos = {j.id for j in jugadores}
        nombres = _nombres(jugadores)

    totales = {k: v for k, v in totales.items() if k in permitidos}
    return _rankear(totales, nombres, es_colegio=es_grupal)


def agregar_tabla_colegios(
    respuestas: list[Respuesta],
    puntajes_retos: list[PuntajeReto],
    jugadores: list[Jugador],
    colegios_participantes: list[Colegio],
) -> list[dict]:
    """Tabla todos contra todos por colegio. Incluye colegios con 0 puntos."""
    jugadores_por_id = {j.id: j for j in jugadores}
    totales = _sumar_puntos(
        respuestas,
        puntajes_retos,
        es_grupal=True,
        jugadores_por_id=jugadores_por_id,
    )

    ids_participantes = {c.id for c in colegios_participantes}
    totales = {k: v for k, v in totales.items() if k in ids_participantes}
    for c in colegios_participantes:
        totales.setdefault(c.id, 0)

    entradas = _rankear(totales, _nombres(colegios_participantes), es_colegio=True)
    return [
        {
            "puesto": e.puesto,
            "colegio_id": str(e.entity_id),
            "nombre": e.nombre,
            "puntos_total": e.puntos_total,
            "es_colegio": True,
        }
        for e in entradas
    ]

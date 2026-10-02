"""Lógica pura del sistema de vidas por sesión.

Una vida se pierde SOLO con respuestas incorrectas de opción múltiple.
Las preguntas abiertas nunca quitan vida (se aprueban después por el docente).

El estado se DERIVA de `respuestas` (no se persiste un contador), así que
relanzar una pregunta (que borra sus respuestas) devuelve la vida sola y
nunca hay estado que se desincronice.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.domain.entities import Jugador, Pregunta, Respuesta


@dataclass
class EstadoVidas:
    jugador_id: uuid.UUID
    nombre: str
    conectado: bool
    aciertos: int = 0
    errores: int = 0
    vidas_restantes: int = 0
    vidas_max: int = 0
    eliminado: bool = False

    def a_dict(self) -> dict:
        return {
            "jugador_id": str(self.jugador_id),
            "nombre": self.nombre,
            "conectado": self.conectado,
            "aciertos": self.aciertos,
            "errores": self.errores,
            "vidas_restantes": self.vidas_restantes,
            "vidas_max": self.vidas_max,
            "eliminado": self.eliminado,
        }


def _tipo_por_pregunta(preguntas: list[Pregunta]) -> dict[uuid.UUID, str]:
    return {p.id: p.tipo for p in preguntas}


def es_error(preguntas: list[Pregunta], respuesta: Respuesta) -> bool:
    """Solo las opciones múltiples INCORRECTAS restan una vida."""
    if respuesta.correcta is not False:
        return False
    return _tipo_por_pregunta(preguntas).get(respuesta.pregunta_id) == "opcion-multiple"


def calcular_estados_vidas(
    jugadores: list[Jugador],
    respuestas: list[Respuesta],
    preguntas: list[Pregunta],
    *,
    habilitadas: bool = True,
    max_vidas: int = 3,
) -> dict[uuid.UUID, EstadoVidas]:
    """Estado de vidas de cada jugador de una sesión (las respuestas ya deben
    estar filtradas a esa sesión)."""
    tipos = _tipo_por_pregunta(preguntas)
    errores: dict[uuid.UUID, int] = {}
    aciertos: dict[uuid.UUID, int] = {}

    for r in respuestas:
        if r.correcta is True:
            aciertos[r.jugador_id] = aciertos.get(r.jugador_id, 0) + 1
        elif r.correcta is False and tipos.get(r.pregunta_id) == "opcion-multiple":
            errores[r.jugador_id] = errores.get(r.jugador_id, 0) + 1

    estados: dict[uuid.UUID, EstadoVidas] = {}
    for j in jugadores:
        err = errores.get(j.id, 0)
        vidas = max(max_vidas - err, 0) if habilitadas else max_vidas
        estados[j.id] = EstadoVidas(
            jugador_id=j.id,
            nombre=j.nombre,
            conectado=bool(j.conectado),
            aciertos=aciertos.get(j.id, 0),
            errores=err,
            vidas_restantes=vidas,
            vidas_max=max_vidas if habilitadas else 0,
            eliminado=habilitadas and err >= max_vidas,
        )
    return estados


def respuestas_error_ordenadas(
    jugador_id: uuid.UUID,
    respuestas: list[Respuesta],
    preguntas: list[Pregunta],
) -> list[Respuesta]:
    """Errores del jugador que restan vida, ordenados por llegada (el más
    reciente al final). Sirve para revivir (+1 vida borrando el último)."""
    errores = [
        r for r in respuestas if r.jugador_id == jugador_id and es_error(preguntas, r)
    ]
    errores.sort(
        key=lambda r: (
            r.enviado_en.timestamp() if r.enviado_en else 0,
            r.secuencia or 0,
        )
    )
    return errores

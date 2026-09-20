"""Lógica pura de negocio: puntos, anti-trampa de reloj, desempate y cierre.

Reemplaza los triggers de Postgres (sql/02-triggers-notify.sql) y las
funciones SQL (sql/03-functions.sql). Toda esta lógica ahora vive en Python.
"""

from __future__ import annotations

from datetime import datetime, timezone

MAX_DESVIACION_RELOJ_SEG = 60


def corregir_reloj(
    enviado_en: datetime | None, ahora: datetime | None = None
) -> datetime:
    """Anti-trampa: si el timestamp del cliente se desvía más de 60s del
    servidor, se corrige a la hora del servidor."""
    ahora = ahora or datetime.now(timezone.utc)
    if enviado_en is None:
        return ahora
    if enviado_en.tzinfo is None:
        enviado_en = enviado_en.replace(tzinfo=timezone.utc)
    if abs((ahora - enviado_en).total_seconds()) > MAX_DESVIACION_RELOJ_SEG:
        return ahora
    return enviado_en


def calcular_puntos(puntos_por_puesto: dict[str, int], puesto: int) -> int:
    """Puntos según el puesto de respuesta correcta (1º=20, 2º=10, ...)."""
    return int(puntos_por_puesto.get(str(puesto), 0))


def es_correcta_opcion(opcion: str | None, respuesta_correcta: str | None) -> bool:
    if opcion is None or respuesta_correcta is None:
        return False
    return opcion.strip().upper() == respuesta_correcta.strip().upper()


def es_grado_grupal(orden_grado: int) -> bool:
    return orden_grado >= 4


# Orden de desempate: (enviado_en, secuencia). En Python se implementa como
# una tupla comparada con <, igual que el SQL (r.enviado_en, r.secuencia) < (NEW.enviado_en, NEW.secuencia).


def ordenar_por_envio(
    respuestas: list[tuple[datetime, int]],
) -> list[tuple[datetime, int]]:
    return sorted(respuestas, key=lambda t: (t[0], t[1]))

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
from uuid import UUID


@dataclass
class Grado:
    id: UUID
    nombre: str
    orden: int
    puntos_sesion1: dict[str, int]
    puntos_sesion2: dict[str, int]
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None


@dataclass
class Colegio:
    id: UUID
    nombre: str
    codigo: Optional[str] = None
    creado_en: Optional[datetime] = None


@dataclass
class SesionJuego:
    id: UUID
    pin: str
    grado_id: UUID
    estado: str = "borrador"
    pregunta_activa_id: Optional[UUID] = None
    reto_activo_id: Optional[UUID] = None
    cronometro_inicio: Optional[datetime] = None
    cronometro_segundos: int = 30
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None


@dataclass
class Jugador:
    id: UUID
    sesion_id: UUID
    nombre: str
    colegio_id: Optional[UUID] = None
    conectado: bool = False
    ultima_conexion: Optional[datetime] = None
    creado_en: Optional[datetime] = None


@dataclass
class Pregunta:
    id: UUID
    grado_id: UUID
    sesion: str = "1"
    tipo: str = "opcion-multiple"
    enunciado: str = ""
    opciones: Optional[list[str]] = None
    respuesta_correcta: Optional[str] = None
    tiempo_limite: int = 30
    puntos_por_puesto: dict[str, int] = field(default_factory=dict)
    orden: int = 0
    activa: bool = True
    creado_en: Optional[datetime] = None
    actualizado_en: Optional[datetime] = None


@dataclass
class Respuesta:
    id: UUID
    pregunta_id: UUID
    jugador_id: UUID
    opcion_seleccionada: Optional[str] = None
    texto_respuesta: Optional[str] = None
    correcta: Optional[bool] = None
    enviado_en: Optional[datetime] = None
    secuencia: Optional[int] = None
    numero_orden: Optional[int] = None
    puntos: int = 0
    creado_en: Optional[datetime] = None
    jugador_nombre: Optional[str] = None


@dataclass
class Reto:
    id: UUID
    grado_id: UUID
    nombre: str
    instrucciones: Optional[str] = None
    tipo: str = "individual"
    puntos_por_puesto: dict[str, int] = field(default_factory=dict)
    orden: int = 0
    creado_en: Optional[datetime] = None


@dataclass
class PuntajeReto:
    id: UUID
    reto_id: UUID
    jugador_id: Optional[UUID] = None
    colegio_id: Optional[UUID] = None
    puesto: int = 0
    puntos: int = 0
    creado_en: Optional[datetime] = None


@dataclass
class PodiumEntry:
    puesto: int
    nombre: str
    puntos_total: int
    es_colegio: bool
    entity_id: UUID


@dataclass
class TokenInfo:
    token: str
    role: str


def entity_to_dict(obj: Any) -> dict[str, Any]:
    """Convierte dataclass a dict, manejando UUID y datetime."""
    out: dict[str, Any] = {}
    for field_name in getattr(obj, "__dataclass_fields__", {}):
        value = getattr(obj, field_name)
        if isinstance(value, UUID):
            out[field_name] = str(value)
        elif isinstance(value, datetime):
            out[field_name] = value.isoformat()
        elif isinstance(value, list) or isinstance(value, dict):
            out[field_name] = value
        elif value is None:
            out[field_name] = None
        else:
            out[field_name] = value
    return out

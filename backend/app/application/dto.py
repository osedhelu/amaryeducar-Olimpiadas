from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class JoinRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=4)
    alumno_id: uuid.UUID


class CrearSesionRequest(BaseModel):
    grado_id: uuid.UUID
    tipo: str = "oficial"
    colegio_id: Optional[uuid.UUID] = None


class CrearColegioRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=120)
    codigo: Optional[str] = Field(default=None, max_length=20)


class ActualizarColegioRequest(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=120)
    codigo: Optional[str] = Field(default=None, max_length=20)


class CrearAlumnoRequest(BaseModel):
    colegio_id: uuid.UUID
    grado_id: uuid.UUID
    nombre: str = Field(min_length=1, max_length=120)


class ActualizarAlumnoRequest(BaseModel):
    colegio_id: Optional[uuid.UUID] = None
    grado_id: Optional[uuid.UUID] = None
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=120)


class CrearDueloRequest(BaseModel):
    grado_id: uuid.UUID
    alumno_a_id: uuid.UUID
    alumno_b_id: uuid.UUID


class ActualizarSesionRequest(BaseModel):
    estado: Optional[str] = None
    pregunta_activa_id: Optional[uuid.UUID] = None
    reto_activo_id: Optional[uuid.UUID] = None
    cronometro_inicio: Optional[datetime] = None
    cronometro_segundos: Optional[int] = None
    reset_pregunta: Optional[bool] = None


class EnviarRespuestaRequest(BaseModel):
    pregunta_id: uuid.UUID
    jugador_id: uuid.UUID
    opcion_seleccionada: Optional[str] = None
    texto_respuesta: Optional[str] = None
    enviado_en: Optional[datetime] = None


class AprobarRespuestaRequest(BaseModel):
    correcta: bool


class AsignarPuestoRetoRequest(BaseModel):
    reto_id: uuid.UUID
    jugador_id: Optional[uuid.UUID] = None
    colegio_id: Optional[uuid.UUID] = None
    puesto: int = Field(ge=1, le=10)

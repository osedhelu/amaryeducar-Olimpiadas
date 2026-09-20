from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class JoinRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=4)
    nombre: str = Field(min_length=1, max_length=80)
    colegioId: Optional[uuid.UUID] = None


class CrearSesionRequest(BaseModel):
    grado_id: uuid.UUID


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

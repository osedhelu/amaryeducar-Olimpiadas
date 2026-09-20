from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
    BigInteger,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PgUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class EstadoSesionEnum(str, enum.Enum):
    BORRADOR = "borrador"
    LOBBY = "lobby"
    PREGUNTA = "pregunta"
    RESULTADO = "resultado"
    RETO = "reto"
    PODIUM = "podium"
    FINAL = "final"


class TipoPreguntaEnum(str, enum.Enum):
    OPCION_MULTIPLE = "opcion-multiple"
    ABIERTA = "abierta"


class SesionNumeroEnum(str, enum.Enum):
    UNO = "1"
    DOS = "2"


class TipoRetoEnum(str, enum.Enum):
    INDIVIDUAL = "individual"
    GRUPAL = "grupal"


class Base(DeclarativeBase):
    pass


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        PgUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )


def _ts() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=text("now()"))


class GradoORM(Base):
    __tablename__ = "grados"

    id: Mapped[uuid.UUID] = _uuid_pk()
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    puntos_sesion1: Mapped[dict] = mapped_column(JSONB, nullable=False)
    puntos_sesion2: Mapped[dict] = mapped_column(JSONB, nullable=False)
    creado_en: Mapped[datetime] = _ts()
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )


class ColegioORM(Base):
    __tablename__ = "colegios"

    id: Mapped[uuid.UUID] = _uuid_pk()
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    codigo: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    creado_en: Mapped[datetime] = _ts()


class SesionJuegoORM(Base):
    __tablename__ = "sesiones_juego"

    id: Mapped[uuid.UUID] = _uuid_pk()
    pin: Mapped[str] = mapped_column(String(4), nullable=False, unique=True)
    grado_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("grados.id"), nullable=False
    )
    estado: Mapped[EstadoSesionEnum] = mapped_column(
        Enum(
            EstadoSesionEnum,
            name="estado_sesion",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        server_default="borrador",
    )
    pregunta_activa_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("preguntas.id"), nullable=True
    )
    reto_activo_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("retos.id"), nullable=True
    )
    cronometro_inicio: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cronometro_segundos: Mapped[int] = mapped_column(Integer, server_default="30")
    creado_en: Mapped[datetime] = _ts()
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )


class JugadorORM(Base):
    __tablename__ = "jugadores"

    id: Mapped[uuid.UUID] = _uuid_pk()
    sesion_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("sesiones_juego.id", ondelete="CASCADE"),
        nullable=False,
    )
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    colegio_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("colegios.id"), nullable=True
    )
    conectado: Mapped[bool] = mapped_column(Boolean, server_default="false")
    ultima_conexion: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    creado_en: Mapped[datetime] = _ts()

    __table_args__ = (UniqueConstraint("sesion_id", "nombre"),)


class PreguntaORM(Base):
    __tablename__ = "preguntas"

    id: Mapped[uuid.UUID] = _uuid_pk()
    grado_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("grados.id"), nullable=False
    )
    sesion: Mapped[SesionNumeroEnum] = mapped_column(
        Enum(
            SesionNumeroEnum,
            name="sesion_numero",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        server_default="1",
    )
    tipo: Mapped[TipoPreguntaEnum] = mapped_column(
        Enum(
            TipoPreguntaEnum,
            name="tipo_pregunta",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        server_default="opcion-multiple",
    )
    enunciado: Mapped[str] = mapped_column(Text, nullable=False)
    opciones: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    respuesta_correcta: Mapped[str | None] = mapped_column(Text, nullable=True)
    tiempo_limite: Mapped[int] = mapped_column(Integer, server_default="30")
    puntos_por_puesto: Mapped[dict] = mapped_column(JSONB, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    activa: Mapped[bool] = mapped_column(Boolean, server_default="true")
    creado_en: Mapped[datetime] = _ts()
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )

    __table_args__ = (UniqueConstraint("grado_id", "sesion", "orden"),)


class RespuestaORM(Base):
    __tablename__ = "respuestas"

    id: Mapped[uuid.UUID] = _uuid_pk()
    pregunta_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("preguntas.id"), nullable=False
    )
    jugador_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("jugadores.id"), nullable=False
    )
    opcion_seleccionada: Mapped[str | None] = mapped_column(Text, nullable=True)
    texto_respuesta: Mapped[str | None] = mapped_column(Text, nullable=True)
    correcta: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    enviado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
    secuencia: Mapped[int | None] = mapped_column(
        BigInteger,
        server_default=text("nextval('respuestas_secuencia_seq')"),
    )
    numero_orden: Mapped[int | None] = mapped_column(Integer, nullable=True)
    puntos: Mapped[int] = mapped_column(Integer, server_default="0")
    creado_en: Mapped[datetime] = _ts()

    __table_args__ = (UniqueConstraint("pregunta_id", "jugador_id"),)


class RetoORM(Base):
    __tablename__ = "retos"

    id: Mapped[uuid.UUID] = _uuid_pk()
    grado_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("grados.id"), nullable=False
    )
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    instrucciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    tipo: Mapped[TipoRetoEnum] = mapped_column(
        Enum(
            TipoRetoEnum,
            name="tipo_reto",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        server_default="individual",
    )
    puntos_por_puesto: Mapped[dict] = mapped_column(JSONB, nullable=False)
    orden: Mapped[int] = mapped_column(Integer, nullable=False)
    creado_en: Mapped[datetime] = _ts()

    __table_args__ = (UniqueConstraint("grado_id", "orden"),)


class PuntajeRetoORM(Base):
    __tablename__ = "puntajes_retos"

    id: Mapped[uuid.UUID] = _uuid_pk()
    reto_id: Mapped[uuid.UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("retos.id", ondelete="CASCADE"), nullable=False
    )
    jugador_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True),
        ForeignKey("jugadores.id", ondelete="CASCADE"),
        nullable=True,
    )
    colegio_id: Mapped[uuid.UUID | None] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("colegios.id"), nullable=True
    )
    puesto: Mapped[int] = mapped_column(Integer, nullable=False)
    puntos: Mapped[int] = mapped_column(Integer, nullable=False)
    creado_en: Mapped[datetime] = _ts()


class ParametroORM(Base):
    __tablename__ = "parametros"

    clave: Mapped[str] = mapped_column(Text, primary_key=True)
    valor: Mapped[str] = mapped_column(Text, nullable=False)
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )

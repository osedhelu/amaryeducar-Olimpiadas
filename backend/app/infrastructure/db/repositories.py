from __future__ import annotations

import uuid
from datetime import datetime
from typing import Sequence

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities import (
    Alumno,
    Colegio,
    Grado,
    Jugador,
    PodiumEntry,
    Pregunta,
    PuntajeReto,
    Respuesta,
    Reto,
    SesionJuego,
)
from app.infrastructure.db.models import (
    AlumnoORM,
    ColegioORM,
    GradoORM,
    JugadorORM,
    PreguntaORM,
    PuntajeRetoORM,
    RespuestaORM,
    RetoORM,
    SesionJuegoORM,
)


def _row_to_obj(row, cls):
    kwargs = {}
    for field_name in cls.__dataclass_fields__:
        try:
            kwargs[field_name] = getattr(row, field_name)
        except AttributeError:
            kwargs[field_name] = None
    return cls(**kwargs)


class GradoRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar(self) -> list[Grado]:
        rows = (
            (await self.db.execute(select(GradoORM).order_by(GradoORM.orden)))
            .scalars()
            .all()
        )
        return [_row_to_obj(r, Grado) for r in rows]

    async def por_id(self, grado_id: uuid.UUID) -> Grado | None:
        row = await self.db.get(GradoORM, grado_id)
        return _row_to_obj(row, Grado) if row else None


class ColegioRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar(self) -> list[Colegio]:
        rows = (
            (await self.db.execute(select(ColegioORM).order_by(ColegioORM.nombre)))
            .scalars()
            .all()
        )
        return [_row_to_obj(r, Colegio) for r in rows]

    async def por_id(self, colegio_id: uuid.UUID) -> Colegio | None:
        row = await self.db.get(ColegioORM, colegio_id)
        return _row_to_obj(row, Colegio) if row else None

    async def crear(self, nombre: str, codigo: str | None = None) -> Colegio:
        row = ColegioORM(nombre=nombre, codigo=codigo)
        self.db.add(row)
        await self.db.flush()
        return _row_to_obj(row, Colegio)

    async def actualizar(
        self,
        colegio_id: uuid.UUID,
        *,
        nombre: str | None = None,
        codigo: str | None = None,
    ) -> Colegio | None:
        values: dict = {}
        if nombre is not None:
            values["nombre"] = nombre
        if codigo is not None:
            values["codigo"] = codigo
        if values:
            await self.db.execute(
                update(ColegioORM).where(ColegioORM.id == colegio_id).values(**values)
            )
            await self.db.flush()
        return await self.por_id(colegio_id)

    async def eliminar(self, colegio_id: uuid.UUID) -> None:
        await self.db.execute(delete(ColegioORM).where(ColegioORM.id == colegio_id))
        await self.db.flush()


class AlumnoRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar(
        self, grado_id: uuid.UUID | None = None, colegio_id: uuid.UUID | None = None
    ) -> list[Alumno]:
        query = select(AlumnoORM).order_by(AlumnoORM.nombre)
        if grado_id is not None:
            query = query.where(AlumnoORM.grado_id == grado_id)
        if colegio_id is not None:
            query = query.where(AlumnoORM.colegio_id == colegio_id)
        rows = (await self.db.execute(query)).scalars().all()
        return [_row_to_obj(r, Alumno) for r in rows]

    async def por_id(self, alumno_id: uuid.UUID) -> Alumno | None:
        row = await self.db.get(AlumnoORM, alumno_id)
        return _row_to_obj(row, Alumno) if row else None

    async def crear(
        self, colegio_id: uuid.UUID, grado_id: uuid.UUID, nombre: str
    ) -> Alumno:
        row = AlumnoORM(colegio_id=colegio_id, grado_id=grado_id, nombre=nombre)
        self.db.add(row)
        await self.db.flush()
        return _row_to_obj(row, Alumno)

    async def actualizar(
        self,
        alumno_id: uuid.UUID,
        *,
        nombre: str | None = None,
        colegio_id: uuid.UUID | None = None,
        grado_id: uuid.UUID | None = None,
    ) -> Alumno | None:
        values: dict = {}
        if nombre is not None:
            values["nombre"] = nombre
        if colegio_id is not None:
            values["colegio_id"] = colegio_id
        if grado_id is not None:
            values["grado_id"] = grado_id
        if values:
            await self.db.execute(
                update(AlumnoORM).where(AlumnoORM.id == alumno_id).values(**values)
            )
            await self.db.flush()
        return await self.por_id(alumno_id)

    async def eliminar(self, alumno_id: uuid.UUID) -> None:
        await self.db.execute(delete(AlumnoORM).where(AlumnoORM.id == alumno_id))
        await self.db.flush()


class SesionRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def crear(
        self,
        pin: str,
        grado_id: uuid.UUID,
        estado: str = "lobby",
        tipo: str = "oficial",
        colegio_id: uuid.UUID | None = None,
        alumno_a_id: uuid.UUID | None = None,
        alumno_b_id: uuid.UUID | None = None,
    ) -> SesionJuego:
        row = SesionJuegoORM(
            pin=pin,
            grado_id=grado_id,
            estado=estado,
            tipo=tipo,
            colegio_id=colegio_id,
            alumno_a_id=alumno_a_id,
            alumno_b_id=alumno_b_id,
        )
        self.db.add(row)
        await self.db.flush()
        return _row_to_obj(row, SesionJuego)

    async def por_pin(self, pin: str) -> SesionJuego | None:
        row = (
            await self.db.execute(
                select(SesionJuegoORM).where(SesionJuegoORM.pin == pin)
            )
        ).scalar_one_or_none()
        return _row_to_obj(row, SesionJuego) if row else None

    async def por_id(self, sesion_id: uuid.UUID) -> SesionJuego | None:
        row = await self.db.get(SesionJuegoORM, sesion_id)
        return _row_to_obj(row, SesionJuego) if row else None

    async def listar(self) -> list[SesionJuego]:
        rows = (
            (
                await self.db.execute(
                    select(SesionJuegoORM).order_by(SesionJuegoORM.creado_en.desc())
                )
            )
            .scalars()
            .all()
        )
        return [_row_to_obj(r, SesionJuego) for r in rows]

    async def actualizar(
        self,
        sesion_id: uuid.UUID,
        *,
        estado: str | None = None,
        pregunta_activa_id: uuid.UUID | None = None,
        reto_activo_id: uuid.UUID | None = None,
        cronometro_inicio: datetime | None = None,
        cronometro_segundos: int | None = None,
        tipo: str | None = None,
        colegio_id: uuid.UUID | None = None,
        reset_pregunta: bool = False,
    ) -> SesionJuego | None:
        values: dict = {}
        if estado is not None:
            values["estado"] = estado
        if tipo is not None:
            values["tipo"] = tipo
        if colegio_id is not None:
            values["colegio_id"] = colegio_id
        if reset_pregunta:
            values["pregunta_activa_id"] = None
        elif pregunta_activa_id is not None:
            values["pregunta_activa_id"] = pregunta_activa_id
        if reto_activo_id is not None:
            values["reto_activo_id"] = reto_activo_id
        if cronometro_inicio is not None:
            values["cronometro_inicio"] = cronometro_inicio
        if cronometro_segundos is not None:
            values["cronometro_segundos"] = cronometro_segundos
        if values:
            await self.db.execute(
                update(SesionJuegoORM)
                .where(SesionJuegoORM.id == sesion_id)
                .values(**values, actualizado_en=datetime.now())
            )
            await self.db.flush()
        return await self.por_id(sesion_id)


class JugadorRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def crear(
        self,
        sesion_id: uuid.UUID,
        nombre: str,
        colegio_id: uuid.UUID | None,
        alumno_id: uuid.UUID | None = None,
    ) -> Jugador:
        row = JugadorORM(
            sesion_id=sesion_id,
            nombre=nombre,
            colegio_id=colegio_id,
            alumno_id=alumno_id,
            conectado=True,
        )
        self.db.add(row)
        await self.db.flush()
        return _row_to_obj(row, Jugador)

    async def por_sesion_y_nombre(
        self, sesion_id: uuid.UUID, nombre: str
    ) -> Jugador | None:
        row = (
            await self.db.execute(
                select(JugadorORM).where(
                    JugadorORM.sesion_id == sesion_id, JugadorORM.nombre == nombre
                )
            )
        ).scalar_one_or_none()
        return _row_to_obj(row, Jugador) if row else None

    async def por_sesion_y_alumno(
        self, sesion_id: uuid.UUID, alumno_id: uuid.UUID
    ) -> Jugador | None:
        row = (
            await self.db.execute(
                select(JugadorORM).where(
                    JugadorORM.sesion_id == sesion_id,
                    JugadorORM.alumno_id == alumno_id,
                )
            )
        ).scalar_one_or_none()
        return _row_to_obj(row, Jugador) if row else None

    async def por_id(self, jugador_id: uuid.UUID) -> Jugador | None:
        row = await self.db.get(JugadorORM, jugador_id)
        return _row_to_obj(row, Jugador) if row else None

    async def listar_por_sesion(self, sesion_id: uuid.UUID) -> list[Jugador]:
        rows = (
            (
                await self.db.execute(
                    select(JugadorORM)
                    .where(JugadorORM.sesion_id == sesion_id)
                    .order_by(JugadorORM.creado_en)
                )
            )
            .scalars()
            .all()
        )
        return [_row_to_obj(r, Jugador) for r in rows]

    async def marcar_conectado(
        self, jugador_id: str | uuid.UUID, conectado: bool
    ) -> None:
        jid = jugador_id if isinstance(jugador_id, uuid.UUID) else uuid.UUID(jugador_id)
        await self.db.execute(
            update(JugadorORM)
            .where(JugadorORM.id == jid)
            .values(
                conectado=conectado,
                ultima_conexion=(
                    datetime.now() if conectado else JugadorORM.ultima_conexion
                ),
            )
        )

    async def actualizar(
        self,
        jugador_id: uuid.UUID,
        *,
        conectado: bool | None = None,
        colegio_id: uuid.UUID | None = None,
        alumno_id: uuid.UUID | None = None,
    ) -> Jugador | None:
        values: dict = {}
        if conectado is not None:
            values["conectado"] = conectado
        if colegio_id is not None:
            values["colegio_id"] = colegio_id
        if alumno_id is not None:
            values["alumno_id"] = alumno_id
        if values:
            values["ultima_conexion"] = datetime.now()
            await self.db.execute(
                update(JugadorORM).where(JugadorORM.id == jugador_id).values(**values)
            )
            await self.db.flush()
        return await self.por_id(jugador_id)

    async def desconectar_todos(self, sesion_id: uuid.UUID) -> None:
        await self.db.execute(
            update(JugadorORM)
            .where(JugadorORM.sesion_id == sesion_id)
            .values(conectado=False)
        )

    async def marcar_conectados(
        self, sesion_id: uuid.UUID, jugador_ids: Sequence[str | uuid.UUID]
    ) -> None:
        """Marca como conectados los jugadores indicados (con WS abierto)."""
        if not jugador_ids:
            return
        ids = [j if isinstance(j, uuid.UUID) else uuid.UUID(j) for j in jugador_ids]
        await self.db.execute(
            update(JugadorORM)
            .where(JugadorORM.sesion_id == sesion_id, JugadorORM.id.in_(ids))
            .values(conectado=True)
        )
        await self.db.flush()

    async def contar_conectados(self, sesion_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(JugadorORM.id).where(
                JugadorORM.sesion_id == sesion_id, JugadorORM.conectado.is_(True)
            )
        )
        return len(result.scalars().all())


class PreguntaRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar_por_grado(self, grado_id: uuid.UUID) -> list[Pregunta]:
        rows = (
            (
                await self.db.execute(
                    select(PreguntaORM)
                    .where(PreguntaORM.grado_id == grado_id)
                    .order_by(PreguntaORM.sesion, PreguntaORM.orden)
                )
            )
            .scalars()
            .all()
        )
        return [_row_to_obj(r, Pregunta) for r in rows]

    async def por_id(self, pregunta_id: uuid.UUID) -> Pregunta | None:
        row = await self.db.get(PreguntaORM, pregunta_id)
        return _row_to_obj(row, Pregunta) if row else None


class RespuestaRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def crear(
        self,
        pregunta_id: uuid.UUID,
        jugador_id: uuid.UUID,
        opcion: str | None,
        texto: str | None,
        correcta: bool | None,
        enviado_en: datetime,
        numero_orden: int,
        puntos: int,
    ) -> Respuesta:
        row = RespuestaORM(
            pregunta_id=pregunta_id,
            jugador_id=jugador_id,
            opcion_seleccionada=opcion,
            texto_respuesta=texto,
            correcta=correcta,
            enviado_en=enviado_en,
            numero_orden=numero_orden,
            puntos=puntos,
        )
        self.db.add(row)
        await self.db.flush()
        return _row_to_obj(row, Respuesta)

    async def existe(self, pregunta_id: uuid.UUID, jugador_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(RespuestaORM.id).where(
                RespuestaORM.pregunta_id == pregunta_id,
                RespuestaORM.jugador_id == jugador_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def contar_por_pregunta_sesion(
        self, pregunta_id: uuid.UUID, sesion_id: uuid.UUID
    ) -> int:
        result = await self.db.execute(
            select(RespuestaORM.id)
            .join(JugadorORM, JugadorORM.id == RespuestaORM.jugador_id)
            .where(
                RespuestaORM.pregunta_id == pregunta_id,
                JugadorORM.sesion_id == sesion_id,
            )
        )
        return len(result.scalars().all())

    async def contar_correctas_previas(
        self,
        pregunta_id: uuid.UUID,
        sesion_id: uuid.UUID,
        enviado_en: datetime,
        secuencia: int,
    ) -> int:
        """Replica el trigger SQL: count correctas previas con desempate (enviado_en, secuencia)."""
        result = await self.db.execute(
            select(RespuestaORM.id)
            .join(JugadorORM, JugadorORM.id == RespuestaORM.jugador_id)
            .where(
                RespuestaORM.pregunta_id == pregunta_id,
                JugadorORM.sesion_id == sesion_id,
                RespuestaORM.correcta.is_(True),
                (
                    (RespuestaORM.enviado_en < enviado_en)
                    | (
                        (RespuestaORM.enviado_en == enviado_en)
                        & (RespuestaORM.secuencia < secuencia)
                    )
                ),
            )
        )
        return len(result.scalars().all())

    async def contar_anteriores(
        self,
        pregunta_id: uuid.UUID,
        sesion_id: uuid.UUID,
        enviado_en: datetime,
        secuencia: int,
    ) -> int:
        """Total de respuestas anteriores en la sesión (nº de orden global)."""
        result = await self.db.execute(
            select(RespuestaORM.id)
            .join(JugadorORM, JugadorORM.id == RespuestaORM.jugador_id)
            .where(
                RespuestaORM.pregunta_id == pregunta_id,
                JugadorORM.sesion_id == sesion_id,
                (
                    (RespuestaORM.enviado_en < enviado_en)
                    | (
                        (RespuestaORM.enviado_en == enviado_en)
                        & (RespuestaORM.secuencia < secuencia)
                    )
                ),
            )
        )
        return len(result.scalars().all())

    async def listar_por_sesion(
        self, sesion_id: uuid.UUID, pregunta_id: uuid.UUID | None = None
    ) -> list[Respuesta]:
        query = (
            select(RespuestaORM, JugadorORM.nombre)
            .join(JugadorORM, JugadorORM.id == RespuestaORM.jugador_id)
            .where(JugadorORM.sesion_id == sesion_id)
        )
        if pregunta_id is not None:
            query = query.where(RespuestaORM.pregunta_id == pregunta_id)
        rows = (
            await self.db.execute(
                query.order_by(RespuestaORM.enviado_en, RespuestaORM.secuencia)
            )
        ).all()
        out: list[Respuesta] = []
        for row, nombre in rows:
            r = _row_to_obj(row, Respuesta)
            r.jugador_nombre = nombre
            out.append(r)
        return out

    async def por_id(self, respuesta_id: uuid.UUID) -> Respuesta | None:
        row = await self.db.get(RespuestaORM, respuesta_id)
        return _row_to_obj(row, Respuesta) if row else None

    async def por_id_existente(
        self, pregunta_id: uuid.UUID, jugador_id: uuid.UUID
    ) -> Respuesta | None:
        row = (
            await self.db.execute(
                select(RespuestaORM).where(
                    RespuestaORM.pregunta_id == pregunta_id,
                    RespuestaORM.jugador_id == jugador_id,
                )
            )
        ).scalar_one_or_none()
        return _row_to_obj(row, Respuesta) if row else None

    async def aprobar(self, respuesta_id: uuid.UUID, correcta: bool) -> None:
        await self.db.execute(
            update(RespuestaORM)
            .where(RespuestaORM.id == respuesta_id)
            .values(correcta=correcta)
        )

    async def asignar_puntos(self, respuesta_id: uuid.UUID, puntos: int) -> None:
        await self.db.execute(
            update(RespuestaORM)
            .where(RespuestaORM.id == respuesta_id)
            .values(puntos=puntos)
        )


class RetoRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def listar_por_grado(self, grado_id: uuid.UUID) -> list[Reto]:
        rows = (
            (
                await self.db.execute(
                    select(RetoORM)
                    .where(RetoORM.grado_id == grado_id)
                    .order_by(RetoORM.orden)
                )
            )
            .scalars()
            .all()
        )
        return [_row_to_obj(r, Reto) for r in rows]

    async def por_id(self, reto_id: uuid.UUID) -> Reto | None:
        row = await self.db.get(RetoORM, reto_id)
        return _row_to_obj(row, Reto) if row else None


class PuntajeRetoRepo:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert(
        self,
        reto_id: uuid.UUID,
        sesion_id: uuid.UUID | None,
        jugador_id: uuid.UUID | None,
        colegio_id: uuid.UUID | None,
        puesto: int,
        puntos: int,
    ) -> None:
        await self.db.execute(
            delete(PuntajeRetoORM).where(
                PuntajeRetoORM.reto_id == reto_id,
                (
                    PuntajeRetoORM.jugador_id.is_(jugador_id)
                    if jugador_id is None
                    else PuntajeRetoORM.jugador_id == jugador_id
                ),
            )
        )
        row = PuntajeRetoORM(
            reto_id=reto_id,
            sesion_id=sesion_id,
            jugador_id=jugador_id,
            colegio_id=colegio_id,
            puesto=puesto,
            puntos=puntos,
        )
        self.db.add(row)
        await self.db.flush()

    async def listar_por_reto(
        self, reto_id: uuid.UUID, sesion_id: uuid.UUID | None = None
    ) -> list[PuntajeReto]:
        query = select(PuntajeRetoORM).where(PuntajeRetoORM.reto_id == reto_id)
        if sesion_id is not None:
            query = query.where(PuntajeRetoORM.sesion_id == sesion_id)
        rows = (
            (await self.db.execute(query.order_by(PuntajeRetoORM.puesto)))
            .scalars()
            .all()
        )
        return [_row_to_obj(r, PuntajeReto) for r in rows]

    async def eliminar_por_participante(
        self,
        reto_id: uuid.UUID,
        sesion_id: uuid.UUID | None,
        jugador_id: uuid.UUID | None,
        colegio_id: uuid.UUID | None,
    ) -> None:
        conds = [
            PuntajeRetoORM.reto_id == reto_id,
        ]
        if sesion_id is not None:
            conds.append(PuntajeRetoORM.sesion_id == sesion_id)
        if jugador_id is not None:
            conds.append(PuntajeRetoORM.jugador_id == jugador_id)
        elif colegio_id is not None:
            conds.append(PuntajeRetoORM.colegio_id == colegio_id)
        await self.db.execute(delete(PuntajeRetoORM).where(*conds))
        await self.db.flush()


async def obtener_podium_rows(
    db: AsyncSession, sesion_id: uuid.UUID
) -> list[PodiumEntry]:
    """Replica sql/03-functions.sql obtener_podium en Python."""
    from sqlalchemy import func, case, text

    sesion_row = await db.get(SesionJuegoORM, sesion_id)
    if not sesion_row:
        return []
    grado_row = await db.get(GradoORM, sesion_row.grado_id)
    if not grado_row:
        return []
    es_grupal = grado_row.orden >= 4

    if es_grupal:
        # Sumar por colegio: respuestas correctas + puntajes de retos grupales
        resp_col = (
            select(
                ColegioORM.id.label("entity_id"),
                ColegioORM.nombre.label("nombre"),
                func.coalesce(RespuestaORM.puntos, 0).label("puntos"),
            )
            .join(JugadorORM, JugadorORM.colegio_id == ColegioORM.id)
            .outerjoin(RespuestaORM, RespuestaORM.jugador_id == JugadorORM.id)
            .where(JugadorORM.sesion_id == sesion_id, RespuestaORM.correcta.is_(True))
        )
        reto_col = (
            select(
                ColegioORM.id.label("entity_id"),
                ColegioORM.nombre.label("nombre"),
                func.coalesce(PuntajeRetoORM.puntos, 0).label("puntos"),
            )
            .join(PuntajeRetoORM, PuntajeRetoORM.colegio_id == ColegioORM.id)
            .where(
                PuntajeRetoORM.sesion_id == sesion_id,
                PuntajeRetoORM.reto_id.in_(
                    select(RetoORM.id).where(RetoORM.grado_id == sesion_row.grado_id)
                ),
            )
        )
        union = resp_col.union_all(reto_col).subquery()
        query = (
            select(
                union.c.entity_id,
                union.c.nombre,
                func.coalesce(func.sum(union.c.puntos), 0).label("total"),
            )
            .where(
                union.c.entity_id.in_(
                    select(ColegioORM.id)
                    .join(JugadorORM, JugadorORM.colegio_id == ColegioORM.id)
                    .where(JugadorORM.sesion_id == sesion_id)
                )
            )
            .group_by(union.c.entity_id, union.c.nombre)
            .order_by(text("total DESC"), union.c.nombre)
        )
        rows = (await db.execute(query)).all()
        return [
            PodiumEntry(
                puesto=i + 1,
                nombre=r.nombre,
                puntos_total=r.total,
                es_colegio=True,
                entity_id=r.entity_id,
            )
            for i, r in enumerate(rows)
        ]
    else:
        resp_col = (
            select(
                JugadorORM.id.label("entity_id"),
                JugadorORM.nombre.label("nombre"),
                func.coalesce(RespuestaORM.puntos, 0).label("puntos"),
            )
            .outerjoin(RespuestaORM, RespuestaORM.jugador_id == JugadorORM.id)
            .where(JugadorORM.sesion_id == sesion_id, RespuestaORM.correcta.is_(True))
        )
        reto_col = (
            select(
                JugadorORM.id.label("entity_id"),
                JugadorORM.nombre.label("nombre"),
                func.coalesce(PuntajeRetoORM.puntos, 0).label("puntos"),
            )
            .outerjoin(PuntajeRetoORM, PuntajeRetoORM.jugador_id == JugadorORM.id)
            .where(
                PuntajeRetoORM.sesion_id == sesion_id,
                PuntajeRetoORM.reto_id.in_(
                    select(RetoORM.id).where(RetoORM.grado_id == sesion_row.grado_id)
                ),
            )
        )
        union = resp_col.union_all(reto_col).subquery()
        query = (
            select(
                union.c.entity_id,
                union.c.nombre,
                func.coalesce(func.sum(union.c.puntos), 0).label("total"),
            )
            .where(
                union.c.entity_id.in_(
                    select(JugadorORM.id).where(JugadorORM.sesion_id == sesion_id)
                )
            )
            .group_by(union.c.entity_id, union.c.nombre)
            .order_by(text("total DESC"), union.c.nombre)
        )
        rows = (await db.execute(query)).all()
        return [
            PodiumEntry(
                puesto=i + 1,
                nombre=r.nombre,
                puntos_total=r.total,
                es_colegio=False,
                entity_id=r.entity_id,
            )
            for i, r in enumerate(rows)
        ]


async def generar_pin_unico(db: AsyncSession) -> str:
    """Genera un PIN de 4 dígitos único."""
    import random

    while True:
        pin = f"{random.randint(0, 9999):04d}"
        existe = (
            await db.execute(select(SesionJuegoORM.id).where(SesionJuegoORM.pin == pin))
        ).scalar_one_or_none()
        if not existe:
            return pin


async def obtener_tabla_colegios(db: AsyncSession, grado_id: uuid.UUID) -> list[dict]:
    """Tabla todos contra todos: puntos por colegio sumando respuestas y retos
    de todas las sesiones OFICIALES del grado. Incluye colegios con 0 puntos
    (los que tienen alumnos registrados en ese grado)."""
    from sqlalchemy import func, text

    # Colegios participantes = los que tienen alumnos en este grado
    participantes = (
        select(ColegioORM.id)
        .join(AlumnoORM, AlumnoORM.colegio_id == ColegioORM.id)
        .where(AlumnoORM.grado_id == grado_id)
    )

    # Sesiones oficiales del grado
    sesiones_oficiales = select(SesionJuegoORM.id).where(
        SesionJuegoORM.grado_id == grado_id, SesionJuegoORM.tipo == "oficial"
    )

    resp_col = (
        select(
            ColegioORM.id.label("entity_id"),
            ColegioORM.nombre.label("nombre"),
            func.coalesce(RespuestaORM.puntos, 0).label("puntos"),
        )
        .join(JugadorORM, JugadorORM.colegio_id == ColegioORM.id)
        .outerjoin(RespuestaORM, RespuestaORM.jugador_id == JugadorORM.id)
        .where(
            JugadorORM.sesion_id.in_(sesiones_oficiales),
            RespuestaORM.correcta.is_(True),
        )
    )
    reto_col = (
        select(
            ColegioORM.id.label("entity_id"),
            ColegioORM.nombre.label("nombre"),
            func.coalesce(PuntajeRetoORM.puntos, 0).label("puntos"),
        )
        .join(PuntajeRetoORM, PuntajeRetoORM.colegio_id == ColegioORM.id)
        .where(
            PuntajeRetoORM.sesion_id.in_(sesiones_oficiales),
            PuntajeRetoORM.reto_id.in_(
                select(RetoORM.id).where(RetoORM.grado_id == grado_id)
            ),
        )
    )
    union = resp_col.union_all(reto_col).subquery()
    query = (
        select(
            union.c.entity_id,
            union.c.nombre,
            func.coalesce(func.sum(union.c.puntos), 0).label("total"),
        )
        .where(union.c.entity_id.in_(participantes))
        .group_by(union.c.entity_id, union.c.nombre)
        .order_by(text("total DESC"), union.c.nombre)
    )
    rows = (await db.execute(query)).all()

    # Asegurar que los colegios participantes sin puntos también aparezcan
    colegios_participantes = (
        (await db.execute(select(ColegioORM).where(ColegioORM.id.in_(participantes))))
        .scalars()
        .all()
    )
    todos = {(c.id, c.nombre): 0 for c in colegios_participantes}
    for r in rows:
        todos[(r.entity_id, r.nombre)] = r.total

    ordenados = sorted(todos.items(), key=lambda kv: (-kv[1], kv[0][1]))
    return [
        {
            "puesto": i + 1,
            "colegio_id": str(cid),
            "nombre": nombre,
            "puntos_total": puntos,
            "es_colegio": True,
        }
        for i, ((cid, nombre), puntos) in enumerate(ordenados)
    ]

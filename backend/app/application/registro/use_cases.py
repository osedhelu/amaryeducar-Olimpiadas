from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dto import (
    ActualizarAlumnoRequest,
    ActualizarColegioRequest,
    CrearAlumnoRequest,
    CrearColegioRequest,
    CrearDueloRequest,
)
from app.application.ports import RealtimePublisher
from app.core.exceptions import DatosInvalidos, PinNoEncontrado
from app.domain.entities import entity_to_dict
from app.domain.enums import EstadoSesion
from app.infrastructure.db.repositories import (
    AlumnoRepo,
    ColegioRepo,
    SesionRepo,
    generar_pin_unico,
)


class RegistroUseCases:
    """CRUD de colegios y alumnos (los registra el docente)."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Colegios ────────────────────────────────────────────

    async def listar_colegios(self) -> list[dict]:
        return [entity_to_dict(c) for c in await ColegioRepo(self.db).listar()]

    async def crear_colegio(self, req: CrearColegioRequest) -> dict:
        colegio = await ColegioRepo(self.db).crear(req.nombre, req.codigo)
        await self.db.commit()
        return entity_to_dict(colegio)

    async def actualizar_colegio(
        self, colegio_id: str, req: ActualizarColegioRequest
    ) -> dict:
        repo = ColegioRepo(self.db)
        existente = await repo.por_id(uuid.UUID(colegio_id))
        if not existente:
            raise DatosInvalidos("Colegio no encontrado")
        colegio = await repo.actualizar(
            uuid.UUID(colegio_id), nombre=req.nombre, codigo=req.codigo
        )
        await self.db.commit()
        return entity_to_dict(colegio) if colegio else {}

    async def eliminar_colegio(self, colegio_id: str) -> dict:
        repo = ColegioRepo(self.db)
        existente = await repo.por_id(uuid.UUID(colegio_id))
        if not existente:
            raise DatosInvalidos("Colegio no encontrado")
        await repo.eliminar(uuid.UUID(colegio_id))
        await self.db.commit()
        return {"ok": True}

    # ── Alumnos ─────────────────────────────────────────────

    async def listar_alumnos(
        self, grado_id: str | None = None, colegio_id: str | None = None
    ) -> list[dict]:
        gid = uuid.UUID(grado_id) if grado_id else None
        cid = uuid.UUID(colegio_id) if colegio_id else None
        return [
            entity_to_dict(a)
            for a in await AlumnoRepo(self.db).listar(grado_id=gid, colegio_id=cid)
        ]

    async def crear_alumno(self, req: CrearAlumnoRequest) -> dict:
        alumno = await AlumnoRepo(self.db).crear(
            req.colegio_id, req.grado_id, req.nombre
        )
        await self.db.commit()
        return entity_to_dict(alumno)

    async def actualizar_alumno(
        self, alumno_id: str, req: ActualizarAlumnoRequest
    ) -> dict:
        repo = AlumnoRepo(self.db)
        existente = await repo.por_id(uuid.UUID(alumno_id))
        if not existente:
            raise DatosInvalidos("Alumno no encontrado")
        alumno = await repo.actualizar(
            uuid.UUID(alumno_id),
            nombre=req.nombre,
            colegio_id=req.colegio_id,
            grado_id=req.grado_id,
        )
        await self.db.commit()
        return entity_to_dict(alumno) if alumno else {}

    async def eliminar_alumno(self, alumno_id: str) -> dict:
        repo = AlumnoRepo(self.db)
        existente = await repo.por_id(uuid.UUID(alumno_id))
        if not existente:
            raise DatosInvalidos("Alumno no encontrado")
        await repo.eliminar(uuid.UUID(alumno_id))
        await self.db.commit()
        return {"ok": True}


class DueloUseCases:
    """Prueba 1v1: mismo grado, mismo o distinto colegio. No suma a la tabla oficial."""

    def __init__(self, db: AsyncSession, realtime: RealtimePublisher):
        self.db = db
        self.realtime = realtime

    async def crear(self, req: CrearDueloRequest) -> dict:
        alumno_repo = AlumnoRepo(self.db)
        a = await alumno_repo.por_id(req.alumno_a_id)
        b = await alumno_repo.por_id(req.alumno_b_id)
        if not a or not b:
            raise DatosInvalidos("Uno de los alumnos no existe")
        if a.id == b.id:
            raise DatosInvalidos("El duelo necesita dos alumnos distintos")
        if a.grado_id != req.grado_id or b.grado_id != req.grado_id:
            raise DatosInvalidos("Ambos alumnos deben pertenecer al grado del duelo")

        pin = await generar_pin_unico(self.db)
        sesion = await SesionRepo(self.db).crear(
            pin,
            req.grado_id,
            EstadoSesion.LOBBY.value,
            tipo="prueba",
            alumno_a_id=req.alumno_a_id,
            alumno_b_id=req.alumno_b_id,
        )
        await self.db.commit()
        return {
            **entity_to_dict(sesion),
            "alumnos": [entity_to_dict(a), entity_to_dict(b)],
        }

    async def listar_duelos(self) -> list[dict]:
        return [
            entity_to_dict(s)
            for s in await SesionRepo(self.db).listar()
            if s.tipo == "prueba"
        ]


class EnfrentamientoUseCases:
    """Tabla todos contra todos: puntos por colegio en sesiones oficiales de un grado."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def tabla_por_grado(self, grado_id: str) -> list[dict]:
        from app.infrastructure.db.repositories import obtener_tabla_colegios

        return await obtener_tabla_colegios(self.db, uuid.UUID(grado_id))

    async def alumnos_por_pin(self, pin: str) -> dict | None:
        """Alumnos elegibles para un PIN: todos los del grado en sesión oficial,
        o solo los 2 duelistas en una prueba."""
        sesion = await SesionRepo(self.db).por_pin(pin)
        if not sesion or sesion.estado == EstadoSesion.BORRADOR.value:
            raise PinNoEncontrado()
        repo = AlumnoRepo(self.db)
        if sesion.tipo == "prueba" and sesion.alumno_a_id and sesion.alumno_b_id:
            a = await repo.por_id(sesion.alumno_a_id)
            b = await repo.por_id(sesion.alumno_b_id)
            alumnos = [x for x in (a, b) if x is not None]
        else:
            alumnos = await repo.listar(grado_id=sesion.grado_id)
        return {
            "sesion": entity_to_dict(sesion),
            "alumnos": [entity_to_dict(x) for x in alumnos],
        }

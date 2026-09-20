"""Fakes de repositorios y del publisher realtime para tests unitarios sin BD."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.application.ports import RealtimePublisher
from app.domain.entities import (
    Alumno,
    Colegio,
    Grado,
    Jugador,
    Pregunta,
    PuntajeReto,
    Respuesta,
    Reto,
    SesionJuego,
)


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


class FakeDb:
    """Sesión asíncrona falsa: solo registra commits/flushes; los repos fake ignoran la db."""

    def __init__(self) -> None:
        self.commits = 0

    async def commit(self) -> None:
        self.commits += 1

    async def flush(self) -> None:
        pass

    async def rollback(self) -> None:
        pass

    def add(self, obj) -> None:
        pass


class FakeRealtime(RealtimePublisher):
    """Registra cada publish en memoria para poder asertar."""

    def _reset(self) -> None:
        self.eventos = []
        self.cierres_programados = []

    def __init__(self) -> None:
        self.eventos: list[tuple[str, dict, str | None]] = []
        self.cierres_programados: list[tuple[str, datetime, int]] = []

    async def publish(self, tipo, data, sesion_id=None):
        self.eventos.append((tipo, data, sesion_id))

    async def broadcast_sesion(self, sesion_id, tipo, data):
        self.eventos.append((tipo, data, sesion_id))

    async def programar_cierre(self, sesion_id, cronometro_inicio, segundos):
        self.cierres_programados.append((sesion_id, cronometro_inicio, segundos))


class _Singleton:
    _instancia: dict[type, object] = {}

    def __new__(cls, *args, **kwargs):
        if cls not in cls._instancia:
            cls._instancia[cls] = super().__new__(cls)
        return cls._instancia[cls]

    @classmethod
    def _reset(cls):
        cls._instancia.pop(cls, None)


class FakeGradoRepo(_Singleton):
    def __init__(self, db=None):
        self.grados: dict[uuid.UUID, Grado] = {}

    async def listar(self):
        return list(self.grados.values())

    async def por_id(self, grado_id):
        return self.grados.get(grado_id)


class FakeColegioRepo(_Singleton):
    def __init__(self, db=None):
        self.colegios: dict[uuid.UUID, Colegio] = {}

    async def listar(self):
        return list(self.colegios.values())

    async def por_id(self, colegio_id):
        return self.colegios.get(colegio_id)

    async def crear(self, nombre, codigo=None):
        colegio = Colegio(
            id=uuid.uuid4(), nombre=nombre, codigo=codigo, creado_en=_ahora()
        )
        self.colegios[colegio.id] = colegio
        return colegio

    async def actualizar(self, colegio_id, *, nombre=None, codigo=None):
        colegio = self.colegios.get(colegio_id)
        if not colegio:
            return None
        if nombre is not None:
            colegio.nombre = nombre
        if codigo is not None:
            colegio.codigo = codigo
        return colegio

    async def eliminar(self, colegio_id):
        self.colegios.pop(colegio_id, None)


class FakeAlumnoRepo(_Singleton):
    def __init__(self, db=None):
        self.alumnos: dict[uuid.UUID, Alumno] = {}

    async def listar(self, grado_id=None, colegio_id=None):
        out = list(self.alumnos.values())
        if grado_id is not None:
            out = [a for a in out if a.grado_id == grado_id]
        if colegio_id is not None:
            out = [a for a in out if a.colegio_id == colegio_id]
        return out

    async def por_id(self, alumno_id):
        return self.alumnos.get(alumno_id)

    async def crear(self, colegio_id, grado_id, nombre):
        alumno = Alumno(
            id=uuid.uuid4(),
            colegio_id=colegio_id,
            grado_id=grado_id,
            nombre=nombre,
            creado_en=_ahora(),
        )
        self.alumnos[alumno.id] = alumno
        return alumno

    async def actualizar(
        self, alumno_id, *, nombre=None, colegio_id=None, grado_id=None
    ):
        alumno = self.alumnos.get(alumno_id)
        if not alumno:
            return None
        if nombre is not None:
            alumno.nombre = nombre
        if colegio_id is not None:
            alumno.colegio_id = colegio_id
        if grado_id is not None:
            alumno.grado_id = grado_id
        return alumno

    async def eliminar(self, alumno_id):
        self.alumnos.pop(alumno_id, None)


class FakeSesionRepo(_Singleton):
    def __init__(self, db=None):
        self.sesiones: dict[uuid.UUID, SesionJuego] = {}
        self._secuencia = 0

    async def crear(
        self,
        pin,
        grado_id,
        estado="lobby",
        tipo="oficial",
        colegio_id=None,
        alumno_a_id=None,
        alumno_b_id=None,
    ):
        self._secuencia += 1
        sesion = SesionJuego(
            id=uuid.uuid4(),
            pin=pin,
            grado_id=grado_id,
            tipo=tipo,
            colegio_id=colegio_id,
            alumno_a_id=alumno_a_id,
            alumno_b_id=alumno_b_id,
            estado=estado,
            creado_en=_ahora(),
        )
        self.sesiones[sesion.id] = sesion
        return sesion

    async def por_pin(self, pin):
        for s in self.sesiones.values():
            if s.pin == pin:
                return s
        return None

    async def por_id(self, sesion_id):
        return self.sesiones.get(sesion_id)

    async def listar(self):
        return list(self.sesiones.values())

    async def actualizar(self, sesion_id, **kwargs):
        sesion = self.sesiones.get(sesion_id)
        if not sesion:
            return None
        for k, v in kwargs.items():
            if k == "reset_pregunta" and v:
                sesion.pregunta_activa_id = None
            elif v is not None:
                setattr(sesion, k, v)
        sesion.actualizado_en = _ahora()
        return sesion


class FakeJugadorRepo(_Singleton):
    def __init__(self, db=None):
        self.jugadores: dict[uuid.UUID, Jugador] = {}
        self._secuencia = 0

    async def crear(self, sesion_id, nombre, colegio_id=None, alumno_id=None):
        self._secuencia += 1
        jugador = Jugador(
            id=uuid.uuid4(),
            sesion_id=sesion_id,
            nombre=nombre,
            colegio_id=colegio_id,
            alumno_id=alumno_id,
            conectado=True,
            creado_en=_ahora(),
        )
        self.jugadores[jugador.id] = jugador
        return jugador

    async def por_sesion_y_nombre(self, sesion_id, nombre):
        for j in self.jugadores.values():
            if j.sesion_id == sesion_id and j.nombre == nombre:
                return j
        return None

    async def por_sesion_y_alumno(self, sesion_id, alumno_id):
        for j in self.jugadores.values():
            if j.sesion_id == sesion_id and j.alumno_id == alumno_id:
                return j
        return None

    async def por_id(self, jugador_id):
        return self.jugadores.get(jugador_id)

    async def listar_por_sesion(self, sesion_id):
        return [j for j in self.jugadores.values() if j.sesion_id == sesion_id]

    async def actualizar(
        self, jugador_id, *, conectado=None, colegio_id=None, alumno_id=None
    ):
        jugador = self.jugadores.get(jugador_id)
        if not jugador:
            return None
        if conectado is not None:
            jugador.conectado = conectado
        if colegio_id is not None:
            jugador.colegio_id = colegio_id
        if alumno_id is not None:
            jugador.alumno_id = alumno_id
        jugador.ultima_conexion = _ahora()
        return jugador

    async def marcar_conectado(self, jugador_id, conectado):
        jid = jugador_id if isinstance(jugador_id, uuid.UUID) else uuid.UUID(jugador_id)
        await self.actualizar(jid, conectado=conectado)

    async def desconectar_todos(self, sesion_id):
        for j in self.jugadores.values():
            if j.sesion_id == sesion_id:
                j.conectado = False

    async def contar_conectados(self, sesion_id):
        return sum(
            1
            for j in self.jugadores.values()
            if j.sesion_id == sesion_id and j.conectado
        )


class FakePreguntaRepo(_Singleton):
    def __init__(self, db=None):
        self.preguntas: dict[uuid.UUID, Pregunta] = {}

    async def listar_por_grado(self, grado_id):
        return [p for p in self.preguntas.values() if p.grado_id == grado_id]

    async def por_id(self, pregunta_id):
        return self.preguntas.get(pregunta_id)


class FakeRespuestaRepo(_Singleton):
    def __init__(self, db=None):
        self.respuestas: dict[uuid.UUID, Respuesta] = {}
        self._secuencia = 0

    async def crear(
        self,
        pregunta_id,
        jugador_id,
        opcion,
        texto,
        correcta,
        enviado_en,
        numero_orden,
        puntos,
    ):
        self._secuencia += 1
        respuesta = Respuesta(
            id=uuid.uuid4(),
            pregunta_id=pregunta_id,
            jugador_id=jugador_id,
            opcion_seleccionada=opcion,
            texto_respuesta=texto,
            correcta=correcta,
            enviado_en=enviado_en,
            secuencia=self._secuencia,
            numero_orden=numero_orden,
            puntos=puntos,
            creado_en=_ahora(),
        )
        self.respuestas[respuesta.id] = respuesta
        return respuesta

    async def por_id_existente(self, pregunta_id, jugador_id):
        for r in self.respuestas.values():
            if r.pregunta_id == pregunta_id and r.jugador_id == jugador_id:
                return r
        return None

    async def existe(self, pregunta_id, jugador_id):
        return await self.por_id_existente(pregunta_id, jugador_id) is not None

    async def contar_por_pregunta_sesion(self, pregunta_id, sesion_id):
        return len(await self.listar_por_pregunta(pregunta_id, sesion_id))

    async def listar_por_pregunta(self, pregunta_id, sesion_id):
        from app.domain.entities import Jugador

        out = []
        for r in self.respuestas.values():
            if r.pregunta_id != pregunta_id:
                continue
            out.append(r)
        return out

    async def listar_por_sesion(self, sesion_id, pregunta_id=None):
        out = list(self.respuestas.values())
        if pregunta_id is not None:
            out = [r for r in out if r.pregunta_id == pregunta_id]
        return out

    async def contar_correctas_previas(
        self, pregunta_id, sesion_id, enviado_en, secuencia
    ):
        n = 0
        for r in self.respuestas.values():
            if r.pregunta_id != pregunta_id:
                continue
            if not r.correcta:
                continue
            if (r.enviado_en, r.secuencia or 0) < (enviado_en, secuencia):
                n += 1
        return n

    async def contar_anteriores(self, pregunta_id, sesion_id, enviado_en, secuencia):
        n = 0
        for r in self.respuestas.values():
            if r.pregunta_id != pregunta_id:
                continue
            if (r.enviado_en, r.secuencia or 0) < (enviado_en, secuencia):
                n += 1
        return n

    async def aprobar(self, respuesta_id, correcta):
        r = self.respuestas.get(respuesta_id)
        if r:
            r.correcta = correcta

    async def asignar_puntos(self, respuesta_id, puntos):
        r = self.respuestas.get(respuesta_id)
        if r:
            r.puntos = puntos


class FakeRetoRepo(_Singleton):
    def __init__(self, db=None):
        self.retos: dict[uuid.UUID, Reto] = {}

    async def listar_por_grado(self, grado_id):
        return [r for r in self.retos.values() if r.grado_id == grado_id]

    async def por_id(self, reto_id):
        return self.retos.get(reto_id)


class FakePuntajeRetoRepo(_Singleton):
    def __init__(self, db=None):
        self.puntajes: dict[uuid.UUID, PuntajeReto] = {}

    async def upsert(
        self, reto_id, jugador_id=None, colegio_id=None, puesto=0, puntos=0
    ):
        for p in list(self.puntajes.values()):
            if p.reto_id != reto_id:
                continue
            if jugador_id is not None and p.jugador_id == jugador_id:
                self.puntajes.pop(p.id, None)
            if colegio_id is not None and p.colegio_id == colegio_id:
                self.puntajes.pop(p.id, None)
        row = PuntajeReto(
            id=uuid.uuid4(),
            reto_id=reto_id,
            jugador_id=jugador_id,
            colegio_id=colegio_id,
            puesto=puesto,
            puntos=puntos,
            creado_en=_ahora(),
        )
        self.puntajes[row.id] = row

    async def listar_por_reto(self, reto_id):
        return sorted(
            [p for p in self.puntajes.values() if p.reto_id == reto_id],
            key=lambda p: p.puesto,
        )

    async def eliminar_por_participante(
        self, reto_id, jugador_id=None, colegio_id=None
    ):
        for p in list(self.puntajes.values()):
            if p.reto_id != reto_id:
                continue
            if jugador_id is not None and p.jugador_id == jugador_id:
                self.puntajes.pop(p.id, None)
            elif colegio_id is not None and p.colegio_id == colegio_id:
                self.puntajes.pop(p.id, None)


class FakeRepos:
    """Contenedor de fakes; expone los mismos nombres que el módulo de repos reales."""

    def __init__(self) -> None:
        for cls in (
            FakeGradoRepo,
            FakeSesionRepo,
            FakeJugadorRepo,
            FakePreguntaRepo,
            FakeRespuestaRepo,
            FakeColegioRepo,
            FakeAlumnoRepo,
            FakeRetoRepo,
            FakePuntajeRetoRepo,
        ):
            cls._reset()
        self.grado = FakeGradoRepo()
        self.sesion = FakeSesionRepo()
        self.jugador = FakeJugadorRepo()
        self.pregunta = FakePreguntaRepo()
        self.respuesta = FakeRespuestaRepo()
        self.colegio = FakeColegioRepo()
        self.alumno = FakeAlumnoRepo()
        self.reto = FakeRetoRepo()
        self.puntaje_reto = FakePuntajeRetoRepo()

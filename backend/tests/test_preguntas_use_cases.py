"""Tests del CRUD de preguntas y su imagen (banco del docente)."""

from __future__ import annotations

import pytest

from app.application.dto import ActualizarPreguntaRequest, CrearPreguntaRequest
from app.core.exceptions import DatosInvalidos


@pytest.fixture
def uc_preguntas(monkeypatch, repos):
    import app.application.preguntas.use_cases as uc
    from app.application.preguntas.use_cases import PreguntasUseCases
    from tests.fakes import FakeDb

    def _factory(fake):
        return lambda db=None: fake

    monkeypatch.setattr(uc, "PreguntaRepo", _factory(repos.pregunta))
    monkeypatch.setattr(uc, "GradoRepo", _factory(repos.grado))
    return PreguntasUseCases(FakeDb())


class TestCrear:
    async def test_asigna_orden_y_puntos_del_grado(
        self, uc_preguntas, repos, grado_individual
    ):
        grado_individual.puntos_sesion1 = {"1": 20, "2": 10}
        repos.grado.grados[grado_individual.id] = grado_individual

        out = await uc_preguntas.crear(
            CrearPreguntaRequest(
                grado_id=grado_individual.id,
                sesion="1",
                enunciado="¿Cuánto es 2+2?",
                opciones=["A) 3", "B) 4", "C) 5", "D) 6"],
                respuesta_correcta="B",
            )
        )

        assert out["orden"] == 1
        assert out["puntos_por_puesto"] == {"1": 20, "2": 10}
        assert out["activa"] is True
        assert out["respuesta_correcta"] == "B"

    async def test_usa_puntos_por_puesto_explicitos(
        self, uc_preguntas, repos, grado_individual
    ):
        repos.grado.grados[grado_individual.id] = grado_individual
        out = await uc_preguntas.crear(
            CrearPreguntaRequest(
                grado_id=grado_individual.id,
                enunciado="x",
                puntos_por_puesto={"1": 50, "2": 30},
            )
        )
        assert out["puntos_por_puesto"] == {"1": 50, "2": 30}

    async def test_incrementa_el_orden(self, uc_preguntas, repos, grado_individual):
        repos.grado.grados[grado_individual.id] = grado_individual
        for esperado in (1, 2, 3):
            out = await uc_preguntas.crear(
                CrearPreguntaRequest(grado_id=grado_individual.id, enunciado="x")
            )
            assert out["orden"] == esperado

    async def test_grado_inexistente(self, uc_preguntas):
        import uuid

        with pytest.raises(DatosInvalidos):
            await uc_preguntas.crear(
                CrearPreguntaRequest(grado_id=uuid.uuid4(), enunciado="x")
            )


class TestActualizar:
    async def test_cambia_solo_los_campos_enviados(
        self, uc_preguntas, repos, pregunta_opciones
    ):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

        out = await uc_preguntas.actualizar(
            str(pregunta_opciones.id),
            ActualizarPreguntaRequest(enunciado="Nuevo enunciado", tiempo_limite=45),
        )

        assert out["enunciado"] == "Nuevo enunciado"
        assert out["tiempo_limite"] == 45
        assert out["opciones"] == pregunta_opciones.opciones
        assert out["respuesta_correcta"] == pregunta_opciones.respuesta_correcta

    async def test_id_invalido(self, uc_preguntas):
        with pytest.raises(DatosInvalidos):
            await uc_preguntas.actualizar("no-es-uuid", ActualizarPreguntaRequest())


class TestEliminar:
    async def test_es_borrado_logico(self, uc_preguntas, repos, pregunta_opciones):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

        out = await uc_preguntas.eliminar(str(pregunta_opciones.id))

        assert out["activa"] is False
        activas = await repos.pregunta.listar_por_grado(pregunta_opciones.grado_id)
        assert activas == []
        todas = await repos.pregunta.listar_por_grado(
            pregunta_opciones.grado_id, solo_activas=False
        )
        assert len(todas) == 1


class TestMover:
    async def test_intercambia_con_el_vecino(
        self, uc_preguntas, repos, grado_individual
    ):
        a = await repos.pregunta.crear(
            {
                "grado_id": grado_individual.id,
                "sesion": "1",
                "tipo": "opcion-multiple",
                "enunciado": "A",
                "opciones": None,
                "respuesta_correcta": None,
                "tiempo_limite": 30,
                "puntos_por_puesto": {},
                "orden": 1,
                "activa": True,
            }
        )
        b = await repos.pregunta.crear(
            {
                "grado_id": grado_individual.id,
                "sesion": "1",
                "tipo": "opcion-multiple",
                "enunciado": "B",
                "opciones": None,
                "respuesta_correcta": None,
                "tiempo_limite": 30,
                "puntos_por_puesto": {},
                "orden": 2,
                "activa": True,
            }
        )

        out = await uc_preguntas.mover(str(a.id), 1)

        assert out["orden"] == 2
        assert repos.pregunta.preguntas[b.id].orden == 1

    async def test_en_el_extremo_no_cambia(
        self, uc_preguntas, repos, pregunta_opciones
    ):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        out = await uc_preguntas.mover(str(pregunta_opciones.id), -1)
        assert out["orden"] == pregunta_opciones.orden


class TestImagen:
    async def test_guardar_marca_y_guarda(self, uc_preguntas, repos, pregunta_opciones):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones

        out = await uc_preguntas.guardar_imagen(
            str(pregunta_opciones.id), "image/png", b"\x89PNG", 10, 10
        )

        assert out["imagen_actualizado_en"] is not None
        assert await uc_preguntas.obtener_imagen(str(pregunta_opciones.id)) == (
            b"\x89PNG",
            "image/png",
        )

    async def test_rechaza_mime_no_permitido(
        self, uc_preguntas, repos, pregunta_opciones
    ):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        with pytest.raises(DatosInvalidos):
            await uc_preguntas.guardar_imagen(
                str(pregunta_opciones.id), "text/plain", b"x", None, None
            )

    async def test_rechaza_imagen_demasiado_grande(
        self, uc_preguntas, repos, pregunta_opciones
    ):
        from app.application.preguntas.use_cases import MAX_IMAGEN_BYTES

        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        with pytest.raises(DatosInvalidos):
            await uc_preguntas.guardar_imagen(
                str(pregunta_opciones.id),
                "image/jpeg",
                b"x" * (MAX_IMAGEN_BYTES + 1),
                None,
                None,
            )

    async def test_eliminar_limpia_la_marca(
        self, uc_preguntas, repos, pregunta_opciones
    ):
        repos.pregunta.preguntas[pregunta_opciones.id] = pregunta_opciones
        await uc_preguntas.guardar_imagen(
            str(pregunta_opciones.id), "image/webp", b"abc", 5, 5
        )

        out = await uc_preguntas.eliminar_imagen(str(pregunta_opciones.id))

        assert out["imagen_actualizado_en"] is None
        assert await uc_preguntas.obtener_imagen(str(pregunta_opciones.id)) is None

"""Tests de lógica pura de negocio (domain/rules.py)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.domain.rules import (
    MAX_DESVIACION_RELOJ_SEG,
    calcular_puntos,
    corregir_reloj,
    es_correcta_opcion,
    es_grado_grupal,
    ordenar_por_envio,
)


class TestCorregirReloj:
    def test_devuelve_enviado_en_si_esta_dentro_del_rango(self):
        ahora = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
        enviado = ahora - timedelta(seconds=30)
        assert corregir_reloj(enviado, ahora) == enviado

    def test_corrige_a_ahora_si_el_reloj_se_desvia_mas_de_60s(self):
        ahora = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
        enviado = ahora - timedelta(seconds=MAX_DESVIACION_RELOJ_SEG + 10)
        assert corregir_reloj(enviado, ahora) == ahora

    def test_corrige_hacia_adelante_si_el_cliente_va_adelantado(self):
        ahora = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
        enviado = ahora + timedelta(seconds=120)
        assert corregir_reloj(enviado, ahora) == ahora

    def test_trata_timezone_naive_como_utc(self):
        ahora = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
        enviado = datetime(2026, 9, 20, 11, 59, 30)
        assert corregir_reloj(enviado, ahora) == enviado.replace(tzinfo=timezone.utc)

    def test_none_usa_ahora(self):
        ahora = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
        assert corregir_reloj(None, ahora) == ahora


class TestCalcularPuntos:
    def test_primer_puesto(self):
        assert calcular_puntos({"1": 20, "2": 10}, 1) == 20

    def test_segundo_puesto(self):
        assert calcular_puntos({"1": 20, "2": 10, "3": 5}, 2) == 10

    def test_puesto_sin_mapeo_devuelve_cero(self):
        assert calcular_puntos({"1": 20}, 9) == 0

    def test_mapeo_vacio_devuelve_cero(self):
        assert calcular_puntos({}, 1) == 0

    def test_mapeo_con_claves_str(self):
        assert calcular_puntos({"1": 20, "2": 10}, 2) == 10


class TestEsCorrectaOpcion:
    def test_igual_ignora_mayusculas_y_espacios(self):
        assert es_correcta_opcion(" 4 ", "4")

    def test_case_insensitive(self):
        assert es_correcta_opcion("A", "a")

    def test_incorrecta(self):
        assert not es_correcta_opcion("3", "4")

    def test_none_es_incorrecta(self):
        assert not es_correcta_opcion(None, "4")
        assert not es_correcta_opcion("4", None)


class TestEsGradoGrupal:
    def test_grados_4_y_5_son_grupales(self):
        assert es_grado_grupal(4)
        assert es_grado_grupal(5)

    def test_grados_1_3_no_son_grupales(self):
        assert not es_grado_grupal(1)
        assert not es_grado_grupal(3)


class TestOrdenarPorEnvio:
    def test_ordena_por_envio_y_secuencia(self):
        t1 = datetime(2026, 9, 20, 12, 0, 0, tzinfo=timezone.utc)
        t2 = t1 + timedelta(seconds=1)
        respuestas = [(t2, 2), (t1, 5), (t1, 1)]
        assert ordenar_por_envio(respuestas) == [(t1, 1), (t1, 5), (t2, 2)]

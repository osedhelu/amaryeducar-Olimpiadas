-- Reset de datos de juego (pruebas/sesiones), preservando contenido y catálogos.
--
-- Borra: respuestas, puntajes_retos, sesiones_juego (y en cascada sus jugadores).
-- Conserva: grados, preguntas, retos, parametros, colegios, alumnos.
--
-- Re-ejecutable. Aplicar a mano contra la BD:
--   source .env.local; psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/07-reset-datos-prueba.sql

BEGIN;

-- 1. Respuestas (FK a jugadores sin cascada → borrar primero).
DELETE FROM respuestas;

-- 2. Puntajes de retos.
DELETE FROM puntajes_retos;

-- 3. Sesiones (arrastra jugadores por ON DELETE CASCADE).
DELETE FROM sesiones_juego;

-- 4. Reiniciar el contador de secuencia de respuestas.
ALTER SEQUENCE IF EXISTS respuestas_secuencia_seq RESTART WITH 1;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────
-- OPCIONAL: borrar también el roster registrado (colegios + alumnos).
-- Descomenta si quieres empezar de cero y registrar todo de nuevo.
--
-- BEGIN;
-- DELETE FROM sesiones_juego;   -- por si acaso hay sesiones que apunten a alumnos
-- DELETE FROM alumnos;
-- DELETE FROM colegios;
-- COMMIT;
-- ─────────────────────────────────────────────────────────────────────────

BEGIN;

-- Tabla maestra de alumnos: registrados por el docente, vinculados a colegio y grado.
-- El alumno YA NO escribe su nombre al entrar; elige su nombre de esta lista.
CREATE TABLE IF NOT EXISTS alumnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colegio_id UUID NOT NULL REFERENCES colegios(id) ON DELETE CASCADE,
    grado_id UUID NOT NULL REFERENCES grados(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE (colegio_id, grado_id, nombre)
);

-- Jugador pasa a estar vinculado al alumno registrado (opcional por compatibilidad).
ALTER TABLE jugadores
    ADD COLUMN IF NOT EXISTS alumno_id UUID REFERENCES alumnos(id) ON DELETE SET NULL;

-- Índice único parcial: un alumno solo puede jugar una vez por sesión.
DROP INDEX IF EXISTS idx_jugadores_sesion_alumno;
CREATE UNIQUE INDEX idx_jugadores_sesion_alumno
    ON jugadores(sesion_id, alumno_id)
    WHERE alumno_id IS NOT NULL;

-- Sesiones: tipo oficial/prueba y colegio restringido (duelos mismos-colegio).
ALTER TABLE sesiones_juego
    ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'oficial';

ALTER TABLE sesiones_juego
    ADD COLUMN IF NOT EXISTS colegio_id UUID REFERENCES colegios(id);

-- Duelo 1v1: los dos alumnos que se enfrentan (tipo='prueba').
ALTER TABLE sesiones_juego
    ADD COLUMN IF NOT EXISTS alumno_a_id UUID REFERENCES alumnos(id);

ALTER TABLE sesiones_juego
    ADD COLUMN IF NOT EXISTS alumno_b_id UUID REFERENCES alumnos(id);

CREATE INDEX IF NOT EXISTS idx_alumnos_colegio ON alumnos(colegio_id);
CREATE INDEX IF NOT EXISTS idx_alumnos_grado ON alumnos(grado_id);

COMMIT;
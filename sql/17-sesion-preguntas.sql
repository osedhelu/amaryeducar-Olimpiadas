-- Preguntas asignadas por sesión (modo quiz: 10 aleatorias por sala).
-- Re-ejecutable.

BEGIN;

CREATE TABLE IF NOT EXISTS sesion_preguntas (
    sesion_id UUID NOT NULL REFERENCES sesiones_juego(id) ON DELETE CASCADE,
    pregunta_id UUID NOT NULL REFERENCES preguntas(id) ON DELETE CASCADE,
    orden INT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (sesion_id, pregunta_id)
);

CREATE INDEX IF NOT EXISTS idx_sesion_preguntas_sesion
    ON sesion_preguntas(sesion_id);

COMMIT;

-- Rondas del modo quiz: guarda qué ronda se está mostrando como ganadora
-- en la pantalla grande (NULL = flujo normal de pregunta).
-- Re-ejecutable.

BEGIN;

ALTER TABLE sesiones_juego
    ADD COLUMN IF NOT EXISTS ronda_ganador_num INT;

COMMIT;

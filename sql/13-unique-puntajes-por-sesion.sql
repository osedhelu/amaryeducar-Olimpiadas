BEGIN;

-- Las constraints únicas de puntajes_retos no incluían sesion_id:
--   UNIQUE (reto_id, colegio_id)
--   UNIQUE (reto_id, jugador_id)
-- Con datos de una sesión previa del mismo grado, asignar el mismo
-- participante en una sesión nueva fallaba con UniqueViolation (500).
-- La unicidad correcta es por sesión: un participante solo puede tener
-- un puesto por reto DENTRO de una sesión.

ALTER TABLE puntajes_retos
    DROP CONSTRAINT IF EXISTS puntajes_retos_reto_id_jugador_id_key;

ALTER TABLE puntajes_retos
    DROP CONSTRAINT IF EXISTS puntajes_retos_reto_id_colegio_id_key;

-- Datos válidos bajo la constraint vieja (más estricta) siempre cumplen
-- la nueva (más laxa): no puede haber duplicados al crear los índices.
CREATE UNIQUE INDEX IF NOT EXISTS puntajes_retos_reto_sesion_jugador_key
    ON puntajes_retos (reto_id, sesion_id, jugador_id);

CREATE UNIQUE INDEX IF NOT EXISTS puntajes_retos_reto_sesion_colegio_key
    ON puntajes_retos (reto_id, sesion_id, colegio_id);

COMMIT;

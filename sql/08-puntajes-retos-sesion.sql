BEGIN;

-- Los puntos de retos lúdicos ahora quedan atados a la sesión donde se jugó.
-- Antes no guardaban sesion_id: el podium/la tabla sumaban retos de TODAS las
-- sesiones del grado, mezclándolas.
ALTER TABLE puntajes_retos
    ADD COLUMN IF NOT EXISTS sesion_id UUID REFERENCES sesiones_juego(id) ON DELETE CASCADE;

-- Limpiar puntajes huérfanos (sin sesión) de pruebas previas.
DELETE FROM puntajes_retos WHERE sesion_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_puntajes_retos_sesion ON puntajes_retos(sesion_id);

COMMIT;
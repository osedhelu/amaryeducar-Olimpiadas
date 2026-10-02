-- Sistema de vidas por sesión — Olimpiadas de Inglés 2026.
-- Re-ejecutable.
--
-- Una vida se pierde SOLO con respuestas INCORRECTAS de preguntas de opción
-- múltiple. Las preguntas abiertas nunca quitan vida. No responder tampoco.
--
-- El estado se DERIVA de `respuestas` (no se persiste un contador), así que
-- relanzar una pregunta (que borra sus respuestas) devuelve la vida sola.

BEGIN;

-- Parámetros globales (editables desde /admin/parametros).
INSERT INTO parametros (clave, valor) VALUES
    ('vidas_habilitadas', 'true'),
    ('vidas_por_sesion', '3')
ON CONFLICT (clave) DO NOTHING;

-- El conteo de vidas filtra respuestas por jugador.
CREATE INDEX IF NOT EXISTS idx_respuestas_jugador ON respuestas(jugador_id);

-- Estados de vidas de todos los jugadores de una sesión (única fuente de verdad).
CREATE OR REPLACE FUNCTION obtener_estado_jugadores(p_sesion_id UUID)
RETURNS TABLE (
    jugador_id UUID,
    nombre TEXT,
    colegio_id UUID,
    conectado BOOLEAN,
    aciertos BIGINT,
    errores BIGINT,
    vidas_restantes INT,
    vidas_max INT,
    eliminado BOOLEAN
) AS $$
DECLARE
    v_habilitadas BOOLEAN;
    v_max INT;
BEGIN
    v_habilitadas := COALESCE(
        (SELECT lower(valor) IN ('true','1','si','sí')
         FROM parametros WHERE clave = 'vidas_habilitadas'),
        true
    );

    v_max := COALESCE(
        NULLIF(
            regexp_replace(
                (SELECT valor FROM parametros WHERE clave = 'vidas_por_sesion'),
                '\D', '', 'g'
            ), ''
        )::int,
        3
    );
    v_max := GREATEST(1, v_max);

    RETURN QUERY
    SELECT
        j.id,
        j.nombre::text,
        j.colegio_id,
        j.conectado,
        COALESCE(c.aciertos, 0),
        COALESCE(e.errores, 0),
        CASE WHEN v_habilitadas THEN GREATEST(v_max - COALESCE(e.errores, 0)::int, 0) ELSE v_max END,
        v_max,
        (v_habilitadas AND COALESCE(e.errores, 0) >= v_max)
    FROM jugadores j
    LEFT JOIN (
        SELECT r.jugador_id, COUNT(*) AS aciertos
        FROM respuestas r
        WHERE r.correcta = true
        GROUP BY r.jugador_id
    ) c ON c.jugador_id = j.id
    LEFT JOIN (
        SELECT r.jugador_id, COUNT(DISTINCT r.pregunta_id) AS errores
        FROM respuestas r
        JOIN preguntas p ON p.id = r.pregunta_id
        WHERE p.tipo = 'opcion-multiple' AND r.correcta = false
        GROUP BY r.jugador_id
    ) e ON e.jugador_id = j.id
    WHERE j.sesion_id = p_sesion_id
    ORDER BY j.creado_en ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION obtener_estado_jugadores(UUID) TO anon, estudiante, docente;

-- Auto-cierre: solo esperan las respuestas de los jugadores CONECTADOS que
-- aún tienen vidas. Un eliminado no bloquea el cierre (ni siquiera si no
-- respondió). Si todos los conectados están eliminados, la pregunta cierra.
CREATE OR REPLACE FUNCTION auto_cerrar_cuando_todos_respondan() RETURNS TRIGGER AS $$
DECLARE
    v_sesion_id UUID;
    v_pregunta_id UUID;
    v_total_conectados INT;
    v_pendientes INT;
BEGIN
    SELECT sesion_id INTO v_sesion_id
    FROM jugadores WHERE id = NEW.jugador_id;

    IF v_sesion_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT pregunta_activa_id INTO v_pregunta_id
    FROM sesiones_juego
    WHERE id = v_sesion_id AND estado = 'pregunta';

    IF v_pregunta_id IS NULL OR v_pregunta_id <> NEW.pregunta_id THEN
        RETURN NEW;
    END IF;

    SELECT count(*) INTO v_total_conectados
    FROM obtener_estado_jugadores(v_sesion_id) WHERE conectado;

    IF v_total_conectados <= 0 THEN
        RETURN NEW;
    END IF;

    SELECT count(*) INTO v_pendientes
    FROM obtener_estado_jugadores(v_sesion_id) e
    WHERE e.conectado
      AND NOT e.eliminado
      AND NOT EXISTS (
          SELECT 1 FROM respuestas r
          WHERE r.pregunta_id = NEW.pregunta_id AND r.jugador_id = e.jugador_id
      );

    IF v_pendientes = 0 THEN
        UPDATE sesiones_juego SET estado = 'resultado'
        WHERE id = v_sesion_id AND estado = 'pregunta';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Conservar el trigger existente apuntando a la nueva función.
DROP TRIGGER IF EXISTS trg_auto_cerrar ON respuestas;
CREATE TRIGGER trg_auto_cerrar
    AFTER INSERT ON respuestas
    FOR EACH ROW
    EXECUTE FUNCTION auto_cerrar_cuando_todos_respondan();

COMMIT;
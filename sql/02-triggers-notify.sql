BEGIN;

CREATE OR REPLACE FUNCTION calcular_puntos_respuesta() RETURNS TRIGGER AS $$
DECLARE
    v_pregunta RECORD;
    v_sesion_id UUID;
    v_orden_correcto INT;
    v_puntos JSONB;
BEGIN
    SELECT * INTO v_pregunta FROM preguntas WHERE id = NEW.pregunta_id;
    SELECT sesion_id INTO v_sesion_id FROM jugadores WHERE id = NEW.jugador_id;

    IF v_sesion_id IS NULL THEN
        NEW.correcta := COALESCE(NEW.correcta, false);
        NEW.puntos := 0;
        RETURN NEW;
    END IF;

    -- Validación anti-reloj: si el timestamp del cliente se desvía más de 60s
    -- del reloj del servidor, se corrige a now() (evita manipular el orden)
    IF NEW.enviado_en IS NOT NULL
       AND ABS(EXTRACT(EPOCH FROM (now() - NEW.enviado_en))) > 60 THEN
        NEW.enviado_en := now();
    END IF;

    IF v_pregunta.tipo = 'opcion-multiple' THEN
        NEW.correcta := (upper(NEW.opcion_seleccionada) = upper(v_pregunta.respuesta_correcta));
    END IF;

    IF NEW.correcta = true THEN
        SELECT COUNT(*) + 1 INTO v_orden_correcto
        FROM respuestas r
        JOIN jugadores j ON r.jugador_id = j.id
        WHERE r.pregunta_id = NEW.pregunta_id
          AND j.sesion_id = v_sesion_id
          AND r.correcta = true
          AND (r.enviado_en, r.secuencia) < (NEW.enviado_en, NEW.secuencia);

        v_puntos := v_pregunta.puntos_por_puesto;
        NEW.puntos := COALESCE((v_puntos->>v_orden_correcto::text)::int, 0);
    ELSE
        NEW.puntos := 0;
    END IF;

    SELECT COUNT(*) + 1 INTO NEW.numero_orden
    FROM respuestas r
    JOIN jugadores j ON r.jugador_id = j.id
    WHERE r.pregunta_id = NEW.pregunta_id
      AND j.sesion_id = v_sesion_id
      AND (r.enviado_en, r.secuencia) < (NEW.enviado_en, NEW.secuencia);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_cerrar_cuando_todos_respondan() RETURNS TRIGGER AS $$
DECLARE
    v_sesion_id UUID;
    v_pregunta_id UUID;
    v_total_conectados INT;
    v_total_respuestas INT;
BEGIN
    SELECT sesion_id INTO v_sesion_id
    FROM jugadores WHERE id = NEW.jugador_id;

    IF v_sesion_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT pregunta_activa_id INTO v_pregunta_id
    FROM sesiones_juego
    WHERE id = v_sesion_id AND estado = 'pregunta';

    -- Solo actúa si la respuesta es de la pregunta activa y la sesión sigue abierta
    IF v_pregunta_id IS NULL OR v_pregunta_id <> NEW.pregunta_id THEN
        RETURN NEW;
    END IF;

    -- Solo cuenta los jugadores CONECTADOS en la sesión
    SELECT count(*) INTO v_total_conectados
    FROM jugadores WHERE sesion_id = v_sesion_id AND conectado = true;

    SELECT count(*) INTO v_total_respuestas
    FROM respuestas r
    WHERE r.pregunta_id = NEW.pregunta_id
      AND r.jugador_id IN (
          SELECT id FROM jugadores WHERE sesion_id = v_sesion_id AND conectado = true
      );

    IF v_total_respuestas >= v_total_conectados AND v_total_conectados > 0 THEN
        UPDATE sesiones_juego SET estado = 'resultado'
        WHERE id = v_sesion_id AND estado = 'pregunta';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_calcular_puntos ON respuestas;
CREATE TRIGGER trg_calcular_puntos
    BEFORE INSERT ON respuestas
    FOR EACH ROW
    EXECUTE FUNCTION calcular_puntos_respuesta();

DROP TRIGGER IF EXISTS trg_auto_cerrar ON respuestas;
CREATE TRIGGER trg_auto_cerrar
    AFTER INSERT ON respuestas
    FOR EACH ROW
    EXECUTE FUNCTION auto_cerrar_cuando_todos_respondan();

CREATE OR REPLACE FUNCTION notify_cambio() RETURNS TRIGGER AS $$
DECLARE
    v_payload JSONB;
    v_data JSONB;
BEGIN
    v_data := CASE
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        ELSE to_jsonb(NEW)
    END;

    v_payload := jsonb_build_object(
        'tipo', TG_OP,
        'tabla', TG_TABLE_NAME,
        'data', v_data,
        'ts', now()
    );

    PERFORM pg_notify('canal_juego', v_payload::text);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_jugadores ON jugadores;
CREATE TRIGGER trg_notify_jugadores AFTER INSERT OR UPDATE OR DELETE ON jugadores
    FOR EACH ROW EXECUTE FUNCTION notify_cambio();

DROP TRIGGER IF EXISTS trg_notify_respuestas ON respuestas;
CREATE TRIGGER trg_notify_respuestas AFTER INSERT OR UPDATE OR DELETE ON respuestas
    FOR EACH ROW EXECUTE FUNCTION notify_cambio();

DROP TRIGGER IF EXISTS trg_notify_sesiones ON sesiones_juego;
CREATE TRIGGER trg_notify_sesiones AFTER UPDATE ON sesiones_juego
    FOR EACH ROW EXECUTE FUNCTION notify_cambio();

DROP TRIGGER IF EXISTS trg_notify_preguntas ON preguntas;
CREATE TRIGGER trg_notify_preguntas AFTER UPDATE ON preguntas
    FOR EACH ROW EXECUTE FUNCTION notify_cambio();

DROP TRIGGER IF EXISTS trg_notify_retos ON retos;
CREATE TRIGGER trg_notify_retos AFTER INSERT OR UPDATE OR DELETE ON retos
    FOR EACH ROW EXECUTE FUNCTION notify_cambio();

DROP TRIGGER IF EXISTS trg_notify_puntajes_retos ON puntajes_retos;
CREATE TRIGGER trg_notify_puntajes_retos AFTER INSERT OR UPDATE OR DELETE ON puntajes_retos
    FOR EACH ROW EXECUTE FUNCTION notify_cambio();

CREATE OR REPLACE FUNCTION actualizar_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ts_grados ON grados;
CREATE TRIGGER trg_ts_grados BEFORE UPDATE ON grados
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_ts_sesiones ON sesiones_juego;
CREATE TRIGGER trg_ts_sesiones BEFORE UPDATE ON sesiones_juego
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

DROP TRIGGER IF EXISTS trg_ts_preguntas ON preguntas;
CREATE TRIGGER trg_ts_preguntas BEFORE UPDATE ON preguntas
    FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

COMMIT;

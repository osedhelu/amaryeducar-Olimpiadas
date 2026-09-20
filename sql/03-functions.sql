CREATE OR REPLACE FUNCTION obtener_podium(p_sesion_id UUID)
RETURNS TABLE (puesto BIGINT, nombre TEXT, puntos_total BIGINT, es_colegio BOOLEAN, entity_id UUID) AS $$
DECLARE
    v_grado_id UUID;
    v_orden_grado INT;
BEGIN
    SELECT grado_id INTO v_grado_id FROM sesiones_juego WHERE id = p_sesion_id;
    SELECT orden INTO v_orden_grado FROM grados WHERE id = v_grado_id;

    IF v_orden_grado >= 4 THEN
        RETURN QUERY
        SELECT
            ROW_NUMBER() OVER (ORDER BY COALESCE(sum(puntos),0) DESC, MAX(sub.nombre))::bigint,
            sub.nombre::text,
            COALESCE(sum(puntos),0),
            true,
            sub.c_id
        FROM (
            SELECT c.id AS c_id, c.nombre AS nombre, COALESCE(r.puntos,0) AS puntos
            FROM colegios c
            LEFT JOIN jugadores j ON j.colegio_id = c.id AND j.sesion_id = p_sesion_id
            LEFT JOIN respuestas r ON r.jugador_id = j.id AND r.correcta = true
            UNION ALL
            SELECT c.id AS c_id, c.nombre AS nombre, COALESCE(pr.puntos,0) AS puntos
            FROM colegios c
            LEFT JOIN puntajes_retos pr ON pr.colegio_id = c.id
            LEFT JOIN retos rt ON pr.reto_id = rt.id AND rt.grado_id = v_grado_id
        ) sub
        WHERE sub.c_id IN (
            SELECT DISTINCT c.id FROM colegios c
            JOIN jugadores j ON j.colegio_id = c.id WHERE j.sesion_id = p_sesion_id
        )
        GROUP BY sub.c_id, sub.nombre
        ORDER BY 3 DESC, sub.nombre ASC;
    ELSE
        RETURN QUERY
        SELECT
            ROW_NUMBER() OVER (ORDER BY COALESCE(sum(puntos),0) DESC, MAX(sub.nombre))::bigint,
            sub.nombre::text,
            COALESCE(sum(puntos),0),
            false,
            sub.j_id
        FROM (
            SELECT j.id AS j_id, j.nombre AS nombre, COALESCE(r.puntos,0) AS puntos
            FROM jugadores j
            LEFT JOIN respuestas r ON r.jugador_id = j.id AND r.correcta = true
            UNION ALL
            SELECT j.id AS j_id, j.nombre AS nombre, COALESCE(pr.puntos,0) AS puntos
            FROM jugadores j
            LEFT JOIN puntajes_retos pr ON pr.jugador_id = j.id
            LEFT JOIN retos rt ON pr.reto_id = rt.id AND rt.grado_id = v_grado_id
        ) sub
        WHERE sub.j_id IN (
            SELECT id FROM jugadores WHERE sesion_id = p_sesion_id
        )
        GROUP BY sub.j_id, sub.nombre
        ORDER BY 3 DESC, sub.nombre ASC;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_pin_unico() RETURNS TEXT AS $$
DECLARE
    v_pin TEXT;
BEGIN
    LOOP
        v_pin := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM sesiones_juego WHERE pin = v_pin);
    END LOOP;
    RETURN v_pin;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION aprobar_respuesta_abierta(
    p_respuesta_id UUID,
    p_correcta BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_pregunta_id UUID;
    v_jugador_id UUID;
    v_puntos JSONB;
    v_orden_correcto INT;
    v_grado_id UUID;
BEGIN
    UPDATE respuestas
    SET correcta = p_correcta
    WHERE id = p_respuesta_id
    RETURNING pregunta_id, jugador_id INTO v_pregunta_id, v_jugador_id;

    IF p_correcta THEN
        SELECT COUNT(*) + 1 INTO v_orden_correcto
        FROM respuestas
        WHERE pregunta_id = v_pregunta_id
          AND correcta = true
          AND (enviado_en < (SELECT enviado_en FROM respuestas WHERE id = p_respuesta_id)
               OR id < p_respuesta_id);

        SELECT p.grado_id INTO v_grado_id FROM preguntas p WHERE id = v_pregunta_id;

        SELECT CASE WHEN g.orden <= 3 THEN g.puntos_sesion1 ELSE g.puntos_sesion2 END
        INTO v_puntos
        FROM preguntas p JOIN grados g ON p.grado_id = g.id
        WHERE p.id = v_pregunta_id;

        UPDATE respuestas
        SET puntos = COALESCE((v_puntos->>v_orden_correcto::text)::int, 0)
        WHERE id = p_respuesta_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION asignar_puesto_reto(
    p_reto_id UUID,
    p_jugador_id UUID,
    p_colegio_id UUID,
    p_puesto INT
) RETURNS VOID AS $$
DECLARE
    v_puntos JSONB;
    v_puntos_asignados INT;
BEGIN
    SELECT puntos_por_puesto INTO v_puntos FROM retos WHERE id = p_reto_id;
    v_puntos_asignados := COALESCE((v_puntos->>p_puesto::text)::int, 0);

    DELETE FROM puntajes_retos
    WHERE reto_id = p_reto_id
      AND (jugador_id IS NOT DISTINCT FROM p_jugador_id)
      AND (colegio_id IS NOT DISTINCT FROM p_colegio_id);

    INSERT INTO puntajes_retos (reto_id, jugador_id, colegio_id, puesto, puntos)
    VALUES (p_reto_id, p_jugador_id, p_colegio_id, p_puesto, v_puntos_asignados);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_respuestas_sesion(p_sesion_id UUID)
RETURNS TABLE (
  id UUID, pregunta_id UUID, jugador_id UUID, opcion_seleccionada TEXT,
  texto_respuesta TEXT, correcta BOOLEAN, enviado_en TIMESTAMPTZ,
  secuencia BIGINT, numero_orden INT, puntos INT, creado_en TIMESTAMPTZ,
  jugador_nombre TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.pregunta_id, r.jugador_id, r.opcion_seleccionada,
         r.texto_respuesta, r.correcta, r.enviado_en, r.secuencia,
         r.numero_orden, r.puntos, r.creado_en, j.nombre
  FROM respuestas r
  JOIN jugadores j ON r.jugador_id = j.id
  WHERE j.sesion_id = p_sesion_id
    AND r.pregunta_id = (SELECT pregunta_activa_id FROM sesiones_juego WHERE id = p_sesion_id)
  ORDER BY r.enviado_en ASC, r.secuencia ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION obtener_respuestas_sesion(UUID) TO anon, estudiante, docente;

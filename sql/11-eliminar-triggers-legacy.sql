-- El backend FastAPI replica toda la lógica de juego en Python
-- (puntos y auto-cierre). Los triggers legacy de Postgres cierran la sesión
-- en el INSERT sin publicar el evento WebSocket, dejando al frontend sin el
-- aviso de "resultado" (auto-cierre que "a veces falla"). Se eliminan para que
-- el backend sea la única fuente de verdad y publique siempre
-- sesion_cambio / resultado_pregunta.
BEGIN;

DROP TRIGGER IF EXISTS trg_calcular_puntos ON respuestas;
DROP TRIGGER IF EXISTS trg_auto_cerrar ON respuestas;

COMMIT;

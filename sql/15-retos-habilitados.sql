-- Interruptor de pruebas lúdicas (retos) — Olimpiadas de Inglés 2026.
-- Re-ejecutable: no pisa el valor elegido desde /admin/parametros.
-- El backend bloquea el estado "reto" y los endpoints de retos cuando es 'false';
-- el frontend oculta el panel de retos.

BEGIN;

INSERT INTO parametros (clave, valor) VALUES ('retos_habilitados', 'false')
ON CONFLICT (clave) DO NOTHING;

COMMIT;

-- Parámetros del modo quiz (competencia individual) — Olimpiadas de Inglés 2026.
-- Re-ejecutable: no pisa valores ya elegidos desde /admin/parametros.
-- modo_quiz=true → cada sala de 4º/5º recibe N preguntas al azar y el podium es por alumno.

BEGIN;

INSERT INTO parametros (clave, valor) VALUES
    ('modo_quiz', 'true'),
    ('preguntas_por_sesion', '10')
ON CONFLICT (clave) DO NOTHING;

COMMIT;

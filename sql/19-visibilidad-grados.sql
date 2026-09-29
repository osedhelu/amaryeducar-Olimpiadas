-- Visibilidad del panel del docente — Olimpiadas de Inglés 2026.
-- Re-ejecutable: no pisa valores ya elegidos desde /admin/parametros.
--   mostrar_duelos / mostrar_enfrentamiento: ocultan esas tarjetas y vistas.
--   grado_1..grado_5: qué grados aparecen para crear sesión.

BEGIN;

INSERT INTO parametros (clave, valor) VALUES
    ('mostrar_duelos', 'false'),
    ('mostrar_enfrentamiento', 'false'),
    ('grado_1', 'false'),
    ('grado_2', 'false'),
    ('grado_3', 'false'),
    ('grado_4', 'true'),
    ('grado_5', 'true')
ON CONFLICT (clave) DO NOTHING;

COMMIT;

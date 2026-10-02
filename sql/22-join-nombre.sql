-- Join libre por nombre (sin colegios/alumnos): actualiza el texto de ayuda.
-- Re-ejecutable.

BEGIN;

INSERT INTO parametros (clave, valor) VALUES
    ('texto_join_ayuda', 'Ingresa el PIN y escribe tu nombre'),
    ('mostrar_enfrentamiento', 'false'),
    ('mostrar_duelos', 'false')
ON CONFLICT (clave) DO UPDATE
    SET valor = EXCLUDED.valor, actualizado_en = now();

COMMIT;
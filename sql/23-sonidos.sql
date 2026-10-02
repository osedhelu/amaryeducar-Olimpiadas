-- Sonido de la olimpiada: parámetro global para activar/desactivar efectos.
-- Re-ejecutable.

BEGIN;

INSERT INTO parametros (clave, valor) VALUES ('sonido_habilitado', 'true')
ON CONFLICT (clave) DO UPDATE
    SET valor = EXCLUDED.valor, actualizado_en = now();

COMMIT;
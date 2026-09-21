BEGIN;

-- Imagen por pregunta (una sola). El binario vive en su propia tabla para no
-- engordar las consultas a `preguntas`; se sirve por la API
-- (GET /preguntas/{id}/imagen), no por PostgREST.
CREATE TABLE IF NOT EXISTS preguntas_imagenes (
    pregunta_id UUID PRIMARY KEY REFERENCES preguntas(id) ON DELETE CASCADE,
    mime TEXT NOT NULL,
    bytes BYTEA NOT NULL,
    ancho INT,
    alto INT,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marca "tiene imagen" + cache-buster. Nunca guarda el binario.
ALTER TABLE preguntas
    ADD COLUMN IF NOT EXISTS imagen_actualizado_en TIMESTAMPTZ;

-- La API conecta como dueño y ya puede todo; se concede a `docente` para el
-- path PostgREST legado y se niega la lectura de binarios a anon/estudiante.
GRANT ALL ON preguntas_imagenes TO docente;
REVOKE ALL ON preguntas_imagenes FROM anon;
REVOKE ALL ON preguntas_imagenes FROM estudiante;

COMMIT;

NOTIFY pgrst, 'reload schema';

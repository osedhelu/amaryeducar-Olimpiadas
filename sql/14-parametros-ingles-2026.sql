-- Parámetros del portal — Olimpiadas de Inglés 2026.
-- Re-ejecutable (UPSERT idempotente). Los consume el frontend vía
-- GET /parametros (público) y GET/PUT /parametros (admin, con clave).
-- Editable desde /admin/parametros sin re-desplegar.

BEGIN;

INSERT INTO parametros (clave, valor) VALUES
    ('nombre_institucion', 'Amar y Educar'),
    ('nombre_evento', 'Olimpiadas de Inglés 2026'),
    ('subtitulo_evento', 'Preguntas y respuestas en inglés'),
    ('texto_bienvenida', 'Nos alegra enormemente darles la bienvenida a esta jornada de conocimiento, idioma y superación.'),
    ('texto_unirse', 'Únete a la Olimpiada'),
    ('texto_join_ayuda', 'Ingresa el PIN y toca tu nombre en la lista'),
    ('texto_panel_docente', 'Panel del Docente'),
    ('texto_unirme_estudiante', 'Unirme como Estudiante'),
    ('texto_pin_label', 'PIN de la sesión'),
    ('texto_ronda_completada', '¡Ronda completada!')
ON CONFLICT (clave) DO UPDATE
    SET valor = EXCLUDED.valor, actualizado_en = now();

-- La clave admin no se sobrescribe si ya fue cambiada desde el panel.
INSERT INTO parametros (clave, valor) VALUES ('clave_admin', 'ADMadm1234')
ON CONFLICT (clave) DO NOTHING;

COMMIT;

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'auth_secret_2026';
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'estudiante') THEN
        CREATE ROLE estudiante NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'docente') THEN
        CREATE ROLE docente NOLOGIN NOINHERIT;
    END IF;
END $$;

GRANT anon TO authenticator;
GRANT estudiante TO authenticator;
GRANT docente TO authenticator;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON grados TO anon;
GRANT SELECT ON colegios TO anon;
GRANT SELECT ON sesiones_juego TO anon;
GRANT SELECT ON preguntas TO anon;
GRANT SELECT ON retos TO anon;
GRANT SELECT ON jugadores TO anon;
GRANT SELECT ON respuestas TO anon;
GRANT SELECT ON puntajes_retos TO anon;
GRANT EXECUTE ON FUNCTION obtener_podium(UUID) TO anon;

GRANT USAGE ON SCHEMA public TO estudiante;
GRANT SELECT ON grados TO estudiante;
GRANT SELECT ON colegios TO estudiante;
GRANT SELECT ON sesiones_juego TO estudiante;
GRANT SELECT ON preguntas TO estudiante;
GRANT SELECT ON retos TO estudiante;
GRANT SELECT ON jugadores TO estudiante;
GRANT SELECT ON respuestas TO estudiante;
GRANT SELECT ON puntajes_retos TO estudiante;
GRANT INSERT ON jugadores TO estudiante;
GRANT INSERT ON respuestas TO estudiante;
GRANT UPDATE ON jugadores TO estudiante;
GRANT EXECUTE ON FUNCTION obtener_podium(UUID) TO estudiante;

GRANT USAGE ON SCHEMA public TO docente;
GRANT ALL ON ALL TABLES IN SCHEMA public TO docente;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO docente;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO docente;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO estudiante;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO docente;

COMMIT;

GRANT USAGE, SELECT ON SEQUENCE respuestas_secuencia_seq TO anon, estudiante, docente;

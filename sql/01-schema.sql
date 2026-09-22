BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE estado_sesion AS ENUM (
    'borrador', 'lobby', 'pregunta', 'resultado',
    'reto', 'podium', 'final'
);

CREATE TYPE tipo_pregunta AS ENUM ('opcion-multiple', 'abierta');
CREATE TYPE sesion_numero AS ENUM ('1', '2');
CREATE TYPE tipo_reto AS ENUM ('individual', 'grupal');

CREATE TABLE grados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    orden INT NOT NULL UNIQUE,
    puntos_sesion1 JSONB NOT NULL DEFAULT '{"1": 20, "2": 10}'::jsonb,
    puntos_sesion2 JSONB NOT NULL DEFAULT '{"1": 30, "2": 20}'::jsonb,
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE colegios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE,
    creado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sesiones_juego (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin VARCHAR(4) UNIQUE NOT NULL,
    grado_id UUID NOT NULL REFERENCES grados(id),
    estado estado_sesion DEFAULT 'borrador',
    pregunta_activa_id UUID,
    reto_activo_id UUID,
    cronometro_inicio TIMESTAMPTZ,
    cronometro_segundos INT DEFAULT 30,
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE jugadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID NOT NULL REFERENCES sesiones_juego(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    colegio_id UUID REFERENCES colegios(id),
    conectado BOOLEAN DEFAULT false,
    ultima_conexion TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE (sesion_id, nombre)
);

CREATE TABLE preguntas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grado_id UUID NOT NULL REFERENCES grados(id),
    sesion sesion_numero NOT NULL DEFAULT '1',
    tipo tipo_pregunta NOT NULL DEFAULT 'opcion-multiple',
    enunciado TEXT NOT NULL,
    opciones JSONB,
    respuesta_correcta TEXT,
    tiempo_limite INT DEFAULT 30,
    puntos_por_puesto JSONB NOT NULL DEFAULT '{"1": 20, "2": 10}'::jsonb,
    orden INT NOT NULL,
    activa BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE (grado_id, sesion, orden)
);

CREATE TABLE respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pregunta_id UUID NOT NULL REFERENCES preguntas(id),
    jugador_id UUID NOT NULL REFERENCES jugadores(id),
    opcion_seleccionada TEXT,
    texto_respuesta TEXT,
    correcta BOOLEAN,
    enviado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    secuencia BIGSERIAL,
    numero_orden INT,
    puntos INT DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE (pregunta_id, jugador_id)
);

CREATE TABLE retos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grado_id UUID NOT NULL REFERENCES grados(id),
    nombre TEXT NOT NULL,
    instrucciones TEXT,
    tipo tipo_reto NOT NULL DEFAULT 'individual',
    puntos_por_puesto JSONB NOT NULL DEFAULT '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb,
    orden INT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE (grado_id, orden)
);

CREATE TABLE puntajes_retos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reto_id UUID NOT NULL REFERENCES retos(id) ON DELETE CASCADE,
    jugador_id UUID REFERENCES jugadores(id) ON DELETE CASCADE,
    colegio_id UUID REFERENCES colegios(id),
    puesto INT NOT NULL,
    puntos INT NOT NULL,
    creado_en TIMESTAMPTZ DEFAULT now()
);

-- La unicidad es por sesión (un participante = un puesto por reto por sesión).
-- Ver sql/13-unique-puntajes-por-sesion.sql: las constraints originales
-- UNIQUE (reto_id, jugador_id/colegio_id) rompían sesiones previas.

CREATE TABLE parametros (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    actualizado_en TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sesiones_juego
    ADD CONSTRAINT fk_pregunta_activa
    FOREIGN KEY (pregunta_activa_id) REFERENCES preguntas(id) ON DELETE SET NULL;

ALTER TABLE sesiones_juego
    ADD CONSTRAINT fk_reto_activo
    FOREIGN KEY (reto_activo_id) REFERENCES retos(id) ON DELETE SET NULL;

CREATE INDEX idx_jugadores_sesion ON jugadores(sesion_id);
CREATE INDEX idx_jugadores_nombre ON jugadores(nombre);
CREATE INDEX idx_preguntas_grado_sesion ON preguntas(grado_id, sesion, orden);
CREATE INDEX idx_respuestas_pregunta_jugador ON respuestas(pregunta_id, jugador_id);
CREATE INDEX idx_respuestas_envio ON respuestas(pregunta_id, enviado_en);
CREATE INDEX idx_respuestas_envio_sec ON respuestas(pregunta_id, enviado_en, secuencia);
CREATE INDEX idx_puntajes_retos_reto ON puntajes_retos(reto_id);
CREATE UNIQUE INDEX puntajes_retos_reto_sesion_jugador_key
    ON puntajes_retos (reto_id, sesion_id, jugador_id);
CREATE UNIQUE INDEX puntajes_retos_reto_sesion_colegio_key
    ON puntajes_retos (reto_id, sesion_id, colegio_id);
CREATE INDEX idx_sesiones_grado ON sesiones_juego(grado_id);
CREATE INDEX idx_sesiones_pin ON sesiones_juego(pin);

COMMIT;

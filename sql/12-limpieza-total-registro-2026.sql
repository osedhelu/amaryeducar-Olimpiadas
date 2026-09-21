-- Limpieza de participantes (conserva grados, preguntas y retos) y registro
-- de participantes 2026.
-- Re-ejecutable. El contenido de la olimpiada (preguntas/retos) se conserva;
-- se borran solo sesiones, jugadores, respuestas, puntajes y alumnos/colegios.
-- Omitido: registro de docentes (por pedido).

BEGIN;

-- 1) Limpieza (conserva grados, preguntas, retos, preguntas_imagenes)
TRUNCATE TABLE puntajes_retos, respuestas, jugadores, sesiones_juego,
    alumnos, colegios
    CASCADE;

-- 2) Parámetros del evento (necesarios para el login admin)
INSERT INTO parametros (clave, valor) VALUES
    ('clave_admin', 'ADMadm1234'),
    ('nombre_evento', 'Amar y Educar Olimpiadas Matemáticas 2026');

-- 3) Colegios
INSERT INTO colegios (nombre, codigo) VALUES
    ('Amar y Educar', 'AYE'),
    ('Institución Educativa Técnica San Pablo de Polonuevo', NULL),
    ('Institución Educativa Nuestra Señora del Rosario', NULL);

-- 4) Alumnos
INSERT INTO alumnos (colegio_id, grado_id, nombre)
SELECT c.id, g.id, a.nombre
FROM (VALUES
    -- Amar y Educar
    ('Amar y Educar', 'Primero', 'Briany Pérez'),
    ('Amar y Educar', 'Primero', 'Karoll Quintero'),
    ('Amar y Educar', 'Segundo', 'Sergio Borrero'),
    ('Amar y Educar', 'Segundo', 'Alejandro Curtidor'),
    ('Amar y Educar', 'Tercero', 'Thiago Rua'),
    ('Amar y Educar', 'Tercero', 'Albert Estupiñan'),
    ('Amar y Educar', 'Cuarto', 'Zharen Alvarado'),
    ('Amar y Educar', 'Cuarto', 'Murat Cárdenas'),
    ('Amar y Educar', 'Quinto', 'Diego Meneses'),
    ('Amar y Educar', 'Quinto', 'Eliab García'),
    -- Institución Educativa Técnica San Pablo de Polonuevo
    ('Institución Educativa Técnica San Pablo de Polonuevo', 'Cuarto', 'Dylan Pasión'),
    ('Institución Educativa Técnica San Pablo de Polonuevo', 'Cuarto', 'Andrew Cervantes'),
    ('Institución Educativa Técnica San Pablo de Polonuevo', 'Quinto', 'Bárbara Villalobos'),
    ('Institución Educativa Técnica San Pablo de Polonuevo', 'Quinto', 'Julian Redondo'),
    -- Institución Educativa Nuestra Señora del Rosario
    ('Institución Educativa Nuestra Señora del Rosario', 'Cuarto', 'Jhan Carbonell'),
    ('Institución Educativa Nuestra Señora del Rosario', 'Cuarto', 'Luis Mercado'),
    ('Institución Educativa Nuestra Señora del Rosario', 'Quinto', 'Luis Cantillo'),
    ('Institución Educativa Nuestra Señora del Rosario', 'Quinto', 'Gael Orozco')
) AS a(colegio, grado, nombre)
JOIN colegios c ON c.nombre = a.colegio
JOIN grados g ON g.nombre = a.grado;

COMMIT;
BEGIN;

INSERT INTO grados (nombre, orden, puntos_sesion1, puntos_sesion2) VALUES
('Primero',  1, '{"1": 20, "2": 10}'::jsonb, '{"1": 30, "2": 20}'::jsonb),
('Segundo',  2, '{"1": 20, "2": 10}'::jsonb, '{"1": 30, "2": 20}'::jsonb),
('Tercero',  3, '{"1": 20, "2": 10}'::jsonb, '{"1": 30, "2": 20}'::jsonb),
('Cuarto',   4, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb),
('Quinto',   5, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb);

INSERT INTO parametros (clave, valor) VALUES
('clave_admin', 'ADMadm1234'),
('nombre_evento', 'Amar y Educar Olimpiadas Matemáticas 2026');

INSERT INTO colegios (nombre, codigo) VALUES
('Colegio 1', 'C1'),
('Colegio 2', 'C2')
ON CONFLICT (codigo) DO NOTHING;

-- PREGUNTAS PRIMER GRADO
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    '¿Cuál es el resultado de sumar 48 + 25?',
    '["A) 73", "B) 68", "C) 63", "D) 713"]'::jsonb,
    'A', 30, '{"1": 20, "2": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Primero';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Un perro tiene 4 patas. ¿Cuántas patas hay en total si juntamos 3 perros?',
    '["A) 8 patas", "B) 12 patas", "C) 10 patas", "D) 6 patas"]'::jsonb,
    'B', 30, '{"1": 20, "2": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Primero';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Tienes 12 canicas y pierdes 5. Luego tu mamá te regala 2 más. ¿Cuántas canicas tienes ahora?',
    '["A) 14 canicas", "B) 10 canicas", "C) 9 canicas", "D) 7 canicas"]'::jsonb,
    'C', 30, '{"1": 20, "2": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Primero';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Pedro hace el siguiente recorrido: Desde el punto, avanza 3 cuadras hacia la derecha y dos cuadras hacia abajo. ¿Adónde llega Pedro?',
    '["A) Casa", "B) Colegio", "C) Parque", "D) Ningún lado"]'::jsonb,
    'D', 30, '{"1": 20, "2": 10}'::jsonb, 4
FROM grados g WHERE g.nombre = 'Primero';

-- RETOS PRIMER GRADO
INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Construye el número',
    'Se colocarán en la pared unos papeles que digan Unidad, decena y centena. A otro lado, unas tapas diferenciadas por color. La profesora mencionará un número de tres cifras en voz alta y las participantes deberán construir el número con las tapitas, ubicando la cantidad correspondiente en cada valor posicional. Gana la primera que construya el número correctamente.',
    'individual', '{"1": 30, "2": 20}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Primero';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Operaciones rápidas',
    'En la pared se colocarán varios números los cuales serán las respuestas de operaciones que deberán resolver los estudiantes. Los participantes están de espaldas a la pared, luego se les dice una operación de suma o resta (ejemplo: 2 + 2) y cuando tengan la respuesta se voltean y buscan la respuesta en la pared y la tocan. Gana quien toque más respuestas correctas (la primera que tenga 5 puntos).',
    'individual', '{"1": 30, "2": 20}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Primero';

-- PREGUNTAS SEGUNDO GRADO
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Carlos tiene más caramelos que Sofía, pero menos que Mateo. ¿Quién tiene la mayor cantidad de caramelos?',
    '["A) Todos la misma", "B) Mateo", "C) Carlos", "D) Sofía"]'::jsonb,
    'B', 30, '{"1": 20, "2": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Segundo';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Sofía tenía 50 canicas. Regala 15 canicas a su hermano y luego compra 10 canicas más. ¿Cuántas canicas tiene ahora?',
    '["A) 55 canicas", "B) 45 canicas", "C) 35 canicas", "D) 25 canicas"]'::jsonb,
    'A', 30, '{"1": 20, "2": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Segundo';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'En un edificio, el departamento de Mateo está arriba del de Luis pero abajo del de Carla. ¿Quién vive en el piso del medio?',
    '["A) Mateo", "B) Carla", "C) Luis", "D) Todos viven en el mismo piso"]'::jsonb,
    'A', 30, '{"1": 20, "2": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Segundo';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Si 1 caja contiene 3 paquetes de galletas, ¿cuántos paquetes de galletas hay en total en 4 cajas iguales?',
    '["A) 7 paquetes", "B) 16 paquetes", "C) 12 paquetes", "D) 10 paquetes"]'::jsonb,
    'C', 30, '{"1": 20, "2": 10}'::jsonb, 4
FROM grados g WHERE g.nombre = 'Segundo';

-- RETOS SEGUNDO GRADO
INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Memoria',
    'En el piso habrá unas cartulinas del 1 al 9 en completo desorden y boca abajo, los estudiantes deberán ir volteando las cartulinas para encontrar el orden de los números. Si fallan con el orden, todas las cartulinas se voltean. Quien determine el orden de los números en dos rondas es el ganador.',
    'individual', '{"1": 30, "2": 20}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Segundo';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'El camino correcto',
    'Los participantes van a tener un tablero de 3x3 casillas que van a estar llenas de tapas (a excepción de una casilla). 7 tapas serán del mismo color y una será diferente. Esa tapa diferente deberán moverla por el tablero de tal manera que llegue a una casilla determinada (especificada por la docente) en el menor tiempo posible. Las reglas: no puede haber dos tapas en una misma casilla, las tapas solo se pueden mover horizontal y verticalmente, y no pueden saltar sobre otras tapas. Quien lleve la tapa al destino en el menor tiempo posible es el ganador. Gana quien gane 2 de 3 rondas.',
    'individual', '{"1": 30, "2": 20}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Segundo';

-- PREGUNTAS TERCER GRADO
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Tienes 24 galletas y las repartes en partes iguales entre 4 amigos. ¿Cuántas galletas le tocan a cada amigo?',
    '["A) 4 galletas", "B) 6 galletas", "C) 8 galletas", "D) 5 galletas"]'::jsonb,
    'B', 30, '{"1": 20, "2": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Tercero';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Una película empieza a las 4:15 p.m. y dura exactamente 45 minutos. ¿A qué hora termina la película?',
    '["A) 5:00 p.m.", "B) 4:45 p.m.", "C) 5:15 p.m.", "D) 4:60 p.m."] '::jsonb,
    'A', 30, '{"1": 20, "2": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Tercero';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    '¿Qué número falta en la siguiente serie? 12, 16, 20, __, 28, 32',
    '["A) 22", "B) 24", "C) 25", "D) 26"]'::jsonb,
    'B', 30, '{"1": 20, "2": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Tercero';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'En una carrera de sacos, Tomás llegó antes que Lucas, pero después que Sofía. Andrés llegó antes que Sofía. ¿Quién ganó la carrera?',
    '["A) Tomás", "B) Lucas", "C) Sofía", "D) Andrés"]'::jsonb,
    'D', 30, '{"1": 20, "2": 10}'::jsonb, 4
FROM grados g WHERE g.nombre = 'Tercero';

-- RETOS TERCER GRADO
INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Tetris',
    'Los participantes competirán por quien arma el tetris primero. Este estará hecho con un anaquel de huevos y deberán ubicar las partes en los lugares correspondientes de tal manera que las partes encajen perfectamente. Gana el primero que rellene completamente los cuadros.',
    'individual', '{"1": 30, "2": 20}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Tercero';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Velocidad de figuras',
    'En una mesa se colocarán dibujos de figuras en ambos lados y un botón rojo en el centro. El docente dirá alguna secuencia de figuras (ejemplo: círculo y cuadrado) y los participantes deberán tocar en ese orden las figuras con la mayor velocidad y luego tocar el botón rojo del centro. Quien haga primero la secuencia y toque el botón, es el ganador de esa ronda. Gana los 30 puntos quien gane 5 de 9 rondas.',
    'individual', '{"1": 30, "2": 20}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Tercero';

-- PREGUNTAS CUARTO GRADO
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Carlos vive en un edificio. Si sube 4 pisos desde su apartamento, llega al piso que está justo en la mitad del edificio. Si el edificio tiene 15 pisos en total, ¿en qué piso vive Carlos?',
    '["A) Piso 4", "B) Piso 3", "C) Piso 5", "D) Piso 8"]'::jsonb,
    'B', 30, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Cuarto';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'En un juego, la estatura mínima para poder ingresar es de 150 cm. Marcela mide 1 metro con 28 centímetros. ¿Cuántos centímetros de estatura le faltan a Marcela para poder ingresar al juego?',
    '["A) 2 centímetros", "B) 18 centímetros", "C) 22 centímetros", "D) 200 centímetros"]'::jsonb,
    'C', 30, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Cuarto';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Una aerolínea realiza 8 viajes diarios de Barranquilla a Bogotá. Cada avión puede trasladar como máximo 176 pasajeros por viaje. ¿Cuál es la cantidad máxima de pasajeros que puede trasladar la aerolínea de Barranquilla a Bogotá en un solo día?',
    '["A) 1.506 pasajeros", "B) 1.408 pasajeros", "C) 1.050 pasajeros", "D) 1.448 pasajeros"]'::jsonb,
    'B', 30, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Cuarto';

-- RETOS CUARTO GRADO
INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Tablero exprés',
    'Individual. Los niños tendrán una cuadrícula de 3x3 en una pared y una cuadrícula de 3x3 con operaciones detrás de una silla. Los participantes deberán ver la operación de la silla y escribir lo más rápido posible la respuesta en la casilla correspondiente en el tablero. El primero que termine tiene 50 puntos.',
    'individual', '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Cuarto';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Desafío circular',
    'Individual. Se juega de 2 en 2. En una mesa habrá un círculo de 11 tapas. Por turnos, cada estudiante puede quitar una o dos tapas del círculo. Gana quien quite la última tapa del círculo. Los dos ganadores compiten por el primer y segundo puesto, los otros dos compiten por el tercer y cuarto puesto. 1er: 50 puntos, 2do: 30, 3ro: 20, 4to: 10.',
    'individual', '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Cuarto';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Tangram gigante',
    'Grupal. A cada pareja de estudiantes se le hará entrega de un tangram gigante y unas cartulinas donde están las siluetas de figuras que pueden ser formadas con tangram. El primer grupo que arme la figura de la cartulina es el ganador. Primero 50 puntos, segundo 30, tercero 20, cuarto 10.',
    'grupal', '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Cuarto';

-- PREGUNTAS QUINTO GRADO
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Un edificio de 4 pisos está habitado por 4 familias, una en cada piso. Si los Sarmiento viven en el piso siguiente al de los Pérez, los González no viven en el primer piso y los Cárdenas viven en el tercer piso. ¿En qué piso vive la familia Pérez?',
    '["A) Primer piso", "B) Segundo piso", "C) Tercer piso", "D) Cuarto piso"]'::jsonb,
    'B', 30, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Quinto';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Con una jarra de jugo de mango se llenan 8 vasos. Después de la fiesta de Luisa quedaron 15 jarras vacías y 5 jarras por la mitad. ¿Cuántos vasos se llenaron en la fiesta de Luisa?',
    '["A) 120 vasos", "B) 130 vasos", "C) 160 vasos", "D) 140 vasos"]'::jsonb,
    'B', 30, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Quinto';

INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden)
SELECT g.id, '1', 'opcion-multiple',
    'Las edades de una familia de canguros son de 2, 4, 5, 6, 8 y 10 años, la suma de las edades de 4 de ellos es de 22 años. ¿Cuáles son las edades de los otros dos canguros?',
    '["A) 2 y 8", "B) 4 y 5", "C) 5 y 8", "D) 6 y 8"]'::jsonb,
    'A', 30, '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Quinto';

-- RETOS QUINTO GRADO
INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Organiza las fichas',
    'Individual. En una mesa habrá un tablero 3x3 en el que habrá tapas de distintos colores: dos de un color, 3 de otro y otros 3 de otro. La idea es que los participantes organicen las tapas de tal manera que queden las columnas del mismo color moviendo las fichas de izquierda a derecha o de arriba abajo, no está permitido de manera diagonal. Los puntos se asignan por orden de quien termine primero. 1er: 50 puntos, 2do: 30, 3ro: 20, 4to: 10. El que no lo logre no obtiene puntos.',
    'individual', '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 1
FROM grados g WHERE g.nombre = 'Quinto';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Operaciones rápidas',
    'Individual. En la pared se colocarán varios números los cuales serán las respuestas de operaciones que deberán resolver los estudiantes. Los participantes están de espaldas a la pared, luego se les dice una operación de suma, resta, división o multiplicación (ejemplo: 3 x 9) y cuando tengan la respuesta se voltean y buscan la respuesta en la pared y la tocan. Gana 50 puntos el primero que acierte a 3. El segundo gana 30, el tercero gana 20 y si el último logra atinar al menos 1, gana 10 puntos, si no logra ninguna, no obtiene puntos.',
    'individual', '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 2
FROM grados g WHERE g.nombre = 'Quinto';

INSERT INTO retos (grado_id, nombre, instrucciones, tipo, puntos_por_puesto, orden)
SELECT g.id, 'Tangram gigante',
    'Grupal. A cada pareja de estudiantes se le hará entrega de un tangram gigante y unas cartulinas donde están las siluetas de figuras que pueden ser formadas con tangram. El primer grupo que arme la figura de la cartulina es el ganador. Primero 50 puntos, segundo 30, tercero 20, cuarto 10.',
    'grupal', '{"1": 50, "2": 30, "3": 20, "4": 10}'::jsonb, 3
FROM grados g WHERE g.nombre = 'Quinto';

COMMIT;

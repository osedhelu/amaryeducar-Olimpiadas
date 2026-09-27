-- Preguntas de inglés 2026 (opción múltiple) para Cuarto y Quinto.
-- Re-ejecutable: ON CONFLICT (grado_id, sesion, orden) DO UPDATE.
-- Distractores del mismo tema (misma forma: palabra vs frase). orden 1001..1100.

BEGIN;

-- 1) Desactivar las preguntas anteriores (matemáticas).
UPDATE preguntas SET activa = false WHERE orden < 1000;

-- 2) Cargar el banco de inglés en Cuarto y Quinto.
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "médico" en inglés?', '["A) Police officer", "B) Doctor", "C) Hairdresser / Barber", "D) Teacher"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1001, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "profesor" en inglés?', '["A) Teacher", "B) Journalist", "C) Veterinarian (Vet)", "D) Farmer"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1002, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "enfermera" en inglés?', '["A) Firefighter", "B) Nurse", "C) Veterinarian (Vet)", "D) Hairdresser / Barber"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1003, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "policía" en inglés?', '["A) Hairdresser / Barber", "B) Journalist", "C) Police officer", "D) Lawyer"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1004, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "cocinero" en inglés?', '["A) Nurse", "B) Cook / Chef", "C) Police officer", "D) Firefighter"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1005, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "bombero" en inglés?', '["A) Firefighter", "B) Carpenter", "C) Teacher", "D) Pilot"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1006, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "abogado" en inglés?', '["A) Police officer", "B) Mechanic", "C) Farmer", "D) Lawyer"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1007, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ingeniero" en inglés?', '["A) Engineer", "B) Hairdresser / Barber", "C) Mechanic", "D) Carpenter"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1008, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "granjero" en inglés?', '["A) Police officer", "B) Teacher", "C) Farmer", "D) Lawyer"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1009, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "carpintero" en inglés?', '["A) Farmer", "B) Mechanic", "C) Nurse", "D) Carpenter"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1010, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "cartero" en inglés?', '["A) A baker makes bread and cakes.", "B) Mail carrier / Postman", "C) My mother is an accountant.", "D) Firefighter"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1011, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "mesero" en inglés?', '["A) Waiter / Waitress", "B) Engineer", "C) Mechanic", "D) Teacher"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1012, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "peluquero" en inglés?', '["A) An architect", "B) Doctor", "C) Engineer", "D) Hairdresser / Barber"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1013, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "veterinario" en inglés?', '["A) Lawyer", "B) Engineer", "C) Veterinarian (Vet)", "D) Teacher"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1014, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "periodista" en inglés?', '["A) Journalist", "B) Engineer", "C) Cook / Chef", "D) Carpenter"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1015, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "A ___ flies airplanes."', '["A) Veterinarian (Vet)", "B) Pilot", "C) Waiter / Waitress", "D) Farmer"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1016, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "A ___ fixes cars."', '["A) Pilot", "B) Mechanic", "C) Waiter / Waitress", "D) Lawyer"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1017, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Who designs buildings and houses?', '["A) Cook / Chef", "B) An architect", "C) Lawyer", "D) Doctor"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1018, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Traduce: "Mi mamá es contadora."', '["A) Engineer", "B) My mother is an accountant.", "C) A baker makes bread and cakes.", "D) Mail carrier / Postman"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1019, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'What does a baker do?', '["A) My mother is an accountant.", "B) Mail carrier / Postman", "C) A baker makes bread and cakes.", "D) An architect"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1020, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "perro" en inglés?', '["A) Giraffe", "B) Bird", "C) Lion", "D) Dog"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1021, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "gato" en inglés?', '["A) Lion", "B) Sheep (no cambia)", "C) Mouse", "D) Cat"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1022, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "pájaro" en inglés?', '["A) Mouse", "B) Lion", "C) Snake", "D) Bird"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1023, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "pez" en inglés?', '["A) Monkey", "B) Sheep", "C) Giraffe", "D) Fish"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1024, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "vaca" en inglés?', '["A) Cow", "B) Giraffe", "C) Pig", "D) Cat"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1025, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "caballo" en inglés?', '["A) Cow", "B) Turtle", "C) Lion", "D) Horse"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1026, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "cerdo" en inglés?', '["A) Bird", "B) Dog", "C) Rabbit", "D) Pig"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1027, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "gallina" en inglés?', '["A) Bear", "B) Snake", "C) Hen / Chicken", "D) Dog"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1028, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "conejo" en inglés?', '["A) Turtle", "B) Mice", "C) Rabbit", "D) Hen / Chicken"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1029, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "oveja" en inglés?', '["A) Sheep", "B) Snake", "C) Hen / Chicken", "D) Horse"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1030, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "mono" en inglés?', '["A) Hen / Chicken", "B) Sheep", "C) Monkey", "D) Cow"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1031, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "tortuga" en inglés?', '["A) Rabbit", "B) Turtle", "C) Mice", "D) Mouse"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1032, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "serpiente" en inglés?', '["A) Snake", "B) Cat", "C) Mouse", "D) Dog"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1033, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "oso" en inglés?', '["A) Rabbit", "B) Bear", "C) Monkey", "D) Lion"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1034, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ratón" en inglés?', '["A) Fish", "B) Mice", "C) Cat", "D) Mouse"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1035, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "The ___ is the king of the jungle."', '["A) Bear", "B) Sheep (no cambia)", "C) Turtle", "D) Lion"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1036, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Which animal has a very long neck?', '["A) Sheep (no cambia)", "B) Turtle", "C) Giraffe", "D) Dog"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1037, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es el plural de "mouse"?', '["A) Mouse", "B) Mice", "C) Lion", "D) Sheep"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1038, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Traduce: "El pato nada en el lago."', '["A) Giraffe", "B) Bear", "C) The duck swims in the lake.", "D) Mice"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1039, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es el plural de "sheep"?', '["A) Lion", "B) Pig", "C) Bear", "D) Sheep (no cambia)"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1040, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "cocina" en inglés?', '["A) Garden / Yard", "B) Kitchen", "C) Stairs", "D) Bedroom"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1041, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "baño" en inglés?', '["A) Floor", "B) Bathroom", "C) Attic", "D) Wall"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1042, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "dormitorio" en inglés?', '["A) Wall", "B) Stairs", "C) Bedroom", "D) Garden / Yard"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1043, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "sala" en inglés?', '["A) Living room", "B) Dining room", "C) Floor", "D) Garage"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1044, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "puerta" en inglés?', '["A) Stairs", "B) Bedroom", "C) Wall", "D) Door"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1045, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "comedor" en inglés?', '["A) Floor", "B) Dining room", "C) Wall", "D) Basement"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1046, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ventana" en inglés?', '["A) Attic", "B) Garage", "C) Bedroom", "D) Window"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1047, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "techo" (exterior) en inglés?', '["A) Window", "B) Kitchen", "C) Roof", "D) Garage"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1048, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "piso / suelo" en inglés?', '["A) Living room", "B) Floor", "C) Door", "D) Garage"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1049, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "pared" en inglés?', '["A) Stairs", "B) Floor", "C) Wall", "D) Window"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1050, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "escaleras" en inglés?', '["A) Kitchen", "B) Stairs", "C) Bathroom", "D) Garden / Yard"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1051, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "jardín / patio" en inglés?', '["A) Bedroom", "B) Basement", "C) Garden / Yard", "D) Wall"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1052, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "garaje" en inglés?', '["A) Bathroom", "B) Window", "C) Garage", "D) Bedroom"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1053, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ático" en inglés?', '["A) Kitchen", "B) Garden / Yard", "C) Stairs", "D) Attic"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1054, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "sótano" en inglés?', '["A) Window", "B) Wall", "C) Basement", "D) Dining room"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1055, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Where do you cook?', '["A) My house has three bedrooms.", "B) In the bathroom.", "C) In the garage.", "D) In the kitchen."]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1056, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Where do you sleep?', '["A) In the bathroom.", "B) In the garage.", "C) My house has three bedrooms.", "D) In the bedroom."]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1057, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Where do you take a shower?', '["A) In the garage.", "B) In the kitchen.", "C) My house has three bedrooms.", "D) In the bathroom."]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1058, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Where do you park the car?', '["A) In the kitchen.", "B) In the garage.", "C) My house has three bedrooms.", "D) In the bathroom."]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1059, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Traduce: "Mi casa tiene tres habitaciones."', '["A) In the kitchen.", "B) In the bedroom.", "C) In the garage.", "D) My house has three bedrooms."]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1060, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "I ___ a student."', '["A) were", "B) I''m", "C) is", "D) am"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1061, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "She ___ happy."', '["A) They''re", "B) I''m", "C) is", "D) were"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1062, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "They ___ friends."', '["A) was", "B) are", "C) is", "D) am"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1063, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "He ___ my brother."', '["A) are", "B) was", "C) is", "D) I''m"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1064, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "We ___ in class."', '["A) were", "B) am", "C) are", "D) isn''t"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1065, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "You ___ tall."', '["A) isn''t", "B) are", "C) was", "D) were"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1066, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "It ___ a cat."', '["A) I''m", "B) is", "C) are", "D) was"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1067, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Pasa a negativo: "I am a doctor."', '["A) Is he a teacher?", "B) I am not (I''m not) a doctor.", "C) We are Colombian.", "D) They are not (aren''t) at home."]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1068, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Pasa a negativo: "She is tired."', '["A) She is not (isn''t) tired.", "B) Is he a teacher?", "C) Yes, I am.", "D) Are you ready?"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1069, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Pasa a negativo: "They are at home."', '["A) She is not (isn''t) tired.", "B) No, she isn''t.", "C) They are not (aren''t) at home.", "D) We are Colombian."]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1070, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Pasa a pregunta: "He is a teacher."', '["A) She is not (isn''t) tired.", "B) We are Colombian.", "C) Are you ready?", "D) Is he a teacher?"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1071, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Pasa a pregunta: "You are ready."', '["A) No, she isn''t.", "B) Are you ready?", "C) Is he a teacher?", "D) We are Colombian."]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1072, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es la contracción de "I am"?', '["A) is", "B) was", "C) I''m", "D) were"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1073, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es la contracción de "They are"?', '["A) is", "B) They''re", "C) are", "D) I''m"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1074, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es la contracción de "is not"?', '["A) isn''t", "B) are", "C) is", "D) am"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1075, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Respuesta corta afirmativa: "Are you a student?"', '["A) I am not (I''m not) a doctor.", "B) Are you ready?", "C) Yes, I am.", "D) We are Colombian."]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1076, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Respuesta corta negativa: "Is she a nurse?"', '["A) I am not (I''m not) a doctor.", "B) Is he a teacher?", "C) No, she isn''t.", "D) Are you ready?"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1077, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa en pasado: "I ___ at home yesterday."', '["A) isn''t", "B) was", "C) They''re", "D) I''m"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1078, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa en pasado: "They ___ at the party last night."', '["A) were", "B) isn''t", "C) They''re", "D) am"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1079, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Traduce: "Nosotros somos colombianos."', '["A) I am not (I''m not) a doctor.", "B) No, she isn''t.", "C) We are Colombian.", "D) She is not (isn''t) tired."]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1080, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "yo" en inglés?', '["A) She", "B) I", "C) You", "D) He"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1081, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "tú" en inglés?', '["A) We", "B) You", "C) Her", "D) I"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1082, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "él" en inglés?', '["A) It", "B) She", "C) He", "D) Me"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1083, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ella" en inglés?', '["A) Me", "B) She", "C) We", "D) It"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1084, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "nosotros" en inglés?', '["A) Him", "B) We", "C) I", "D) They"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1085, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ellos / ellas" en inglés?', '["A) We", "B) She", "C) You", "D) They"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1086, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Qué pronombre se usa para cosas y animales?', '["A) Her", "B) Him", "C) It", "D) I"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1087, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cómo se dice "ustedes" en inglés?', '["A) Them", "B) She", "C) You", "D) Her"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1088, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "María"', '["A) She", "B) Me", "C) Her", "D) It"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1089, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "Carlos"', '["A) He", "B) I", "C) Her", "D) Them"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1090, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "The dog"', '["A) Him", "B) Them", "C) It", "D) I"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1091, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "My friends"', '["A) You", "B) Him", "C) They", "D) He"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1092, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "Ana and I"', '["A) She", "B) We", "C) Me", "D) Her"]'::jsonb, 'B', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1093, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "You and Pedro"', '["A) You", "B) I", "C) They", "D) Him"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1094, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Reemplaza con un pronombre: "The books"', '["A) We", "B) Him", "C) They", "D) Me"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1095, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es el pronombre objeto de "I"?', '["A) Me", "B) She", "C) We", "D) Him"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1096, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es el pronombre objeto de "he"?', '["A) He", "B) You", "C) Them", "D) Him"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1097, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es el pronombre objeto de "she"?', '["A) Me", "B) You", "C) Her", "D) We"]'::jsonb, 'C', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1098, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', '¿Cuál es el pronombre objeto de "they"?', '["A) Them", "B) Me", "C) I", "D) He"]'::jsonb, 'A', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1099, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;
INSERT INTO preguntas (grado_id, sesion, tipo, enunciado, opciones, respuesta_correcta, tiempo_limite, puntos_por_puesto, orden, activa)
SELECT g.id, '1', 'opcion-multiple', 'Completa: "Pedro and I play soccer. ___ play every Sunday."', '["A) I", "B) They", "C) It", "D) We"]'::jsonb, 'D', 30, '{"1": 10, "2": 10, "3": 10, "4": 10, "5": 10, "6": 10, "7": 10, "8": 10, "9": 10, "10": 10, "11": 10, "12": 10, "13": 10, "14": 10, "15": 10, "16": 10, "17": 10, "18": 10, "19": 10, "20": 10, "21": 10, "22": 10, "23": 10, "24": 10, "25": 10, "26": 10, "27": 10, "28": 10, "29": 10, "30": 10, "31": 10, "32": 10, "33": 10, "34": 10, "35": 10, "36": 10, "37": 10, "38": 10, "39": 10, "40": 10, "41": 10, "42": 10, "43": 10, "44": 10, "45": 10, "46": 10, "47": 10, "48": 10, "49": 10, "50": 10}'::jsonb, 1100, true
FROM grados g WHERE g.nombre IN ('Cuarto', 'Quinto')
ON CONFLICT (grado_id, sesion, orden) DO UPDATE SET
    tipo = EXCLUDED.tipo, enunciado = EXCLUDED.enunciado, opciones = EXCLUDED.opciones,
    respuesta_correcta = EXCLUDED.respuesta_correcta, tiempo_limite = EXCLUDED.tiempo_limite,
    puntos_por_puesto = EXCLUDED.puntos_por_puesto, activa = EXCLUDED.activa;

COMMIT;

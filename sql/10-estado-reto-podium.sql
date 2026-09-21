-- Estado de sesión para mostrar en la pantalla grande el podio del reto lúdico
-- que se está calificando, sin salir del flujo del reto (reto_activo_id sigue
-- apuntando al reto). Re-ejecutable: ADD VALUE IF NOT EXISTS es idempotente.
--
-- Nota: ALTER TYPE ... ADD VALUE no puede correr dentro de un bloque de
-- transacción explícito en Postgres < 12; se deja sin BEGIN/COMMIT.
ALTER TYPE estado_sesion ADD VALUE IF NOT EXISTS 'reto_podium';

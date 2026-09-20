<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Amar y Educar — Olimpiadas Matemáticas 2026

Plataforma tipo Kahoot para olimpiadas escolares: pantalla grande (proyector), panel docente y respuesta en vivo desde el navegador del estudiante. Todo el stack habla con **PostgREST** sobre Postgres (Railway). **No hay Supabase.**

## Stack (sin sorpresas)

- **Next.js 16** — App Router, Turbopack, TypeScript. Ruteo en `src/app/`.
- **Tailwind v4** — configuración por CSS en `src/app/globals.css` (`@theme`: colores `azul`, `dorado`, `rojo`, `verde`, etc.). **No existe `tailwind.config.ts`.**
- **Postgres + PostgREST en Railway** — la API del frontend es PostgREST (REST + JWT), no ORM.
- **WebSocket**: servidor Node aparte en `server/ws-server.mjs` (puerto 3001). Next.js route handlers **no** manejan WebSocket upgrades (se intentó y se descartó).

## Comandos

```bash
npm run dev:all    # WebSocket (3001) + Next.js (3000) juntos  ← lo normal
npm run dev:ws     # solo el servidor WebSocket (Node, no HMR: reiniciar a mano tras editar)
npm run dev        # solo Next.js
npx tsc --noEmit   # typecheck (no hay script npm para esto)
npm run build      # build
```

- Verificación rápida tras cambios: `npx tsc --noEmit` y `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ruta`.
- Sin framework de tests.
- `pnpm` también funciona; `pnpm-workspace.yaml` declara `onlyBuiltDependencies` (si pnpm falla con `ERR_PNPM_IGNORED_BUILDS`, es eso).

## Arquitectura del tiempo real (crítica)

1. **Triggers en Postgres** hacen `pg_notify('canal_juego', jsonb)` en INSERT/UPDATE de `jugadores`, `respuestas`, `sesiones_juego`.
2. **`server/ws-server.mjs`** hace `LISTEN canal_juego`, parsea el payload (`tipo`, `tabla`, `data`, `ts`) y hace broadcast a los navegadores conectados, filtrando por `sessionId` (config en query string). También agenda el cierre automático de preguntas por cronómetro y marca `jugadores.conectado` true/false al conectar/cerrar la conexión WS.
3. **Frontend**: hook `useWebSocket(sessionId, role)` en `src/hooks/useWebSocket.ts` conecta a `NEXT_PUBLIC_WS_URL` con `?role=student|admin|presentacion&sessionId=&jugadorId=`.

Eventos que maneja el frontend: `jugador_unido`, `jugador_cambio`, `sesion_cambio`, `respuesta_recibida` (tipados en `src/types/game.ts`).

## Base de datos (Railway, schema en `sql/*.sql`)

- Fuente de verdad: `sql/01-schema.sql` … `05-roles-permissions.sql`. Se aplican **a mano** con psql contra la BD de Railway (TCP proxy `iriguchi.proxy.rlwy.net:49776`, credenciales en `.env.local` `DATABASE_URL`), no hay migraciones automáticas.
- Los archivos SQL son re-ejecutables (usar `DROP TRIGGER IF EXISTS` / `CREATE OR REPLACE`; ya están así).
- **Tras crear/editar una función PostgREST, recargar el schema cache**: `NOTIFY pgrst, 'reload schema';` desde psql. Si no, PostgREST responde `PGRST202` (función no encontrada).
- Roles PostgREST: `anon` (lectura), `estudiante` (insert/update en `respuestas`, `jugadores`), `docente` (todo — el frontend admin usa token docente). Funciones llamadas por PostgREST deben tener `GRANT EXECUTE` al rol apropiado.
- **`calcular_puntos_respuesta` es `SECURITY DEFINER`-free, pero `auto_cerrar_cuando_todos_respondan` debe ser `SECURITY DEFINER`** — hace UPDATE a `sesiones_juego` en un insert de estudiante; sin SECURITY DEFINER da 403 `permission denied for table sesiones_juego`. Si un trigger nuevo toca una tabla que el rol de escritura no puede modificar, usar este patrón.

### Lógica de juego (en SQL, no en JS)

- Orden de respuestas: columna `enviado_en` (timestamp del **cliente** con ms) + `secuencia BIGSERIAL` (orden real de llegada a la BD). Desempate por `(enviado_en, secuencia)`.
- Anti-trampa de reloj: en el trigger, si `|now() - enviado_en| > 60s` se corrige a `now()`.
- Puntos por puesto: `preguntas.puntos_por_puesto` (JSONB). Primer correcto = 20 (grados 1-3) o 50 (grados 4-5), segundo = 10/30, etc.
- Cierre automático: cuando todos los jugadores **conectados** (`conectado=true`) de la sesión responden la pregunta activa, la sesión pasa `pregunta → resultado` (trigger `auto_cerrar_cuando_todos_respondan`). Cronómetro es respaldo.
- `obtener_respuestas_sesion(p_sesion_id)` devuelve solo respuestas de la sesión (mezclar por `pregunta_id` global es un bug conocido — filtra siempre por sesión).
- `obtener_podium(p_sesion_id)` muestra **todos** los participantes con 0 puntos incluidos (LEFT JOIN), agrupando por jugador (1-3) o colegio (4-5).

## Sesión/identidad en el cliente (bugs sufridos)

- **Estudiante**: identidad en `sessionStorage` (por pestaña) — `jugador_id`, `jugador_nombre`, `jwt_estudiante`. Imprescindible para que varios estudiantes en el mismo navegador (pestañas) no se pisen.
- **Docente**: token en `localStorage` key `jwt_token` (persiste entre pestañas). El panel admin valida rol `docente` antes de cargar.
- JWT los firma el **servidor** (`src/lib/jwt.ts` + rutas `/api/auth/anon`, `/api/auth/login`, `/api/auth/student`, `/api/session/join`). **Nunca firmar JWT en el cliente** — `POSTGREST_JWT_SECRET` no es `NEXT_PUBLIC_`, no existe en el navegador.
- El cliente PostgREST (`src/lib/postgrest.ts`) resuelve token: estudiante de la pestaña → docente → anónimo; renueva token de estudiante expirado vía `/api/auth/student`.

## Endpoints clave del frontend

| Ruta                        | Rol                                                      | Qué es                                                          |
| --------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `/join`                     | estudiante                                               | Pide PIN + nombre (+ colegio en 4-5)                            |
| `/game/[sessionId]`         | estudiante                                               | Espera, responde A-D, ve resultado                              |
| `/admin` → `/admin/session` | docente (clave `ADMadm1234`, configurable `CLAVE_ADMIN`) | Sesiones, control de ronda, pódium, finalizar                   |
| `/presentacion/[sessionId]` | proyector                                                | Bienvenida, pregunta, resultado, pódium; control con 🔑 + clave |
| `/api/session/join`         | POST server-side                                         | Valida PIN, crea/actualiza jugador, firma token estudiante      |

Páginas típicas a editar para el evento: persistencia de puntos en `respuestas`/`preguntas`. No hay ORM: las páginas hacen `api.get/post/patch/rpc` contra PostgREST (`src/lib/postgrest.ts`).

## Operaciones comunes contra la BD (solo lectura → verificar antes de mutar)

```bash
source .env.local 2>/dev/null; psql "$DATABASE_URL"
```

Después de tocar `sql/*.sql` y aplicarlo a la nube, **sincronizar el archivo local** (es la fuente de verdad para el repo).

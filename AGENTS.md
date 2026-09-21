<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Amar y Educar — Olimpiadas Matemáticas 2026

Plataforma tipo Kahoot para olimpiadas escolares: pantalla grande (proyector), panel docente y respuesta en vivo desde el navegador del estudiante. **Backend: FastAPI sobre Postgres (Railway).** **No hay Supabase.**

## Stack (sin sorpresas)

- **Next.js 16** — App Router, Turbopack, TypeScript. Ruteo en `src/app/`.
- **Tailwind v4** — configuración por CSS en `src/app/globals.css` (`@theme`: colores `azul`, `dorado`, `rojo`, `verde`, etc.). **No existe `tailwind.config.ts`.**
- **Postgres en Railway** — la BD subyacente.
- **FastAPI backend** (`NEXT_PUBLIC_API_URL`, `backend/app/`) — para toda la lógica de juego (preguntas, respuestas, sesiones, retos, tabla, podium, imágenes de preguntas).
- **WebSocket**: conecta directamente al **FastAPI backend en Railway** (`/ws`). El frontend (`useWebSocket.ts`) se conecta a `NEXT_PUBLIC_WS_URL` → `wss://olimpiadas-api-production.up.railway.app/ws`. No hay servidor WebSocket local; en dev local se conecta al mismo Railway WebSocket.

## Arquitectura (crítica)

### Backend FastAPI

| URL env               | Uso                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | Toda la lógica de juego: sesiones, lanzar/cerrar preguntas, respuestas, retos, tabla, podium, imágenes de preguntas, auth, grados, colegios |

### Flujo de autenticación JWT

- JWTs se firman **en el cliente** con `POSTGREST_JWT_SECRET` (`src/lib/jwt.ts`): `signAnonJWT()`, `signEstudianteJWT(jugadorId, sesionId)`, `signDocenteJWT()`.
- Los tokens se envían como `Authorization: Bearer <token>` al backend FastAPI que valida con el mismo secreto.
- **Docente**: token en `localStorage` key `jwt_token` (persiste entre pestañas). Rol `docente`.
- **Estudiante**: token en `sessionStorage` key `jwt_estudiante` (por pestaña). Rol `estudiante`. Imprescindible para que varios estudiantes en el mismo navegador (pestañas) no se pisen.
- **Anon**: token anónimo para lectura pública.

### Frontend → Backend API

- **`src/lib/api.ts`** — cliente FastAPI: `api.*` contra `NEXT_PUBLIC_API_URL`. Token resuelto con `obtenerTokenValido()` de `src/lib/session.ts`.

### WebSocket (tiempo real)

1. **Triggers en Postgres** hacen `pg_notify('canal_juego', jsonb)` en INSERT/UPDATE de `jugadores`, `respuestas`, `sesiones_juego`, `puntajes_retos`.
2. **FastAPI** (`backend/app/interfaces/websocket/ws.py`) maneja las conexiones WebSocket con `ConnectionManager`. Escucha en `/ws`, filtra por `sessionId`, marca `jugadores.conectado` true/false.
3. **Frontend**: hook `useWebSocket(sessionId, role)` en `src/hooks/useWebSocket.ts` conecta a `NEXT_PUBLIC_WS_URL` (Railway) con `?role=student|admin|presentacion&sessionId=&jugadorId=`.

Eventos que maneja el frontend: `jugador_unido`, `jugador_cambio`, `sesion_cambio`, `respuesta_recibida`, `reto` (tipados en `src/types/game.ts`).

## Comandos

```bash
npm run dev        # Next.js (puerto 3000) — el WS conecta directo a Railway
npx tsc --noEmit   # typecheck (no hay script npm para esto)
npm run build      # build
```

- Verificación rápida tras cambios: `npx tsc --noEmit` y `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ruta`.
- Sin framework de tests.
- `pnpm` también funciona; `pnpm-workspace.yaml` declara `onlyBuiltDependencies` (si pnpm falla con `ERR_PNPM_IGNORED_BUILDS`, es eso).
- No hay servidor WebSocket local. El frontend se conecta directamente al WebSocket de Railway en dev y producción.

## Base de datos (Railway)

- Fuente de verdad: `sql/01-schema.sql` … `09-preguntas-imagenes.sql`. Se aplican **a mano** con psql contra la BD de Railway (TCP proxy `iriguchi.proxy.rlwy.net:49776`, credenciales en `.env.local` `DATABASE_URL`), no hay migraciones automáticas.
- Los archivos SQL son re-ejecutables (usar `DROP TRIGGER IF EXISTS` / `CREATE OR REPLACE`; ya están así).
- **Imágenes de preguntas**: `preguntas_imagenes` table (BYTEA) + `preguntas.imagen_actualizado_en` (cache-buster). Se sirven vía `GET /preguntas/{id}/imagen` del **FastAPI** backend.

### Lógica de juego (en SQL, no en JS)

- Orden de respuestas: columna `enviado_en` (timestamp del **cliente** con ms) + `secuencia BIGSERIAL` (orden real de llegada a la BD). Desempate por `(enviado_en, secuencia)`.
- Anti-trampa de reloj: en el trigger, si `|now() - enviado_en| > 60s` se corrige a `now()`.
- Puntos por puesto: `preguntas.puntos_por_puesto` (JSONB). Primer correcto = 20 (grados 1-3) o 50 (grados 4-5), segundo = 10/30, etc.
- Cierre automático: cuando todos los jugadores **conectados** (`conectado=true`) de la sesión responden la pregunta activa, la sesión pasa `pregunta → resultado` (auto-cierre). El **cronómetro es solo visual**: NO cierra la pregunta ni impide responder. El docente puede cerrar a mano en cualquier momento.
- `obtener_respuestas_sesion(p_sesion_id)` devuelve solo respuestas de la sesión (mezclar por `pregunta_id` global es un bug conocido — filtra siempre por sesión).
- `obtener_podium(p_sesion_id)` muestra **todos** los participantes con 0 puntos incluidos (LEFT JOIN), agrupando por jugador (1-3) o colegio (4-5).

### Registro de participantes (alumnos, colegios, duelos, tabla)

- **El alumno ya NO escribe su nombre**: el docente registra colegios (`/colegios`) y alumnos (`/alumnos`) vinculados a colegio + grado. El alumno entra a una sesión con el PIN y **toca su nombre** de la lista (`GET /sessions/by-pin/{pin}/alumnos`), no teclea nada.
- `JoinRequest` usa `alumno_id` (no `nombre`). El join crea/reutiliza el `jugador` vinculado al alumno registrado.
- **Enfrentamiento todos contra todos**: `GET /tabla/{grado_id}` suma puntos (respuestas + retos) por colegio SOLO de sesiones `tipo='oficial'`, con ceros incluidos.
- **Duelo/prueba 1v1**: `POST /duelos` con `{grado_id, alumno_a_id, alumno_b_id}` (mismo grado; colegio igual o distinto). Crea sesión `tipo='prueba'` con PIN; la lista de alumnos para ese PIN muestra solo los 2 duelistas. Los puntos NO entran a `/tabla`. Varias preguntas del grado; gana el que más sume.
- **Retos lúdicos**: `POST /retos/{id}/puestos` con `{sesion_id, jugador_id|colegio_id, puesto}`. Los puntos quedan atados a la **sesión** (`puntajes_retos.sesion_id`): el podium y `/tabla` solo suman retos de la sesión actual (oficial en la tabla). El jurado toca al participante que termina 1º, 2º, etc. `GET /retos/{id}/puntajes?sesion_id=` y `DELETE /retos/{id}/puestos` para ver/deshacer. Individual→jugador, Grupal→colegio.
- Resultados finales: el dashboard y la pantalla grande muestran **puntos por estudiante** (podium) y **total por colegio** (tabla).

## Sesión/identidad en el cliente (bugs sufridos)

- **Estudiante**: identidad en `sessionStorage` (por pestaña) — `jugador_id`, `jugador_nombre`, `jwt_estudiante`. Imprescindible para que varios estudiantes en el mismo navegador (pestañas) no se pisen.
- **Docente**: token en `localStorage` key `jwt_token` (persiste entre pestañas). El panel admin valida rol `docente` antes de cargar.
- JWT los firma **el cliente** (`src/lib/jwt.ts`). **Nunca firmar JWT en el cliente** — `POSTGREST_JWT_SECRET` no es `NEXT_PUBLIC_`, no existe en el navegador como variable de build.
- El cliente FastAPI (`src/lib/api.ts`) resuelve token con `obtenerTokenValido()` de `src/lib/session.ts` (mismo flujo).

## Endpoints clave del frontend

| Ruta                        | Qué es                                                          |
| --------------------------- | --------------------------------------------------------------- |
| `/join`                     | Pide PIN + toca nombre del alumno de la lista (solo alumno)     |
| `/game/[sessionId]`         | Espera, responde A-D, ve resultado                              |
| `/admin` → `/admin/session` | Sesiones, control de ronda, pódium, finalizar                   |
| `/presentacion/[sessionId]` | Bienvenida, pregunta, resultado, pódium; control con 🔑 + clave |

**FastAPI endpoints** (vía `src/lib/api.ts`):

| Prefijo                                | Qué cubre                                                                                                                                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth`                                | `POST /auth/login`, `POST /auth/student`, `GET /auth/anon`, `GET /grados`, `GET /colegios`                                                                                                               |
| `/sessions`                            | `POST/GET /sessions`, `GET /sessions/by-pin/{pin}`, `GET /sessions/by-pin/{pin}/alumnos`, `GET /sessions/{id}`, `GET /sessions/{id}/jugadores`, `PATCH /sessions/{id}`, `PATCH /sessions/{id}/finalizar` |
| `/preguntas`                           | `POST/PATCH/DELETE /preguntas`, `POST /preguntas/{id}/mover`, `POST/GET/DELETE /preguntas/{id}/imagen`, `GET /preguntas?grado_id=`, `GET /preguntas/{id}`                                                |
| `/answers`                             | `POST /answers`, `GET /answers/check`, `PATCH /answers/{id}/aprobar`                                                                                                                                     |
| `/retos`                               | `POST /retos/{id}/puestos`, `GET /retos/{id}/puntajes`, `DELETE /retos/{id}/puestos`                                                                                                                     |
| `/sessions/{id}/preguntas/{id}/lanzar` | Lanzar pregunta                                                                                                                                                                                          |
| `/sessions/{id}/cerrar-pregunta`       | Cerrar pregunta                                                                                                                                                                                          |
| `/tabla/{grado_id}`                    | Tabla de colegios                                                                                                                                                                                        |
| `/duelos`                              | `POST /duelos`, `GET /duelos`                                                                                                                                                                            |
| `/colegios`, `/alumnos`                | CRUD completo                                                                                                                                                                                            |
| `/podium/{sesionId}`                   | Pódium                                                                                                                                                                                                   |

Páginas típicas a editar para el evento: persistencia de puntos en `respuestas`/`preguntas`. Las páginas hacen `api.get/post/patch` contra `src/lib/api.ts` (FastAPI).

## Operaciones comunes contra la BD (solo lectura → verificar antes de mutar)

```bash
source .env.local 2>/dev/null; psql "$DATABASE_URL"
```

Después de tocar `sql/*.sql` y aplicarlo a la nube, **sincronizar el archivo local** (es la fuente de verdad para el repo).

## Estructura del backend FastAPI

```
backend/app/
├── main.py                          # FastAPI app, incluye todos los routers
├── core/
│   ├── config.py                    # Settings (CORS, etc.)
│   ├── exceptions.py                # DomainError handler
│   └── security.py                  # Seguridad compartida
├── domain/
│   ├── entities.py                  # Entidades del dominio
│   ├── enums.py                     # Enums (roles, tipos)
│   └── rules.py                     # Reglas de negocio
├── application/
│   ├── dto.py                       # DTOs compartidos
│   ├── ports.py                     # Puertos (interfaces de repositorio)
│   ├── answers/use_cases.py
│   ├── podium/
│   ├── preguntas/use_cases.py
│   ├── registro/use_cases.py
│   ├── retos/use_cases.py
│   └── sessions/use_cases.py
├── infrastructure/
│   ├── auth/                        # Auth dependencies
│   ├── db/
│   │   ├── models.py                # Modelos SQLAlchemy
│   │   ├── repositories.py          # Repositorios
│   │   └── session.py               # Sesión de BD
│   └── realtime/
│       └── manager.py               # ConnectionManager WebSocket
└── interfaces/
    ├── api/
    │   ├── deps.py                  # Dependencias FastAPI (require_docente, require_estudiante)
    │   └── routers/
    │       ├── auth.py              # Auth, grados, colegios
    │       ├── sessions.py          # Sesiones, preguntas, lanzar/cerrar
    │       ├── answers.py           # Respuestas, retos (puestos)
    │       ├── registro.py          # Colegios, alumnos, tabla, duelos
    │       ├── preguntas.py         # CRUD preguntas + imágenes
    │       └── ws.py                # WebSocket router
    └── websocket/
        └── ws.py                    # WebSocket handler
```

## Variables de entorno clave (`.env.local`)

```
NEXT_PUBLIC_API_URL=https://olimpiadas-api-production.up.railway.app        # FastAPI
NEXT_PUBLIC_WS_URL=wss://olimpiadas-api-production.up.railway.app/ws        # WebSocket
POSTGREST_JWT_SECRET=506e2e1ec01557279e5a203939359c812b9af9a40e535ff3b89992ade34e5616  # Firma JWT
DATABASE_URL=postgresql://...@iriguchi.proxy.rlwy.net:49776/railway          # Postgres directo
CLAVE_ADMIN=ADMadm1234                                                        # Clave admin docente
```

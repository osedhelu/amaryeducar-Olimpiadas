# Graph Report - amaryeducar-olimpiadas2026  (2026-09-21)

## Corpus Check
- 86 files · ~38,205 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 1064 nodes · 2566 edges · 75 communities (43 shown, 32 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 308 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fe247f49`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatosInvalidos
- session.ts
- package.json
- sessions.py
- 01-schema.sql
- AGENTS.md — Guía de arquitectura Amar y Educar
- repositories.py
- ref_http
- DomainError
- ConnectionManager
- RealtimePublisher
- compilerOptions
- main.py
- _row_to_obj
- RespuestaRepo
- AsyncSession
- get_settings
- test_sessions_use_cases.py
- deps.py
- AdminSessionPage
- UUID
- config.py
- RolJWT
- Orden de respuestas: enviado_en (cliente, ms) + secuencia BIGSERIAL, desempate (enviado_en, secuencia)
- next
- ColegioRepo
- file.svg — icono genérico de archivo (asset de plantilla)
- postcss.config.mjs
- amaryeducar-api
- test_answers_use_cases.py
- test_domain_rules.py
- api.ts
- PreguntasPanel.tsx
- fakes.py
- conftest.py
- FakeDb
- presentacion/[sessionId]/page.tsx
- test_preguntas_use_cases.py
- _Singleton
- FakeRespuestaRepo
- FakePreguntaRepo
- FakeJugadorRepo
- test_retos_use_cases.py
- AlumnoRepo
- entities.py
- uc_duelo
- TestAsignarPuesto
- FakeRealtime
- FakeAlumnoRepo
- session.py
- RetosPanel
- TestImagen
- uc_sesion
- ColegiosPanel
- TestListarPuntajes
- AlumnosPanel
- domain_error_handler
- uc_preguntas

## God Nodes (most connected - your core abstractions)
1. `DomainError` - 52 edges
2. `DatosInvalidos` - 48 edges
3. `entity_to_dict()` - 47 edges
4. `SesionUseCases` - 39 edges
5. `PreguntaRepo` - 34 edges
6. `SesionRepo` - 33 edges
7. `JugadorRepo` - 32 edges
8. `ControlRondaUseCases` - 30 edges
9. `_row_to_obj()` - 30 edges
10. `RegistroUseCases` - 29 edges

## Surprising Connections (you probably didn't know these)
- `next.svg — logotipo de Next.js (texto + marca)` --conceptually_related_to--> `Next.js 16 (App Router, Turbopack, TypeScript)`  [INFERRED]
  public/next.svg → AGENTS.md
- `Scaffold create-next-app` --semantically_similar_to--> `Next.js 16 (App Router, Turbopack, TypeScript)`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `vercel.svg — triángulo/logotipo de Vercel` --conceptually_related_to--> `README.md — Scaffold create-next-app genérico`  [INFERRED]
  public/vercel.svg → README.md
- `next/font — optimización automática de fuentes` --conceptually_related_to--> `Next.js 16 (App Router, Turbopack, TypeScript)`  [INFERRED]
  README.md → AGENTS.md
- `CLAUDE.md — Indirección a AGENTS.md` --references--> `AGENTS.md — Guía de arquitectura Amar y Educar`  [EXTRACTED]
  CLAUDE.md → AGENTS.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo de identidad y tokens (estudiante por pestaña, docente persistente, JWT de servidor)** — agents_identidad_estudiante, agents_identidad_docente, agents_jwt_servidor, agents_cliente_postgrest, agents_roles_postgrest [EXTRACTED 1.00]
- **Pasarela de eventos en tiempo real (Postgres → WebSocket → frontend)** — agents_canal_juego_pg_notify, agents_servidor_ws, agents_use_websocket_hook, agents_eventos_tiempo_real [EXTRACTED 1.00]
- **Lógica de juego implementada en SQL (nichos, orden, puntos, cierre y lecturas)** — agents_auto_cerrar_cuando_todos_respondan, agents_calcular_puntos_respuesta, agents_obtener_respuestas_sesion, agents_obtener_podium, agents_orden_respuestas, agents_puntos_por_puesto, agents_antitrampa_reloj [EXTRACTED 1.00]

## Communities (75 total, 32 thin omitted)

### Community 0 - "DatosInvalidos"
Cohesion: 0.07
Nodes (39): app_application_dto, app_application_ports, app_core_exceptions, app_domain_entities, app_domain_enums, app_infrastructure_db_models, app_infrastructure_db_repositories, _ahora() (+31 more)

### Community 1 - "session.ts"
Cohesion: 0.12
Nodes (19): AdminLogin(), handleSubmit(), GamePage(), enviarRespuesta(), verificarRespuestaExistente(), JoinPage(), entrar(), request() (+11 more)

### Community 2 - "package.json"
Cohesion: 0.05
Nodes (40): eslintConfig, dependencies, jsonwebtoken, next, react, react-dom, @types/jsonwebtoken, devDependencies (+32 more)

### Community 3 - "sessions.py"
Cohesion: 0.22
Nodes (25): PodiumUseCases, EnfrentamientoUseCases, Tabla todos contra todos: puntos por colegio en sesiones oficiales de un grado., get_manager(), actualizar_sesion(), alumnos_por_pin(), cerrar_pregunta(), crear_sesion() (+17 more)

### Community 4 - "01-schema.sql"
Cohesion: 0.08
Nodes (43): colegios, grados, idx_jugadores_nombre, idx_jugadores_sesion, idx_preguntas_grado_sesion, idx_puntajes_retos_reto, idx_respuestas_envio, idx_respuestas_envio_sec (+35 more)

### Community 5 - "AGENTS.md — Guía de arquitectura Amar y Educar"
Cohesion: 0.09
Nodes (34): AGENTS.md — Guía de arquitectura Amar y Educar, POST /api/session/join: valida PIN, crea/actualiza jugador, firma token estudiante, Trigger auto_cerrar_cuando_todos_respondan (SECURITY DEFINER), Canal pg_notify 'canal_juego' (triggers en jugadores, respuestas, sesiones_juego), Cierre automático de pregunta: transición pregunta → resultado, Clave admin (ADMadm1234 / CLAVE_ADMIN), Cliente PostgREST src/lib/postgrest.ts (resolución de token estudiante→docente→anon), Comandos dev: npm run dev:all, dev:ws, dev; npx tsc --noEmit (+26 more)

### Community 6 - "repositories.py"
Cohesion: 0.12
Nodes (32): PodiumEntry, AlumnoORM, Base, ColegioORM, EstadoSesionEnum, GradoORM, JugadorORM, ParametroORM (+24 more)

### Community 8 - "DomainError"
Cohesion: 0.06
Nodes (61): app_application_preguntas_use_cases, app_application_registro_use_cases, ActualizarAlumnoRequest, ActualizarColegioRequest, ActualizarPreguntaRequest, AsignarPuestoRetoRequest, CrearAlumnoRequest, CrearColegioRequest (+53 more)

### Community 9 - "ConnectionManager"
Cohesion: 0.18
Nodes (7): ConnectionManager, Any, WebSocket, Envía a una sala concreta o a todas si sesion_id es None., Enviar a la sala de la sesión + a todos los admins., Maneja todas las conexiones WebSocket por sala de sesión. -…, IDs de jugadores con WebSocket abierto en la sesión.

### Community 10 - "RealtimePublisher"
Cohesion: 0.11
Nodes (11): ABC, AsyncSession, Any, datetime, El cronómetro es SOLO VISUAL: no cierra la pregunta por tiempo. La pregunta se…, IDs de jugadores de la sesión con el WebSocket abierto ahora mismo. Se usa para…, Contrato que el dominio usa para avisar al mundo del WebSocket. La…, RealtimePublisher (+3 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 12 - "main.py"
Cohesion: 0.13
Nodes (16): app_infrastructure_db_session, app_infrastructure_realtime_manager, app_interfaces_api_routers, app_interfaces_websocket, asyncio, datetime, El cronómetro es SOLO VISUAL: la pregunta no se cierra por tiempo. El…, websocket (+8 more)

### Community 13 - "_row_to_obj"
Cohesion: 0.19
Nodes (5): Pregunta, SesionJuego, _row_to_obj(), Regresión: la pantalla de resultados NO debe mostrar una fila por pregunta…, TestRespuestasSesionFiltro

### Community 14 - "RespuestaRepo"
Cohesion: 0.14
Nodes (6): Respuesta, datetime, Replica el trigger SQL: count correctas previas con desempate (enviado_en,…, Total de respuestas anteriores en la sesión (nº de orden global)., Borra las respuestas de una pregunta en una sesión (para re-lanzar)., RespuestaRepo

### Community 16 - "get_settings"
Cohesion: 0.43
Nodes (5): get_settings(), crear_jwt(), _now(), datetime, validar_clave_admin()

### Community 17 - "test_sessions_use_cases.py"
Cohesion: 0.11
Nodes (19): app_application_sessions_use_cases, app_interfaces_api_deps, CrearSesionRequest, JoinRequest, AuthUseCases, ClaveIncorrecta, anon_token(), colegios() (+11 more)

### Community 18 - "deps.py"
Cohesion: 0.36
Nodes (7): app_core_security, verificar_jwt(), error_handler(), get_current_usuario(), HTTPException, require_docente(), require_estudiante()

### Community 19 - "AdminSessionPage"
Cohesion: 0.30
Nodes (11): AdminSessionPage(), aprobarRespuesta(), cargarJugadores(), cargarPreguntas(), cargarRespuestas(), cerrarPregunta(), crearSesion(), finalizarSesion() (+3 more)

### Community 20 - "UUID"
Cohesion: 0.14
Nodes (5): Jugador, JugadorRepo, PuntajeRetoRepo, UUID, Marca como conectados los jugadores indicados (con WS abierto).

### Community 21 - "config.py"
Cohesion: 0.29
Nodes (6): normalizar_database_url(), Fuerza el driver asyncpg en la URL de Postgres. Railway inyecta DATABASE_URL…, Settings, BaseSettings, functools, pydantic_settings

### Community 22 - "RolJWT"
Cohesion: 0.62
Nodes (6): str, RolJWT, SesionNumero, TipoPregunta, TipoReto, Enum

### Community 23 - "Orden de respuestas: enviado_en (cliente, ms) + secuencia BIGSERIAL, desempate (enviado_en, secuencia)"
Cohesion: 0.47
Nodes (6): Anti-trampa de reloj: corrección si |now() - enviado_en| > 60s, Función calcular_puntos_respuesta, Función obtener_podium(p_sesion_id), Función obtener_respuestas_sesion(p_sesion_id), Orden de respuestas: enviado_en (cliente, ms) + secuencia BIGSERIAL, desempate (enviado_en, secuencia), Puntos por puesto: preguntas.puntos_por_puesto JSONB (20/10 grados 1-3, 50/30 grados 4-5)

### Community 24 - "next"
Cohesion: 0.18
Nodes (6): nextConfig, next, src_app_globals, inter, metadata, poppins

### Community 26 - "file.svg — icono genérico de archivo (asset de plantilla)"
Cohesion: 1.00
Nodes (3): file.svg — icono genérico de archivo (asset de plantilla), globe.svg — icono genérico de globo terráqueo (asset de plantilla), window.svg — icono genérico de ventana de navegador (asset de plantilla)

### Community 42 - "test_answers_use_cases.py"
Cohesion: 0.05
Nodes (42): app_application_answers_use_cases, RespuestaUseCases, AprobarRespuestaRequest, EnviarRespuestaRequest, RetoUseCases, PreguntaNoActiva, RespuestaDuplicada, SesionNoActiva (+34 more)

### Community 43 - "test_domain_rules.py"
Cohesion: 0.09
Nodes (17): app_domain_rules, calcular_puntos(), corregir_reloj(), es_correcta_opcion(), es_grado_grupal(), ordenar_por_envio(), datetime, Lógica pura de negocio: puntos, anti-trampa de reloj, desempate y cierre.… (+9 more)

### Community 44 - "api.ts"
Cohesion: 0.19
Nodes (20): react, Vista, DuelosPanel(), EnfrentamientoPanel(), MEDALLAS, Props, api, apiUrl (+12 more)

### Community 45 - "PreguntasPanel.tsx"
Cohesion: 0.13
Nodes (16): comprimirImagen(), FORM_VACIO, FormState, ImagenPendiente, LETRAS, PreguntasPanel(), abrirCrear(), abrirEditar() (+8 more)

### Community 46 - "fakes.py"
Cohesion: 0.14
Nodes (6): Colegio, _ahora(), FakeColegioRepo, FakeSesionRepo, datetime, Fakes de repositorios y del publisher realtime para tests unitarios sin BD.

### Community 47 - "conftest.py"
Cohesion: 0.24
Nodes (16): Grado, _ahora(), alumno(), colegio_1(), colegio_2(), grado_grupal(), grado_individual(), jugador() (+8 more)

### Community 48 - "FakeDb"
Cohesion: 0.14
Nodes (6): FakeDb, Sesión asíncrona falsa: solo registra commits/flushes; los repos fake ignoran…, El cronómetro es solo visual: no se programa ningún cierre., Al re-lanzar (p. ej. sesión reabierta), los jugadores con WS abierto se vuelven…, Al re-lanzar una pregunta ya respondida, se borran sus respuestas para que los…, TestCronometroVisual

### Community 49 - "presentacion/[sessionId]/page.tsx"
Cohesion: 0.19
Nodes (9): PresentacionPage(), siguientePregunta(), Vista, getWsBase(), useWebSocket(), imagenPreguntaUrl(), EventoWS, Pregunta (+1 more)

### Community 50 - "test_preguntas_use_cases.py"
Cohesion: 0.20
Nodes (6): CrearPreguntaRequest, Tests del CRUD de preguntas y su imagen (banco del docente)., TestCrear, TestEliminar, TestMover, pytest

### Community 51 - "_Singleton"
Cohesion: 0.16
Nodes (5): FakeGradoRepo, FakeRepos, FakeRetoRepo, Contenedor de fakes; expone los mismos nombres que el módulo de repos reales., _Singleton

### Community 55 - "test_retos_use_cases.py"
Cohesion: 0.24
Nodes (7): app_application_retos_use_cases, fixture, Tests del jurado: asignación de puestos en retos lúdicos., reto_grupal(), reto_individual(), TestQuitarPuesto, uc_retos()

### Community 57 - "entities.py"
Cohesion: 0.22
Nodes (5): PuntajeReto, TokenInfo, FakePuntajeRetoRepo, dataclasses, uuid

### Community 58 - "uc_duelo"
Cohesion: 0.20
Nodes (5): fixture, uc_duelo(), uc_enfrentamiento(), uc_registro(), uc_sesion()

### Community 62 - "session.py"
Cohesion: 0.33
Nodes (5): app_core_config, get_db(), init_db(), AsyncSession, Crea las tablas si no existen. Para MVP; se recomienda Alembic.

### Community 63 - "RetosPanel"
Cohesion: 0.40
Nodes (3): RetosPanel(), abrirReto(), cargarPuntajes()

### Community 65 - "uc_sesion"
Cohesion: 0.40
Nodes (3): fixture, Instancia SesionUseCases con los repos fake inyectados., uc_sesion()

### Community 66 - "ColegiosPanel"
Cohesion: 0.70
Nodes (5): ColegiosPanel(), cargar(), crear(), eliminar(), guardarEdicion()

### Community 68 - "AlumnosPanel"
Cohesion: 0.83
Nodes (4): AlumnosPanel(), cargarAlumnos(), crear(), eliminar()

### Community 70 - "domain_error_handler"
Cohesion: 0.67
Nodes (3): domain_error_handler(), exception_handler, Request

## Knowledge Gaps
- **74 isolated node(s):** `TokenInfo`, `amaryeducar-api`, `eslintConfig`, `nextConfig`, `name` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 317 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RealtimePublisher` connect `RealtimePublisher` to `DatosInvalidos`, `DomainError`, `ConnectionManager`, `test_answers_use_cases.py`, `main.py`, `fakes.py`, `FakeRealtime`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `ConnectionManager` connect `ConnectionManager` to `sessions.py`, `RealtimePublisher`, `deps.py`, `main.py`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `DatosInvalidos` connect `DatosInvalidos` to `TestImagen`, `DomainError`, `test_answers_use_cases.py`, `test_sessions_use_cases.py`, `test_preguntas_use_cases.py`, `test_retos_use_cases.py`, `AlumnoRepo`, `ColegioRepo`, `TestAsignarPuesto`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `DomainError` (e.g. with `error_handler()` and `aprobar_respuesta()`) actually correct?**
  _`DomainError` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `DatosInvalidos` (e.g. with `RespuestaUseCases` and `PreguntasUseCases`) actually correct?**
  _`DatosInvalidos` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `SesionUseCases` (e.g. with `ActualizarSesionRequest` and `CrearSesionRequest`) actually correct?**
  _`SesionUseCases` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `TokenInfo`, `amaryeducar-api`, `eslintConfig` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
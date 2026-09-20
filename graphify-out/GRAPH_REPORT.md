# Graph Report - amaryeducar-olimpiadas2026  (2026-09-19)

## Corpus Check
- Corpus is ~15,201 words - fits in a single context window. You may not need a graph.

## Summary
- 273 nodes · 429 edges · 18 communities (14 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Config Next y Admin
- Arquitectura del Juego
- Tooling y DevDeps
- Esquema Base de Datos
- Pantallas Estudiante
- Config TypeScript
- Autenticacion JWT
- Servidor WebSocket
- Triggers y Notify SQL
- Control del Docente
- Dependencias Prod
- Pantalla Presentacion
- Puntos y Podio
- Estilos y Layout
- Assets SVG
- Config PostCSS

## God Nodes (most connected - your core abstractions)
1. `AGENTS.md — Guía de arquitectura Amar y Educar` - 17 edges
2. `compilerOptions` - 16 edges
3. `AdminSessionPage()` - 14 edges
4. `next` - 13 edges
5. `jugadores` - 10 edges
6. `sesiones_juego` - 9 edges
7. `respuestas` - 8 edges
8. `PresentacionPage()` - 8 edges
9. `scripts` - 7 edges
10. `react` - 7 edges

## Surprising Connections (you probably didn't know these)
- `next.svg — logotipo de Next.js (texto + marca)` --conceptually_related_to--> `Next.js 16 (App Router, Turbopack, TypeScript)`  [INFERRED]
  public/next.svg → AGENTS.md
- `Scaffold create-next-app` --semantically_similar_to--> `Next.js 16 (App Router, Turbopack, TypeScript)`  [INFERRED] [semantically similar]
  README.md → AGENTS.md
- `vercel.svg — triángulo/logotipo de Vercel` --conceptually_related_to--> `README.md — Scaffold create-next-app genérico`  [INFERRED]
  public/vercel.svg → README.md
- `next/font — optimización automática de fuentes` --conceptually_related_to--> `Next.js 16 (App Router, Turbopack, TypeScript)`  [INFERRED]
  README.md → AGENTS.md
- `AGENTS.md — Guía de arquitectura Amar y Educar` --references--> `onlyBuiltDependencies: unrs-resolver`  [EXTRACTED]
  AGENTS.md → pnpm-workspace.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Pasarela de eventos en tiempo real (Postgres → WebSocket → frontend)** — agents_canal_juego_pg_notify, agents_servidor_ws, agents_use_websocket_hook, agents_eventos_tiempo_real [EXTRACTED 1.00]
- **Lógica de juego implementada en SQL (nichos, orden, puntos, cierre y lecturas)** — agents_auto_cerrar_cuando_todos_respondan, agents_calcular_puntos_respuesta, agents_obtener_respuestas_sesion, agents_obtener_podium, agents_orden_respuestas, agents_puntos_por_puesto, agents_antitrampa_reloj [EXTRACTED 1.00]
- **Flujo de identidad y tokens (estudiante por pestaña, docente persistente, JWT de servidor)** — agents_identidad_estudiante, agents_identidad_docente, agents_jwt_servidor, agents_cliente_postgrest, agents_roles_postgrest [EXTRACTED 1.00]

## Communities (18 total, 4 thin omitted)

### Community 0 - "Config Next y Admin"
Cohesion: 0.10
Nodes (26): nextConfig, next, react, Vista, Vista, useWebSocket(), api, buildHeaders() (+18 more)

### Community 1 - "Arquitectura del Juego"
Cohesion: 0.08
Nodes (36): AGENTS.md — Guía de arquitectura Amar y Educar, POST /api/session/join: valida PIN, crea/actualiza jugador, firma token estudiante, Trigger auto_cerrar_cuando_todos_respondan (SECURITY DEFINER), Canal pg_notify 'canal_juego' (triggers en jugadores, respuestas, sesiones_juego), Cierre automático de pregunta: transición pregunta → resultado, Clave admin (ADMadm1234 / CLAVE_ADMIN), Cliente PostgREST src/lib/postgrest.ts (resolución de token estudiante→docente→anon), Comandos dev: npm run dev:all, dev:ws, dev; npx tsc --noEmit (+28 more)

### Community 2 - "Tooling y DevDeps"
Cohesion: 0.06
Nodes (33): eslintConfig, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/pg (+25 more)

### Community 3 - "Esquema Base de Datos"
Cohesion: 0.17
Nodes (23): colegios, grados, idx_jugadores_nombre, idx_jugadores_sesion, idx_preguntas_grado_sesion, idx_puntajes_retos_reto, idx_respuestas_envio, idx_respuestas_envio_sec (+15 more)

### Community 4 - "Pantallas Estudiante"
Cohesion: 0.16
Nodes (16): AdminLogin(), handleSubmit(), GamePage(), enviarRespuesta(), verificarRespuestaExistente(), JoinPage(), handleJoin(), decodificarJWT() (+8 more)

### Community 5 - "Config TypeScript"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "Autenticacion JWT"
Cohesion: 0.18
Nodes (12): jsonwebtoken, GET(), POST(), POST(), pgrest(), POST(), JWTPayload, RolJWT (+4 more)

### Community 7 - "Servidor WebSocket"
Cohesion: 0.18
Nodes (15): ref_http, pg, ws, broadcast(), clients, closeQuestion(), connect(), disconnectPg() (+7 more)

### Community 8 - "Triggers y Notify SQL"
Cohesion: 0.23
Nodes (14): actualizar_timestamp(), auto_cerrar_cuando_todos_respondan(), notify_cambio(), trg_auto_cerrar, trg_calcular_puntos, trg_notify_jugadores, trg_notify_preguntas, trg_notify_puntajes_retos (+6 more)

### Community 9 - "Control del Docente"
Cohesion: 0.27
Nodes (9): AdminSessionPage(), cargarJugadores(), cargarPreguntas(), cargarRespuestas(), cerrarPregunta(), crearSesion(), lanzarPregunta(), seleccionarSesion() (+1 more)

### Community 10 - "Dependencias Prod"
Cohesion: 0.22
Nodes (9): dependencies, jsonwebtoken, next, pg, react, react-dom, @types/jsonwebtoken, @types/ws (+1 more)

### Community 12 - "Puntos y Podio"
Cohesion: 0.47
Nodes (6): Anti-trampa de reloj: corrección si |now() - enviado_en| > 60s, Función calcular_puntos_respuesta, Función obtener_podium(p_sesion_id), Función obtener_respuestas_sesion(p_sesion_id), Orden de respuestas: enviado_en (cliente, ms) + secuencia BIGSERIAL, desempate (enviado_en, secuencia), Puntos por puesto: preguntas.puntos_por_puesto JSONB (20/10 grados 1-3, 50/30 grados 4-5)

### Community 13 - "Estilos y Layout"
Cohesion: 0.33
Nodes (4): src_app_globals, inter, metadata, poppins

### Community 14 - "Assets SVG"
Cohesion: 1.00
Nodes (3): file.svg — icono genérico de archivo (asset de plantilla), globe.svg — icono genérico de globo terráqueo (asset de plantilla), window.svg — icono genérico de ventana de navegador (asset de plantilla)

## Knowledge Gaps
- **87 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Config Next y Admin` to `Tooling y DevDeps`, `Estilos y Layout`, `Autenticacion JWT`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `react` connect `Config Next y Admin` to `Tooling y DevDeps`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `AdminSessionPage()` connect `Control del Docente` to `Config Next y Admin`, `Pantallas Estudiante`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Config Next y Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.10365853658536585 - nodes in this community are weakly interconnected._
- **Should `Arquitectura del Juego` be split into smaller, more focused modules?**
  _Cohesion score 0.07936507936507936 - nodes in this community are weakly interconnected._
- **Should `Tooling y DevDeps` be split into smaller, more focused modules?**
  _Cohesion score 0.058823529411764705 - nodes in this community are weakly interconnected._
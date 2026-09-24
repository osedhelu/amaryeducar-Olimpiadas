# Amar y Educar — Olimpiadas Matemáticas 2026

Monorepo de la plataforma y presentaciones del proyecto **Amar y Educar**.

## Estructura

| Carpeta                   | Qué es                                                               | Stack                    | Servicio Railway          |
| ------------------------- | -------------------------------------------------------------------- | ------------------------ | ------------------------- |
| `olimpiada-nextjs/`       | Plataforma tipo Kahoot (pantalla, panel docente, join y juego)       | Next.js 16 + Tailwind v4 | `olimpiadas-web`          |
| `backend/`                | API de juego (sesiones, respuestas, retos, podium) + WebSocket       | FastAPI + Postgres       | `olimpiadas-api`          |
| `amaryeducarDiapositiva/` | Presentación SPA "Click, Learn, Speak" (13 diapositivas gamificadas) | Vite + React 19          | `amaryeducar-diapositiva` |
| `sql/`                    | Esquema, seeds y migraciones (se aplican a mano con psql)            | PostgreSQL               | —                         |

Cada subproyecto se despliega de forma independiente: Railway usa el **root directory** de cada servicio y su propio `railway.toml`.

## Puesta en marcha

```bash
# Frontend Next
cd olimpiada-nextjs && npm install && npm run dev     # http://localhost:3000

# Backend FastAPI
cd backend && python -m venv .venv && . .venv/bin/activate && pip install -e . && uvicorn app.main:app --reload

# Diapositiva
cd amaryeducarDiapositiva && pnpm install && pnpm dev
```

Variable de entorno del frontend en `olimpiada-nextjs/.env.local`; las de BD/backend en `.env.local` (raíz). Ver `AGENTS.md` para el detalle de arquitectura y convenciones.

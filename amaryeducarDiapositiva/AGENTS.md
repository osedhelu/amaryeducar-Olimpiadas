# AGENTS.md

Presentación SPA gamificada **"Las TIC como Estrategia Pedagógica · Click, Learn, Speak"**: Vite 8 + React 19 + TypeScript, 13 diapositivas interactivas con XP, confeti y sonido. Todo el contenido vive en `src/App.tsx` (~2150 líneas). No hay git, ni tests, ni formatter.

## Comandos

- Gestor de paquetes: **pnpm** (`pnpm-lock.yaml`; no npm/yarn).
- `pnpm dev` — servidor Vite con HMR.
- `pnpm lint` — **oxlint** (`.oxlintrc.json`), no ESLint.
- `pnpm build` — `tsc -b && vite build`; el typecheck está aquí (no hay script separado).
- `pnpm preview` — sirve el build de `dist/`.
- No hay framework de tests.

## Entrada y estructura

- `index.html` (título + favicon → `/logo.png`) → `src/main.tsx` → `src/App.tsx` (componentes por slide + `App`).
- 13 slides: array `SLIDES` (icono, título, color) + `slideActual()` con `switch`; componentes `Slide1`…`Slide12` + `SlideLogo` (posición 7, "Logo y Lema"). El contador "de N" se deriva de `SLIDES.length`.
- Navegación: flechas ←/→, puntos de progreso y menú de miniaturas. Header con sonido, menú y botón de pantalla completa (`alternarPantallaCompleta`, Fullscreen API).
- Estilos: **Tailwind v4** (`@import "tailwindcss"` + `@theme` en `src/index.css`; **no** existe `tailwind.config`). CSS extra (keyframes) en `src/App.css`.
- Imágenes: `public/logo.png` (favicon, portada, header, `SlideLogo`). `src/assets/` aún tiene assets del template (sustituir, no conservar).
- Dependencias: `framer-motion` (animaciones), `lucide-react` (iconos).

## Gotchas del toolchain

- **React Compiler habilitado**: `vite.config.ts` usa `@rolldown/plugin-babel` con `reactCompilerPreset()`. No mutar state durante render; `react/rules-of-hooks` es error.
- TypeScript estricto (`tsconfig.app.json`): `verbatimModuleSyntax` (usar `import type`), `erasableSyntaxOnly` (sin enum/namespace), `allowImportingTsExtensions` (imports con extensión `.tsx`), `noUnusedLocals`/`noUnusedParameters`.
- oxlint `react/only-export-components`: **solo** `App` se exporta por defecto; slides y helpers son internos del módulo.
- Gamificación vía `fx` (`Fx`): `fx.award(clave, xp)` otorga XP **solo una vez por clave** (`fx.got`). Confeti con `fabricarConfeti()` (array local; no setState síncrono en effects). Sonido con Web Audio API (`playSound`).
- Paleta en `src/index.css` → `@theme`: `--color-primary: #bc2229` (rojo), `--color-gold: #eaa821`, más danger/success/cream/bg/ink/muted. Clases utilitarias: `bg-primary`, `text-gold`, etc.
- El agente no puede ver imágenes: no asumir el contenido visual de `logo.png`.
- Tras cada cambio, dejar `pnpm lint` y `pnpm build` en verde.

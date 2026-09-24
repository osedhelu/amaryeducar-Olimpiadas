# Las TIC como Estrategia Pedagógica · Click, Learn, Speak

Presentación SPA gamificada del proyecto de aula **"Las TIC como estrategia pedagógica para el aprendizaje del idioma inglés"** del Centro Educativo Amar y Educar (Polonuevo · IUB). Autora: Karen Cecilia Sandoval Pineda.

Una experiencia de 13 diapositivas interactivas con XP, confeti y sonido: cada diapositiva convierte su contenido (problema, marco teórico, metodología, resultados…) en minijuegos que el estudiante debe completar para sumar puntos. Está pensada para proyectarse en clase (pantalla completa + flechas del teclado) y para explorarse de forma autónoma en tablets u ordenadores.

## Stack

| Capa               | Tecnología                                                          |
| ------------------ | ------------------------------------------------------------------- |
| Framework          | React 19.2 + TypeScript 6 (estricto)                                |
| Build              | Vite 8                                                              |
| Animaciones        | `framer-motion` 13                                                  |
| Iconos             | `lucide-react`                                                      |
| Estilos            | Tailwind CSS v4 (CSS-first, sin `tailwind.config`)                  |
| Compilador         | React Compiler vía `@rolldown/plugin-babel` (`reactCompilerPreset`) |
| Linter             | oxlint (`.oxlintrc.json`) — no es ESLint                            |
| Gestor de paquetes | **pnpm**                                                            |

## Comandos

```bash
pnpm dev       # servidor de desarrollo con HMR
pnpm build     # tsc -b && vite build (el typecheck vive aquí)
pnpm preview   # sirve el build de dist/
pnpm lint      # oxlint
```

## Estructura del proyecto

```
├── index.html              # Título + favicon (/logo.png) + #root
├── vite.config.ts          # react() + babel(reactCompilerPreset) + tailwindcss()
├── .oxlintrc.json          # reglas react/rules-of-hooks, react/only-export-components
├── tsconfig.json|app|node  # TS estricto: verbatimModuleSyntax, erasableSyntaxOnly, …
├── public/
│   ├── logo.png            # Logo del proyecto (favicon, header, portada, SlideLogo)
│   ├── favicon.svg         # restos del template Vite
│   └── icons.svg
└── src/
    ├── main.tsx            # createRoot + <StrictMode> + import './index.css'
    ├── index.css           # @import "tailwindcss" + @theme (paleta)
    ├── App.css             # keyframes: confetti-fall, float-soft
    ├── App.tsx             # TODO el contenido (~2150 líneas)
    └── assets/             # sobras del template (hero.png, react.svg, vite.svg) → sustituir, no conservar
```

## Arquitectura

Todo el contenido y la lógica viven en `src/App.tsx`. El flujo es:

`index.html` → `src/main.tsx` → `App` (componente raíz: gamificación, header, navegación, footer, menú) → `slideActual()` (switch por índice) → componentes `Slide1`…`Slide12` + `SlideLogo`.

### Las 13 diapositivas

`SLIDES` (App.tsx:169) define el índice: icono, color y título de cada slide. El contador **"Diapositiva N de 13"** de `SlideShell` se deriva de `SLIDES.length`.

| #   | Diapositiva     | Componente  | Interacción                                                           |
| --- | --------------- | ----------- | --------------------------------------------------------------------- |
| 1   | Portada         | `Slide1`    | Botón "Iniciar Aventura" (+10 XP, confeti grande)                     |
| 2   | Planteamiento   | `Slide2`    | Interruptor "Tradicional vs Con TIC" (`modo`)                         |
| 3   | Objetivos       | `Slide3`    | 3 misiones acordeón que revela al tocarlas (+10 XP c/u)               |
| 4   | Justificación   | `Slide4`    | Botón que revela 3 tarjetas con contadores animados (`useCountUp`)    |
| 5   | Marco Teórico   | `Slide5`    | 4 tarjetas flip 3D (`FlipCard`)                                       |
| 6   | Marco Legal     | `Slide6`    | Línea de tiempo de 5 hitos seleccionables                             |
| 7   | Metodología     | `Slide7`    | 3 pestañas de técnicas (mixto, cuasi-experimental, 24 estudiantes…)   |
| 8   | Logo y Lema     | `SlideLogo` | Logo giratorio al tocarlo (+10 XP, confeti medio)                     |
| 9   | Identidad CLS   | `Slide8`    | Letras C-L-S desbloqueables con detalle animado                       |
| 10  | Plan de Trabajo | `Slide9`    | 3 fases con barra de progreso y confeti al completar la última        |
| 11  | Evidencias      | `Slide10`   | 4 pestañas (fotos, diario, plataformas, póster/stand)                 |
| 12  | Resultados      | `Slide11`   | Gráfico de barras Pre/Post (52%→21% bajo, 11%→31% alto, …)            |
| 13  | Cierre y Quiz   | `Slide12`   | Trivia final de 2 preguntas, estrellas y pantalla "¡Misión cumplida!" |

### Gamificación y efectos (`fx`, tipo `Fx`)

El componente `App` construye un objeto `fx` que se inyecta a cada slide:

- `fx.got(clave)` — ¿ya se recompensó esta clave?
- `fx.award(clave, xp)` — otorga XP **solo una vez por clave** (`game.rewarded`); muestra un toast "+N XP" en el header
- `fx.confetti(power)` — lanza confeti: `0` = 18 piezas, `1` = 60, `2` = 120 (limpieza automática a los 4.6 s, no usa setState síncrono en effects)
- `fx.play(tipo)` — sonido Web Audio API; tipos: `click`, `flip`, `success`, `win` (arpegio de 4 notas)

Recompensas (máximo **290 XP**):

| Clave                       | XP          |
| --------------------------- | ----------- |
| `inicio`                    | 10          |
| `modo-trad` / `modo-tic`    | 5           |
| `mision-0…2`                | 10 c/u (30) |
| `just-datos`                | 5           |
| `teoria-0…3`                | 5 c/u (20)  |
| `legal-0…4`                 | 5 c/u (25)  |
| `metodo-0…2`                | 5 c/u (15)  |
| `logo-tocado`               | 10          |
| `cls-0…2`                   | 10 c/u (30) |
| `fase-0…2`                  | 10 c/u (30) |
| `evidencia-0…3`             | 5 c/u (20)  |
| `res-mostrar` + `res-0…3`   | 25          |
| `quiz-0…1`                  | 20 c/u (40) |
| `final` (botón "Finalizar") | 25          |

### Navegación

- Teclado: `←` `→` para moverse, `Home`/`End` para saltar al inicio/fin (App.tsx:1852)
- Footer sticky: botones "Anterior"/"Siguiente" + puntos de progreso (dorado = actual, verde = visitado)
- Header sticky: logo, contador XP, toggle de sonido, pantalla completa (`alternarPantallaCompleta`, Fullscreen API) y botón de menú
- Menú modal "Índice de diapositivas": miniaturas con icono y color de cada slide
- Barra de progreso superior (width = `(step + 1) / SLIDES.length`)
- El botón "Finalizar" de la slide 13 premia `final` (+25 XP) con confeti

## Sistema de diseño

### Paleta (`src/index.css` → `@theme`)

| Token                             | Valor                 |
| --------------------------------- | --------------------- |
| `--color-primary`                 | `#bc2229` (rojo)      |
| `--color-primary-light` / `-dark` | `#d64348` / `#7e181c` |
| `--color-gold` / `-light`         | `#eaa821` / `#f6c95c` |
| `--color-danger` / `-success`     | `#a31d22` / `#6eb637` |
| `--color-cream` / `-bg`           | `#f5ebe1` / `#faf8f4` |
| `--color-ink` / `-muted`          | `#374151` / `#6b7280` |

Uso en clases: `bg-primary`, `text-gold`, `border-cream`, etc.

### Componentes UI compartidos

- `SlideShell` — contenedor con badge "Diapositiva N de 13" y pista de las flechas
- `SlideHeading` — icono en recuadro + título + subtítulo (mismo patrón en todo el deck)
- `StickerCard` — tarjeta tipo pegatina (borde crema, sombra, opcionalmente clickeable con efecto press)
- `DataChip` — chip de datos con fondo crema
- `ConfettiOverlay` — overlay fijo que renderiza las piezas con la animación `confetti-fall` (`src/App.css`)

### Animaciones CSS extra

- `confetti-fall` — las piezas caen girando del top al bottom
- `float-soft` — flotación suave (logo de portada, iconos CLIC/JUEGO/APRENDE/HABLA)

## Reglas del código y gotchas

- **React Compiler habilitado**: no mutar state durante render; `react/rules-of-hooks` es error.
- TypeScript estricto: `verbatimModuleSyntax` (usar `import type`), `erasableSyntaxOnly` (sin enums), `allowImportingTsExtensions` (imports con `.tsx`), `noUnusedLocals`/`noUnusedParameters`.
- oxlint `react/only-export-components`: **solo** `App` se exporta por defecto; slides y helpers son internos del módulo.
- Confeti: `fabricarConfeti()` genera un array local de piezas; el overlay se limpia con un `setTimeout` comparando el `id` del burst.
- Audio: `AudioContext` singleton vago del módulo (`audioCtx`), creado perezosamente en el primer sonido; `playSound` envuelve todo en try/catch.
- Contenido académico (datos, citas, hitos legales, resultados pre/post) está hardcodeado en constantes de datos en el mismo `App.tsx`: `TRADICIONAL`, `CON_TIC`, `MISIONES`, `DATOS_JUSTIFICACION`, `FLIP_CARDS`, `LINEA_LEGAL`, `METODOS`, `LEMA`, `LETRAS`, `FASES`, `EVIDENCIAS`, `GRUPOS`, `INDICADORES`, `QUIZ`.
- El estado de XP/recompensas vive solo en memoria (se pierde al recargar).
- `src/assets/` contiene restos del template Vite: no usarlos como referencia visual del proyecto.
- Tras cada cambio, dejar `pnpm lint` y `pnpm build` en verde (el build incluye el typecheck).

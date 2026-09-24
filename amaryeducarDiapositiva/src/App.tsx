import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Flame,
  FlaskConical,
  Fullscreen,
  Gamepad2,
  GraduationCap,
  Image,
  Keyboard,
  Landmark,
  Laptop,
  Layers,
  LayoutGrid,
  Lightbulb,
  Meh,
  Mic,
  MousePointerClick,
  Minimize2,
  Notebook,
  PartyPopper,
  Presentation,
  Quote,
  Repeat,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./App.css";

let audioCtx: AudioContext | null = null;

type SoundKind = "click" | "flip" | "success" | "win";

function beep(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function playSound(kind: SoundKind, enabled: boolean) {
  if (!enabled) return;
  try {
    const ctx = audioCtx ?? new AudioContext();
    audioCtx = ctx;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    if (kind === "click") beep(ctx, 520, t, 0.08, "square", 0.05);
    if (kind === "flip") beep(ctx, 720, t, 0.1, "triangle", 0.06);
    if (kind === "success") {
      beep(ctx, 660, t, 0.12, "triangle", 0.07);
      beep(ctx, 880, t + 0.1, 0.16, "triangle", 0.07);
    }
    if (kind === "win") {
      [523, 659, 784, 1046].forEach((f, i) =>
        beep(ctx, f, t + i * 0.12, 0.22, "triangle", 0.08),
      );
    }
  } catch {
    return;
  }
}

const CONFETTI_COLORS = [
  "#bc2229",
  "#d64348",
  "#eaa821",
  "#f6c95c",
  "#6eb637",
  "#7e181c",
];

type Piece = {
  id: string;
  left: number;
  delay: number;
  dur: number;
  color: string;
  size: number;
  round: boolean;
};

type Burst = {
  id: number;
  pieces: Piece[];
};

function fabricarConfeti(id: number, power: number): Piece[] {
  const n = power === 0 ? 18 : power === 1 ? 60 : 120;
  return Array.from({ length: n }, (_, i) => ({
    id: `${id}-${i}`,
    left: Math.random() * 100,
    delay: Math.random() * 0.7,
    dur: 2.2 + Math.random() * 1.8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 7 + Math.random() * 8,
    round: Math.random() < 0.3,
  }));
}

function ConfettiOverlay({ burst }: { burst: Burst | null }) {
  if (!burst) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {burst.pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute top-0"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.round ? p.size : p.size * 1.7,
            borderRadius: p.round ? "50%" : 2,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

type Fx = {
  got: (key: string) => boolean;
  award: (key: string, amount: number) => void;
  confetti: (power?: number) => void;
  play: (kind: SoundKind) => void;
};

const SLIDES = [
  { icon: Rocket, color: "bg-gold", title: "Portada" },
  { icon: Meh, color: "bg-danger", title: "Planteamiento" },
  { icon: Target, color: "bg-gold", title: "Objetivos" },
  { icon: Quote, color: "bg-primary-light", title: "Justificación" },
  { icon: BrainCircuit, color: "bg-success", title: "Marco Teórico" },
  { icon: CalendarDays, color: "bg-primary", title: "Marco Legal" },
  { icon: Layers, color: "bg-primary-light", title: "Metodología" },
  { icon: Image, color: "bg-danger", title: "Logo y Lema" },
  { icon: Lightbulb, color: "bg-gold", title: "Identidad CLS" },
  { icon: Gamepad2, color: "bg-success", title: "Plan de Trabajo" },
  { icon: Camera, color: "bg-danger", title: "Evidencias" },
  { icon: BarChart3, color: "bg-primary", title: "Resultados" },
  { icon: PartyPopper, color: "bg-gold", title: "Cierre y Quiz" },
] satisfies { icon: LucideIcon; color: string; title: string }[];

function SlideShell({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border-4 border-cream bg-cream px-4 py-1.5 text-xs font-extrabold tracking-wider text-primary-dark uppercase">
          <LayoutGrid size={13} /> Diapositiva {n + 1} de {SLIDES.length}
        </span>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-muted sm:flex">
          <Keyboard size={13} /> Usa las flechas ← →
        </span>
      </div>
      {children}
    </div>
  );
}

function SlideHeading({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconBg: string;
  title: ReactNode;
  subtitle?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-4 border-cream shadow-md ${iconBg} text-white`}
        >
          {icon}
        </span>
        <h2 className="text-2xl leading-tight font-extrabold text-primary md:text-3xl">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="mt-3 max-w-2xl font-medium text-muted">{subtitle}</p>
      )}
    </div>
  );
}

function StickerCard({
  className = "",
  children,
  onClick,
  style,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`rounded-2xl border-4 border-cream bg-white p-5 shadow-lg transition-all hover:shadow-xl ${
        onClick ? "cursor-pointer active:scale-[0.98]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function DataChip({ children }: { children: ReactNode }) {
  return (
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-bold text-primary-dark">
      {children}
    </span>
  );
}

function Slide1({ fx }: { fx: Fx }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4 text-center md:py-8">
      <motion.div
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        className="relative"
      >
        <div className="float-soft flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-gold bg-white shadow-xl">
          <img
            src="/logo.png"
            alt="Logo del proyecto"
            className="h-full w-full object-cover"
          />
        </div>
        <Sparkles size={26} className="absolute -top-2 -right-4 text-gold" />
        <Star
          size={20}
          className="absolute -bottom-1 -left-4 fill-gold-light stroke-gold"
        />
      </motion.div>
      <div className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-extrabold tracking-widest text-white uppercase">
          <GraduationCap size={14} /> Proyecto de aula · IUB · Centro Educativo
          Amar y Educar
        </p>
        <h1 className="mt-5 text-3xl leading-tight font-extrabold text-primary md:text-5xl">
          Las TIC como estrategia pedagógica para el aprendizaje del idioma
          inglés
        </h1>
        <p className="mt-4 text-lg font-extrabold text-gold md:text-2xl">
          “Click, Learn, Speak... ¡El inglés está a un click!”
        </p>
        <p className="mt-3 text-sm font-semibold text-muted">
          Autora: Karen Cecilia Sandoval Pineda · Polonuevo
        </p>
      </div>
      <button
        onClick={() => {
          fx.play("win");
          fx.confetti(2);
          fx.award("inicio", 10);
        }}
        className="group flex items-center gap-2 rounded-full bg-gold px-8 py-3.5 text-lg font-extrabold text-primary-dark shadow-xl transition-all hover:scale-105 hover:bg-gold-light active:scale-95"
      >
        <Rocket
          size={22}
          className="transition-transform group-hover:-translate-y-1"
        />
        ¡Iniciar Aventura!
      </button>
      <div className="mt-2 flex gap-3">
        {[
          { icon: Laptop, delay: "0s", label: "Clic" },
          { icon: Gamepad2, delay: "0.6s", label: "Juego" },
          { icon: BookOpen, delay: "1.2s", label: "Aprende" },
          { icon: Mic, delay: "1.8s", label: "Habla" },
        ].map((c) => (
          <div
            key={c.label}
            className="float-soft flex flex-col items-center gap-1 rounded-2xl border-4 border-cream bg-white px-4 py-3 shadow-md"
            style={{ animationDelay: c.delay }}
          >
            <c.icon size={22} className="text-primary" />
            <span className="text-[11px] font-extrabold text-primary-dark">
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Modo = "trad" | "tic";

const TRADICIONAL = [
  {
    icon: Presentation,
    title: "Clases expositivas",
    sub: "El docente habla, el estudiante solo escucha",
  },
  {
    icon: Repeat,
    title: "Repetición mecánica",
    sub: "Memorizar sin contexto ni significado",
  },
  {
    icon: Meh,
    title: "Aburrimiento",
    sub: "Falta de motivación y poca participación",
  },
  {
    icon: TrendingDown,
    title: "Bajo rendimiento",
    sub: "Dificultades en vocabulario, lectura y escucha",
  },
];

const CON_TIC = [
  {
    icon: MousePointerClick,
    title: "Interactividad",
    sub: "Aprendizaje activo, a un click de distancia",
  },
  {
    icon: UserCheck,
    title: "Autonomía",
    sub: "Cada estudiante avanza a su propio ritmo",
  },
  {
    icon: Gamepad2,
    title: "Juegos y retos",
    sub: "Kahoot! y Duolingo convierten el inglés en juego",
  },
  {
    icon: Flame,
    title: "Motivación",
    sub: "Puntos, estrellas y niveles que enganchan",
  },
];

function Slide2({ fx }: { fx: Fx }) {
  const [modo, setModo] = useState<Modo>("trad");
  const elegir = (m: Modo) => {
    if (m !== modo) {
      setModo(m);
      fx.play("click");
      fx.award(m === "trad" ? "modo-trad" : "modo-tic", 5);
    }
  };
  const esTic = modo === "tic";
  const lista = esTic ? CON_TIC : TRADICIONAL;
  return (
    <div>
      <SlideHeading
        icon={<Search size={24} />}
        iconBg="bg-danger"
        title="El problema que queremos resolver"
        subtitle="Muchos niños sienten miedo o aburrimiento frente al inglés. Compara las dos formas de enseñarlo:"
      />
      <div className="mx-auto flex w-full max-w-lg rounded-2xl border-4 border-cream bg-white p-1.5 shadow-md">
        <button
          onClick={() => elegir("trad")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all ${
            !esTic ? "bg-danger text-white shadow-md" : "text-danger"
          }`}
        >
          <X size={16} strokeWidth={3} /> Tradicional
        </button>
        <button
          onClick={() => elegir("tic")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition-all ${
            esTic ? "bg-success text-white shadow-md" : "text-success"
          }`}
        >
          <Rocket size={16} /> Con TIC
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={modo}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {lista.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
            >
              <StickerCard
                className={
                  esTic
                    ? "border-success bg-success/5 text-center"
                    : "border-danger bg-danger/5 text-center"
                }
              >
                <span
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full shadow-md ${
                    esTic ? "bg-success" : "bg-danger"
                  } text-white`}
                >
                  {esTic ? (
                    <CheckCircle2 size={24} />
                  ) : (
                    <X size={24} strokeWidth={3} />
                  )}
                </span>
                <h3 className="mt-3 font-extrabold text-primary-dark">
                  {c.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{c.sub}</p>
                <c.icon
                  size={20}
                  className={`mt-2 ${esTic ? "text-success" : "text-danger"}`}
                />
              </StickerCard>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      <p className="mt-6 text-center text-sm font-bold text-muted">
        {esTic
          ? "Con TIC, aprender inglés es una aventura. ¡Pruébalo y lo verás!"
          : "Así se sentía el aula... ¿Quieres ver qué cambia con las TIC? Activa el botón verde."}
      </p>
    </div>
  );
}

const MISIONES = [
  {
    icon: ClipboardCheck,
    title: "Diagnosticar el nivel de inglés",
    sub: "Aplicar un diagnóstico basado en los DBA para conocer el punto de partida de los grados 4° y 5°.",
  },
  {
    icon: Search,
    title: "Revisar herramientas TIC",
    sub: "Investigar y seleccionar plataformas y juegos educativos adecuados a la edad y al currículo.",
  },
  {
    icon: Rocket,
    title: "Diseñar la estrategia gamificada",
    sub: "Crear una ruta de juego con Kahoot!, Duolingo y retos para aprender inglés con motivación.",
  },
];

function Slide3({ fx }: { fx: Fx }) {
  const [abiertas, setAbiertas] = useState<number[]>([]);
  const toggle = (i: number) => {
    setAbiertas((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
    if (!fx.got(`mision-${i}`)) {
      fx.award(`mision-${i}`, 10);
      fx.play("success");
      fx.confetti(0);
    } else {
      fx.play("click");
    }
  };
  return (
    <div>
      <SlideHeading
        icon={<Target size={24} />}
        iconBg="bg-gold"
        title="Nuestras misiones"
        subtitle="Un objetivo general y tres misiones secretas. ¡Toca cada misión para revelarla y gana XP!"
      />
      <div className="mb-6 rounded-3xl border-4 border-gold bg-gold-light p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-white shadow-md">
            <Target size={26} />
          </span>
          <div>
            <p className="text-[11px] font-extrabold tracking-widest text-primary-dark/70 uppercase">
              Objetivo general
            </p>
            <p className="mt-1 text-lg font-extrabold text-primary-dark md:text-xl">
              Fortalecer el aprendizaje del idioma inglés en los grados 4° y 5°
              del Centro Educativo Amar y Educar integrando las TIC como
              estrategia pedagógica gamificada.
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {MISIONES.map((mision, i) => {
          const abierta = abiertas.includes(i);
          const hecha = fx.got(`mision-${i}`);
          return (
            <StickerCard
              key={mision.title}
              onClick={() => toggle(i)}
              className={abierta ? "border-gold bg-gold-light/40" : ""}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-md ${
                    hecha ? "bg-success" : "bg-gold"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold tracking-widest text-muted uppercase">
                    Misión {i + 1}
                  </p>
                  <h3 className="font-extrabold text-primary-dark">
                    {mision.title}
                  </h3>
                </div>
                <motion.span
                  animate={{ rotate: abierta ? 180 : 0 }}
                  className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-primary"
                >
                  <ChevronRight size={16} />
                </motion.span>
              </div>
              <AnimatePresence initial={false}>
                {abierta && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-xl bg-white p-3 shadow-inner">
                      <p className="text-sm text-ink">{mision.sub}</p>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-extrabold text-primary-dark">
                        <Star size={11} className="fill-primary-dark" /> +10 XP
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-3 flex items-center justify-between">
                <mision.icon
                  size={18}
                  className={hecha ? "text-success" : "text-gold"}
                />
                {hecha && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-success">
                    <CheckCircle2 size={12} /> Misión completada
                  </span>
                )}
              </div>
            </StickerCard>
          );
        })}
      </div>
    </div>
  );
}

type Stat = {
  value: number;
  decimals: number;
  suffix: string;
  label: string;
  src: string;
  icon: LucideIcon;
};

const DATOS_JUSTIFICACION: Stat[] = [
  {
    value: 77.18,
    decimals: 2,
    suffix: "%",
    label:
      "Relación positiva entre el uso de las TIC y el aprendizaje significativo",
    src: "Puicaño, 2024",
    icon: TrendingUp,
  },
  {
    value: 3,
    decimals: 0,
    suffix: "",
    label:
      "Destrezas con puntuaciones más altas con TIC: vocabulario, gramática y escucha",
    src: "Chan & Lo, 2024",
    icon: BookOpen,
  },
  {
    value: 24,
    decimals: 0,
    suffix: "",
    label: "Estudiantes de 4° y 5° que participan en esta aventura",
    src: "IUB · Amar y Educar",
    icon: Users,
  },
];

function useCountUp(
  target: number,
  run: boolean,
  decimals: number,
  duration = 1500,
) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const stepFn = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(stepFn);
    };
    raf = requestAnimationFrame(stepFn);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);
  if (decimals) return value.toFixed(decimals);
  return Math.round(value).toString();
}

function StatCard({ d, run }: { d: Stat; run: boolean }) {
  const texto = useCountUp(d.value, run, d.decimals);
  return (
    <StickerCard className="text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light/10 text-primary-light">
        <d.icon size={24} />
      </span>
      <p className="mt-3 text-4xl font-extrabold text-primary">
        {texto}
        <span className="text-2xl text-gold">{d.suffix}</span>
      </p>
      <p className="mt-2 text-sm font-semibold text-ink">{d.label}</p>
      <DataChip>{d.src}</DataChip>
    </StickerCard>
  );
}

function Slide4({ fx }: { fx: Fx }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div>
      <SlideHeading
        icon={<Quote size={24} />}
        iconBg="bg-primary-light"
        title="¿Por qué apostar por las TIC?"
        subtitle="La evidencia respalda el cambio. Toca el botón para revelar los datos con contadores animados."
      />
      <div className="flex justify-center">
        <button
          onClick={() => {
            setMostrar(true);
            fx.play("success");
            fx.confetti(0);
            fx.award("just-datos", 5);
          }}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-extrabold shadow-lg transition-all active:scale-95 ${
            mostrar
              ? "bg-success text-white"
              : "bg-gold text-primary-dark hover:scale-105"
          }`}
        >
          <Sparkles size={18} />
          {mostrar ? "¡Datos revelados!" : "🔍 Ver datos clave"}
        </button>
      </div>
      <AnimatePresence>
        {mostrar && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {DATOS_JUSTIFICACION.map((d, i) => (
              <motion.div
                key={d.src}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15 }}
              >
                <StatCard d={d} run={mostrar} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 rounded-3xl border-4 border-gold bg-primary-dark p-6 shadow-xl md:p-8"
      >
        <Quote size={34} className="text-gold" />
        <p className="mt-2 text-xl leading-snug font-extrabold text-white md:text-2xl">
          La tecnología <span className="text-gold">NO reemplaza</span> al
          docente, <span className="text-gold-light">LO POTENCIA.</span>
        </p>
      </motion.div>
    </div>
  );
}

const FLIP_CARDS = [
  {
    icon: BrainCircuit,
    tag: "Piaget · Operaciones Concretas",
    title: "Fundamentos cognitivos",
    back: "Los niños de 9 a 11 años piensan con operaciones concretas: aprenden mejor con experiencias tangibles y juegos, no con abstracciones.",
  },
  {
    icon: Gamepad2,
    tag: "Correa Padilla · Chan & Lo",
    title: "Gamificación",
    back: "Convertir el aprendizaje en juego (puntos, niveles, retos) aumenta la atención, la participación y el recuerdo del vocabulario.",
  },
  {
    icon: Laptop,
    tag: "Duolingo 🦉 + Kahoot! 💜",
    title: "Plataformas TIC",
    back: "Duolingo practica vocabulario y escucha con repetición espaciada; Kahoot! evalúa jugando en equipo con competencia sana.",
  },
  {
    icon: Lightbulb,
    tag: "Motivación y aprendizaje significativo",
    title: "El ingrediente secreto",
    back: "El inglés se aprende mejor cuando conecta con la vida del niño: juegos, retos y recompensas crean experiencias inolvidables.",
  },
];

function FlipCard({
  data,
  volteada,
  onFlip,
}: {
  data: (typeof FLIP_CARDS)[number];
  volteada: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="h-72" style={{ perspective: 1200 }}>
      <motion.div
        className="relative h-56 w-full [transform-style:preserve-3d]"
        animate={{ rotateY: volteada ? 180 : 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-cream bg-white p-4 text-center shadow-lg [backface-visibility:hidden]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-light text-primary shadow-md">
            <data.icon size={28} />
          </span>
          <h3 className="mt-1 font-extrabold text-primary-dark">
            {data.title}
          </h3>
          <p className="text-xs font-bold text-muted">{data.tag}</p>
          <span className="mt-1 rounded-full bg-cream px-3 py-1 text-[10px] font-extrabold tracking-wider text-primary uppercase">
            Toca para ver más
          </span>
        </div>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border-4 border-gold bg-primary p-4 text-center text-white shadow-xl [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <Sparkles size={22} className="text-gold-light" />
          <p className="text-sm leading-relaxed font-semibold">{data.back}</p>
        </div>
      </motion.div>
      <button
        onClick={onFlip}
        className="mt-3 w-full rounded-full bg-primary-light py-2 text-xs font-extrabold text-white uppercase transition hover:bg-primary active:scale-95"
      >
        {volteada ? "Volver al frente" : "Girar tarjeta"}
      </button>
    </div>
  );
}

function Slide5({ fx }: { fx: Fx }) {
  const [volteadas, setVolteadas] = useState<boolean[]>(
    FLIP_CARDS.map(() => false),
  );
  const flip = (i: number) => {
    setVolteadas((prev) => prev.map((f, j) => (j === i ? !f : f)));
    fx.play("flip");
    if (!fx.got(`teoria-${i}`)) fx.award(`teoria-${i}`, 5);
  };
  return (
    <div>
      <SlideHeading
        icon={<BrainCircuit size={24} />}
        iconBg="bg-success"
        title="Nuestro mapa teórico"
        subtitle="Cuatro tarjetas secretas que sostienen el proyecto. ¡Gíralas todas!"
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FLIP_CARDS.map((c, i) => (
          <FlipCard
            key={c.title}
            data={c}
            volteada={volteadas[i]}
            onFlip={() => flip(i)}
          />
        ))}
      </div>
    </div>
  );
}

const LINEA_LEGAL = [
  {
    year: "1991",
    icon: Landmark,
    title: "Constitución Política",
    sub: "Art. 67 · La educación es un derecho y un servicio público con formación para el desarrollo.",
  },
  {
    year: "1994",
    icon: BookOpen,
    title: "Ley 115 · Educación",
    sub: "Ley General de Educación: fines formativos y uso de medios y tecnologías en el aula.",
  },
  {
    year: "2009",
    icon: Laptop,
    title: "Ley 1341 · TIC",
    sub: "Define las TIC y promueve su acceso masivo para la educación y la competitividad.",
  },
  {
    year: "2016–2026",
    icon: CalendarDays,
    title: "Plan Decenal de Educación",
    sub: "Cierra brechas digitales y fortalece el bilingüismo en todas las regiones.",
  },
  {
    year: "MEN",
    icon: GraduationCap,
    title: "Derechos Básicos de Aprendizaje",
    sub: "Los DBA orientan lo mínimo que cada niño debe aprender en inglés por grado.",
  },
];

function Slide6({ fx }: { fx: Fx }) {
  const [seleccionado, setSeleccionado] = useState(0);
  const elegir = (i: number) => {
    setSeleccionado(i);
    fx.play("click");
    if (!fx.got(`legal-${i}`)) {
      fx.award(`legal-${i}`, 5);
      fx.confetti(0);
    }
  };
  const activo = LINEA_LEGAL[seleccionado];
  return (
    <div>
      <SlideHeading
        icon={<Landmark size={24} />}
        iconBg="bg-primary"
        title="El marco legal de nuestro viaje"
        subtitle="La legislación colombiana respalda la educación con TIC. Toca cada hito de la línea de tiempo."
      />
      <div className="flex gap-2 overflow-x-auto pb-4 md:justify-center">
        {LINEA_LEGAL.map((h, i) => {
          const esSel = seleccionado === i;
          return (
            <button
              key={h.year}
              onClick={() => elegir(i)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border-4 px-4 py-3 shadow-md transition-all active:scale-95 ${
                esSel
                  ? "border-gold bg-gold-light"
                  : "border-cream bg-white hover:shadow-lg"
              }`}
            >
              <h.icon
                size={20}
                className={esSel ? "text-primary" : "text-muted"}
              />
              <span
                className={`text-sm font-extrabold ${esSel ? "text-primary" : "text-primary-light"}`}
              >
                {h.year}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={seleccionado}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <StickerCard className="border-gold bg-gold-light/30">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <activo.icon size={24} />
              </span>
              <div>
                <p className="text-[11px] font-extrabold tracking-widest text-primary-dark/70 uppercase">
                  Hito {seleccionado + 1} de {LINEA_LEGAL.length}
                </p>
                <h3 className="mt-0.5 text-xl font-extrabold text-primary-dark">
                  {activo.year} · {activo.title}
                </h3>
                <p className="mt-1 font-medium text-ink">{activo.sub}</p>
              </div>
            </div>
          </StickerCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const METODOS = [
  {
    icon: ClipboardList,
    title: "Prueba diagnóstica",
    emoji: "📝",
    text: "Aplicación de un Pre-test y un Post-test con base en los DBA para medir el nivel inicial y el avance final en inglés.",
  },
  {
    icon: Notebook,
    title: "Observación",
    emoji: "🔍",
    text: "Registro en el diario de campo de la participación, motivación y actitud de los estudiantes durante cada sesión.",
  },
  {
    icon: FileText,
    title: "Revisión documental",
    emoji: "📚",
    text: "Análisis del currículo, los DBA y las planeaciones de aula para alinear la estrategia TIC con las metas institucionales.",
  },
];

function Slide7({ fx }: { fx: Fx }) {
  const [tab, setTab] = useState(0);
  const activo = METODOS[tab];
  return (
    <div>
      <SlideHeading
        icon={<Layers size={24} />}
        iconBg="bg-primary-light"
        title="¿Cómo lo investigamos?"
        subtitle="Un método mixto para entender el impacto de las TIC en el aula."
      />
      <div className="mb-5 flex flex-wrap gap-2">
        <DataChip>
          <Layers size={13} /> Enfoque Mixto
        </DataChip>
        <DataChip>
          <Search size={13} /> Descriptivo-Explicativo
        </DataChip>
        <DataChip>
          <FlaskConical size={13} /> Cuasi-experimental
        </DataChip>
        <DataChip>
          <Users size={13} /> 24 estudiantes (12 niños · 12 niñas)
        </DataChip>
        <DataChip>
          <Award size={13} /> Grados 4° y 5° · 9 a 11 años
        </DataChip>
      </div>
      <div className="flex w-full max-w-2xl gap-2 overflow-x-auto pb-2">
        {METODOS.map((m, i) => (
          <button
            key={m.title}
            onClick={() => {
              setTab(i);
              fx.play("click");
              if (!fx.got(`metodo-${i}`)) fx.award(`metodo-${i}`, 5);
            }}
            className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-extrabold transition-all active:scale-95 ${
              tab === i
                ? "bg-primary text-white shadow-lg"
                : "border-4 border-cream bg-white text-primary"
            }`}
          >
            <m.icon size={16} />
            {m.emoji} {m.title}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <StickerCard className="mt-4 border-primary/20 bg-primary-light/5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-md">
                <activo.icon size={24} />
              </span>
              <div>
                <h3 className="text-lg font-extrabold text-primary-dark">
                  Técnica {tab + 1}: {activo.title}
                </h3>
                <p className="mt-1 font-medium text-ink">{activo.text}</p>
              </div>
            </div>
          </StickerCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}


const LEMA = [
  { letra: "CLICK", desc: "Usar la tecnología para aprender", icon: MousePointerClick, color: "bg-gold" },
  { letra: "LEARN", desc: "Aprender mediante juegos", icon: Lightbulb, color: "bg-success" },
  { letra: "SPEAK", desc: "Comunicarse en inglés con confianza", icon: Mic, color: "bg-danger" },
]

function SlideLogo({ fx }: { fx: Fx }) {
  const [girando, setGirando] = useState(0);
  const tocarLogo = () => {
    fx.play("success");
    fx.confetti(1);
    if (!fx.got("logo-tocado")) fx.award("logo-tocado", 10);
    setGirando((g) => g + 1);
  };
  return (
    <div>
      <SlideHeading
        icon={<Sparkles size={24} />}
        iconBg="bg-danger"
        title="El logo y el lema del proyecto"
        subtitle="La identidad visual de nuestra aventura. ¡Toca el logo para celebrar!"
      />
      <div className="flex flex-col items-center gap-6">
        <motion.button
          onClick={tocarLogo}
          whileHover={{ scale: 1.05, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: girando * 360 }}
          transition={{ duration: 0.7, type: "spring" }}
          className="relative rounded-full border-4 border-cream shadow-2xl ring-4 ring-gold/40"
          aria-label="Tocar el logo del proyecto"
        >
          <img
            src="/logo.png"
            alt="Logo del proyecto"
            className="h-48 w-48 rounded-full object-cover md:h-56 md:w-56"
          />
          <span className="absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full bg-success text-white shadow-md">
            <CheckCircle2 size={22} />
          </span>
        </motion.button>
        <div className="text-center">
          <p className="text-sm font-extrabold tracking-widest text-muted uppercase">
            Lema del proyecto
          </p>
          <p className="mt-1 text-2xl font-extrabold text-primary md:text-3xl">
            "Click, Learn, Speak... ¡El inglés está a un click!"
          </p>
        </div>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {LEMA.map((l, i) => (
            <motion.div
              key={l.letra}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.15 }}
            >
              <StickerCard className={`border-4 text-center ${l.color} bg-white`}>
                <l.icon size={26} className={`mx-auto ${l.color === "bg-gold" ? "text-gold" : l.color === "bg-success" ? "text-success" : "text-danger"}`} />
                <p className="mt-2 text-xl font-extrabold tracking-widest text-primary-dark">
                  {l.letra}
                </p>
                <p className="text-xs font-semibold text-muted">{l.desc}</p>
              </StickerCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const LETRAS = [
  {
    letra: "C",
    word: "CLICK",
    icon: MousePointerClick,
    bg: "bg-gold",
    desc: "Usar la tecnología con un click y entrar al mundo digital del inglés.",
  },
  {
    letra: "L",
    word: "LEARN",
    icon: Lightbulb,
    bg: "bg-success",
    desc: "Aprender jugando: retos, juegos y puntos que hacen del inglés una aventura.",
  },
  {
    letra: "S",
    word: "SPEAK",
    icon: Mic,
    bg: "bg-danger",
    desc: "Hablar y comunicarse en inglés con confianza, sin miedo a equivocarse.",
  },
];

function Slide8({ fx }: { fx: Fx }) {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const elegir = (i: number) => {
    setSeleccionado(i);
    fx.play("success");
    if (!fx.got(`cls-${i}`)) {
      fx.award(`cls-${i}`, 10);
      fx.confetti(0);
    }
  };
  const activo = seleccionado !== null ? LETRAS[seleccionado] : null;
  return (
    <div>
      <SlideHeading
        icon={<Lightbulb size={24} />}
        iconBg="bg-gold"
        title="El secreto del proyecto: C-L-S"
        subtitle="Cada letra es un superpoder. ¡Tócalas todas para desbloquear el lema!"
      />
      <div className="flex justify-center gap-4">
        {LETRAS.map((l, i) => {
          const esSel = seleccionado === i;
          const hecha = fx.got(`cls-${i}`);
          return (
            <motion.button
              key={l.letra}
              onClick={() => elegir(i)}
              whileHover={{ y: -6, rotate: -2 }}
              whileTap={{ scale: 0.92 }}
              className={`relative flex h-28 w-28 flex-col items-center justify-center rounded-3xl border-4 border-cream shadow-xl transition md:h-36 md:w-36 ${
                esSel ? `${l.bg} scale-110 text-white` : "bg-white text-primary"
              }`}
            >
              <span className="text-5xl font-extrabold md:text-6xl">
                {l.letra}
              </span>
              <span className="mt-1 text-[10px] font-extrabold tracking-widest">
                {l.word}
              </span>
              {hecha && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-md"
                >
                  <CheckCircle2 size={18} />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {activo && (
          <motion.div
            key={seleccionado}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="mx-auto mt-8 flex max-w-xl flex-col items-center rounded-3xl border-4 border-gold bg-cream p-8 text-center shadow-2xl"
          >
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full ${activo.bg} text-white shadow-lg`}
            >
              <activo.icon size={40} />
            </span>
            <h3 className="mt-4 text-3xl font-extrabold tracking-widest text-primary-dark">
              {activo.word}
            </h3>
            <p className="mt-2 font-semibold text-ink">{activo.desc}</p>
            <p className="mt-4 text-xs font-extrabold tracking-widest text-muted uppercase">
              Click · Learn · Speak
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FASES = [
  {
    n: 1,
    title: "Diagnóstico",
    icon: Search,
    desc: "Aplicación del Pre-test: conocer el nivel inicial de inglés de los estudiantes según los DBA.",
  },
  {
    n: 2,
    title: "Implementación",
    icon: Gamepad2,
    desc: "Sesiones gamificadas en el aula con Kahoot! y Duolingo: juegos, retos y puntos por equipo.",
  },
  {
    n: 3,
    title: "Evaluación",
    icon: Trophy,
    desc: "Post-test y análisis comparativo: medir la evolución real del aprendizaje y la motivación.",
  },
];

function Slide9({ fx }: { fx: Fx }) {
  const [activa, setActiva] = useState(0);
  const elegir = (i: number) => {
    setActiva(i);
    fx.play("click");
    if (!fx.got(`fase-${i}`)) {
      fx.award(`fase-${i}`, 10);
      if (i === 2) {
        fx.play("success");
        fx.confetti(1);
      } else {
        fx.confetti(0);
      }
    }
  };
  return (
    <div>
      <SlideHeading
        icon={<Gamepad2 size={24} />}
        iconBg="bg-success"
        title="El plan de la misión"
        subtitle="Tres fases para transformar el aula. Toca cada fase para avanzar en la barra de progreso."
      />
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-1">
          {FASES.map((f, i) => (
            <div key={f.n} className="flex flex-1 items-center gap-1">
              <button
                onClick={() => elegir(i)}
                aria-label={`Fase ${f.n}: ${f.title}`}
                className={`h-4 w-4 shrink-0 rounded-full border-4 transition-all active:scale-90 ${
                  i <= activa
                    ? "border-success bg-success"
                    : "border-cream bg-white"
                }`}
              />
              {i < FASES.length - 1 && (
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: i < activa ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-right text-xs font-extrabold text-muted">
          Fase {activa + 1} de {FASES.length} ·{" "}
          {Math.round(((activa + 1) / FASES.length) * 100)}% completado
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FASES.map((f, i) => {
          const esActiva = activa === i;
          const hecha = i < activa || fx.got(`fase-${i}`);
          return (
            <StickerCard
              key={f.n}
              onClick={() => elegir(i)}
              className={`text-center ${
                esActiva
                  ? "scale-[1.03] border-success bg-success/10"
                  : hecha
                    ? "border-success/40"
                    : ""
              }`}
            >
              <span
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md transition ${
                  hecha ? "bg-success" : "bg-gold"
                }`}
              >
                {hecha && !esActiva ? (
                  <CheckCircle2 size={26} />
                ) : (
                  <f.icon size={26} />
                )}
              </span>
              <p className="mt-2 text-[10px] font-extrabold tracking-widest text-muted uppercase">
                Fase {f.n}
              </p>
              <h3 className="font-extrabold text-primary-dark">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.desc}</p>
            </StickerCard>
          );
        })}
      </div>
    </div>
  );
}

const EVIDENCIAS = [
  {
    icon: Camera,
    tab: "📸 Fotos del proceso",
    title: "El aula en acción",
    text: "Evidencia fotográfica de los estudiantes explorando Kahoot! y Duolingo: emoción, risas y trabajo en equipo.",
    grad: "from-primary-light to-primary",
  },
  {
    icon: Notebook,
    tab: "📔 Diario de campo",
    title: "Registros del diario",
    text: "Anotaciones de cada sesión: participación, reacciones, dificultades y logros de los niños día a día.",
    grad: "from-gold to-gold-light",
  },
  {
    icon: BarChart3,
    tab: "📊 Capturas de Kahoot! y Duolingo",
    title: "Plataformas en acción",
    text: "Capturas de los cuestionarios, niveles alcanzados y rachas de los estudiantes en ambas plataformas.",
    grad: "from-danger to-danger/70",
  },
  {
    icon: Presentation,
    tab: "🖼️ Póster y Stand",
    title: "Feria pedagógica",
    text: "Póster académico y stand interactivo para presentar el proyecto ante la comunidad educativa.",
    grad: "from-success to-success/70",
  },
];

function Slide10({ fx }: { fx: Fx }) {
  const [tab, setTab] = useState(0);
  const activo = EVIDENCIAS[tab];
  return (
    <div>
      <SlideHeading
        icon={<Camera size={24} />}
        iconBg="bg-danger"
        title="Evidencias de la aventura"
        subtitle="Todo lo que dejó el proyecto en el aula. Explora cada pestaña."
      />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {EVIDENCIAS.map((e, i) => (
          <button
            key={e.tab}
            onClick={() => {
              setTab(i);
              fx.play("click");
              if (!fx.got(`evidencia-${i}`)) fx.award(`evidencia-${i}`, 5);
            }}
            className={`shrink-0 rounded-2xl border-4 px-4 py-2 text-sm font-extrabold whitespace-nowrap transition-all active:scale-95 ${
              tab === i
                ? "border-gold bg-gold-light text-primary-dark shadow-lg"
                : "border-cream bg-white text-muted hover:text-primary"
            }`}
          >
            {e.tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div
              className={`flex min-h-56 flex-col items-center justify-center rounded-3xl bg-gradient-to-br p-8 text-center text-white shadow-xl ${activo.grad}`}
            >
              <activo.icon size={56} className="drop-shadow-lg" />
              <p className="mt-3 text-sm font-extrabold tracking-widest uppercase opacity-80">
                Material de evidencia
              </p>
              <p className="text-xs font-bold opacity-70">{activo.title}</p>
            </div>
            <StickerCard className="flex flex-col justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-primary">
                <activo.icon size={24} />
              </span>
              <h3 className="mt-3 text-xl font-extrabold text-primary-dark">
                {activo.title}
              </h3>
              <p className="mt-2 font-medium text-ink">{activo.text}</p>
              <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-extrabold text-white">
                <CheckCircle2 size={13} /> Evidencia registrada
              </span>
            </StickerCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const GRUPOS = [
  {
    name: "Bajo",
    pre: 52,
    post: 21,
    color: "bg-danger",
    detail:
      "El nivel bajo se redujo drásticamente: de 52% a 21% de los estudiantes.",
  },
  {
    name: "Medio",
    pre: 33,
    post: 38,
    color: "bg-gold",
    detail:
      "El nivel medio se consolidó y sirvió de puente hacia los escalones superiores.",
  },
  {
    name: "Alto",
    pre: 11,
    post: 31,
    color: "bg-success",
    detail:
      "El nivel alto creció tres veces en vocabulario, lectura y escucha.",
  },
  {
    name: "Superior",
    pre: 4,
    post: 10,
    color: "bg-primary-dark",
    detail: "Apareció un grupo superior que antes del proyecto no existía.",
  },
];

const INDICADORES = [
  { icon: Flame, label: "Motivación", value: "+90%" },
  { icon: BookOpen, label: "Vocabulario", value: "+85%" },
  { icon: Users, label: "Colaboración", value: "+95%" },
];

function Slide11({ fx }: { fx: Fx }) {
  const [mostrar, setMostrar] = useState(false);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  return (
    <div>
      <SlideHeading
        icon={<BarChart3 size={24} />}
        iconBg="bg-primary"
        title="¿Qué cambió en el aula?"
        subtitle="Comparación del nivel de inglés de los estudiantes antes (Pre) y después (Post) del proyecto."
      />
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => {
            setMostrar(true);
            fx.play("success");
            fx.confetti(0);
            fx.award("res-mostrar", 5);
          }}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-extrabold shadow-lg transition-all active:scale-95 ${
            mostrar
              ? "bg-success text-white"
              : "bg-gold text-primary-dark hover:scale-105"
          }`}
        >
          <TrendingUp size={18} />
          {mostrar ? "¡Evolución revelada!" : "🚀 Mostrar evolución"}
        </button>
      </div>
      <div className="flex items-end justify-center gap-3 pb-2 md:gap-5">
        {GRUPOS.map((g, i) => (
          <button
            key={g.name}
            onClick={() => {
              setSeleccionado(i === seleccionado ? null : i);
              fx.play("click");
              if (!fx.got(`res-${i}`)) fx.award(`res-${i}`, 5);
            }}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <span className="text-xs font-extrabold text-muted">
              {mostrar ? `Pre ${g.pre}%` : "···"} →{" "}
              {mostrar ? `${g.post}%` : "···"}
            </span>
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              <div className="flex w-8 flex-col items-center md:w-10">
                <motion.div
                  className="w-full rounded-t-lg bg-muted/25"
                  initial={{ height: 0 }}
                  animate={{ height: mostrar ? g.pre * 1.8 : 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                />
                <span className="mt-1 text-[10px] font-extrabold text-muted">
                  Pre
                </span>
              </div>
              <div className="flex w-8 flex-col items-center md:w-10">
                <motion.div
                  className={`w-full rounded-t-lg shadow-md ${g.color} ${seleccionado === i ? "opacity-100" : "opacity-75"}`}
                  initial={{ height: 0 }}
                  animate={{ height: mostrar ? g.post * 1.8 : 0 }}
                  transition={{ delay: i * 0.1 + 0.15, duration: 0.6 }}
                />
                <span
                  className={`mt-1 text-[10px] font-extrabold ${seleccionado === i ? "text-primary" : "text-muted"}`}
                >
                  Post
                </span>
              </div>
            </div>
            <span className="rounded-full bg-cream px-3 py-0.5 text-xs font-extrabold text-primary-dark">
              {g.name}
            </span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {seleccionado !== null && (
          <motion.div
            key={seleccionado}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-4 max-w-md rounded-2xl border-4 border-gold bg-gold-light/40 p-4 text-center"
          >
            <p className="font-bold text-primary-dark">
              {GRUPOS[seleccionado].detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {mostrar && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          {INDICADORES.map((ind, i) => (
            <motion.div
              key={ind.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.12 }}
            >
              <StickerCard className="text-center">
                <ind.icon size={22} className="mx-auto text-gold" />
                <p className="mt-1 text-2xl font-extrabold text-success">
                  {ind.value}
                </p>
                <p className="text-xs font-extrabold text-primary-dark uppercase">
                  {ind.label}
                </p>
              </StickerCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

const QUIZ = [
  {
    q: "¿Qué herramienta TIC usamos para aprender inglés jugando en el aula?",
    options: [
      "Duolingo 🦉",
      "Calculadora",
      "Diccionario en papel",
      "Regla y compás",
    ],
    correct: 0,
  },
  {
    q: "¿Las TIC reemplazan al docente en el aula?",
    options: [
      "Sí, lo reemplazan",
      "No, lo potencian 💪",
      "Solo en vacaciones",
      "Jamás se usan",
    ],
    correct: 1,
  },
];

function Slide12({ fx, totalXp }: { fx: Fx; totalXp: number }) {
  const [qIndex, setQIndex] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [estrellas, setEstrellas] = useState(0);
  const [final, setFinal] = useState(false);

  const responder = (i: number) => {
    if (elegida !== null) return;
    setElegida(i);
    if (i === QUIZ[qIndex].correct) {
      fx.play("win");
      fx.confetti(1);
      fx.award(`quiz-${qIndex}`, 20);
      setAciertos((c) => c + 1);
      setEstrellas((s) => s + 1);
    } else {
      fx.play("click");
    }
  };

  const siguiente = () => {
    const ultima = qIndex === QUIZ.length - 1;
    if (!ultima) {
      setElegida(null);
      setQIndex((q) => q + 1);
      return;
    }
    setFinal(true);
    if (aciertos === QUIZ.length) {
      fx.play("win");
      fx.confetti(2);
    } else {
      fx.confetti(1);
    }
  };

  if (final) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-6 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 12 }}
          className="float-soft flex h-28 w-28 items-center justify-center rounded-full border-4 border-gold bg-gold-light shadow-2xl"
        >
          <Trophy size={60} className="text-gold" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-extrabold text-primary md:text-4xl">
            ¡Misión cumplida! 🎉
          </h2>
          <p className="mt-2 max-w-xl font-semibold text-muted">
            Las TIC y la gamificación transforman la motivación y hacen del
            inglés una experiencia divertida para todos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + i * 0.15 }}
            >
              <Star
                size={40}
                className={
                  i < estrellas
                    ? "fill-gold-light stroke-gold"
                    : "text-muted/30"
                }
              />
            </motion.span>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <span className="rounded-full bg-gold px-5 py-2 font-extrabold text-primary-dark shadow-lg">
            ⭐ XP total: {totalXp}
          </span>
          <span className="rounded-full bg-success px-5 py-2 font-extrabold text-white shadow-lg">
            ✅ {aciertos}/2 aciertos
          </span>
        </div>
        <button
          onClick={() => {
            fx.play("win");
            fx.confetti(2);
          }}
          className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-extrabold text-primary-dark shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          <PartyPopper size={20} /> ¡Celebrar otra vez!
        </button>
      </div>
    );
  }

  const quiz = QUIZ[qIndex];
  return (
    <div>
      <SlideHeading
        icon={<Lightbulb size={24} />}
        iconBg="bg-gold"
        title="La gran conclusión"
        subtitle="Ya lo dijimos en el póster: la tecnología no reemplaza al docente, lo potencia."
      />
      <div className="mb-6 rounded-3xl border-4 border-gold bg-primary p-6 text-center shadow-xl">
        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-primary-dark shadow-md">
          <Trophy size={24} />
        </span>
        <p className="text-lg font-extrabold text-white md:text-xl">
          Las TIC y la gamificación transforman la motivación y hacen del inglés
          una experiencia divertida.
        </p>
      </div>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold tracking-widest text-muted uppercase">
            Trivia final · Pregunta {qIndex + 1} de 2
          </h3>
          <div className="flex gap-1">
            {[0, 1].map((i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < estrellas
                    ? "fill-gold-light stroke-gold"
                    : "text-muted/30"
                }
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={qIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <StickerCard className="mt-3 border-gold bg-white">
              <p className="text-lg font-extrabold text-primary-dark">
                {quiz.q}
              </p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quiz.options.map((opcion, i) => {
                  const esElegida = elegida === i;
                  const esCorrecta = i === quiz.correct;
                  let cls =
                    "border-cream bg-bg text-ink hover:border-gold hover:bg-gold-light/30";
                  if (elegida !== null) {
                    if (esCorrecta)
                      cls = "border-success bg-success text-white";
                    else if (esElegida)
                      cls = "border-danger bg-danger text-white";
                    else cls = "border-cream bg-bg text-muted opacity-50";
                  }
                  return (
                    <motion.button
                      key={opcion}
                      whileTap={elegida === null ? { scale: 0.95 } : {}}
                      onClick={() => responder(i)}
                      className={`flex items-center gap-2 rounded-2xl border-4 px-4 py-3 text-left font-bold transition-all ${cls}`}
                    >
                      {elegida !== null && esCorrecta && (
                        <CheckCircle2 size={18} />
                      )}
                      {elegida !== null && esElegida && !esCorrecta && (
                        <X size={18} />
                      )}
                      {opcion}
                    </motion.button>
                  );
                })}
              </div>
              {elegida !== null && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={siguiente}
                    className="flex items-center gap-2 rounded-full bg-gold px-5 py-2 font-extrabold text-primary-dark shadow-md transition hover:bg-gold-light active:scale-95"
                  >
                    {qIndex === 0 ? "Siguiente pregunta" : "Ver mi resultado"}{" "}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </StickerCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState<{
    xp: number;
    rewarded: Record<string, boolean>;
  }>({
    xp: 0,
    rewarded: {},
  });
  const [step, setStep] = useState(0);
  const [sonido, setSonido] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    const sincronizar = () => setPantallaCompleta(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  const alternarPantallaCompleta = () => {
    fx.play("click");
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight")
        setStep((s) => Math.min(SLIDES.length - 1, s + 1));
      if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      if (e.key === "Home") setStep(0);
      if (e.key === "End") setStep(SLIDES.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const fx: Fx = {
    got: (key) => !!game.rewarded[key],
    award: (key, amount) => {
      if (game.rewarded[key]) return;
      setGame((prev) =>
        prev.rewarded[key]
          ? prev
          : {
              xp: prev.xp + amount,
              rewarded: { ...prev.rewarded, [key]: true },
            },
      );
      setToast({ id: Date.now(), text: `+${amount} XP` });
    },
    confetti: (power = 1) => {
      const id = Date.now();
      setBurst({ id, pieces: fabricarConfeti(id, power) });
      window.setTimeout(
        () => setBurst((b) => (b && b.id === id ? null : b)),
        4600,
      );
    },
    play: (kind) => playSound(kind, sonido),
  };

  const irAdelante = () => {
    if (step < SLIDES.length - 1) {
      fx.play("click");
      setStep((s) => s + 1);
    } else {
      fx.play("win");
      fx.confetti(2);
      fx.award("final", 25);
    }
  };

  const irAtras = () => {
    if (step === 0) return;
    fx.play("click");
    setStep((s) => s - 1);
  };

  const slideActual = () => {
    switch (step) {
      case 0:
        return <Slide1 fx={fx} />;
      case 1:
        return <Slide2 fx={fx} />;
      case 2:
        return <Slide3 fx={fx} />;
      case 3:
        return <Slide4 fx={fx} />;
      case 4:
        return <Slide5 fx={fx} />;
      case 5:
        return <Slide6 fx={fx} />;
      case 6:
        return <Slide7 fx={fx} />;
      case 7:
        return <SlideLogo fx={fx} />;
      case 8:
        return <Slide8 fx={fx} />;
      case 9:
        return <Slide9 fx={fx} />;
      case 10:
        return <Slide10 fx={fx} />;
      case 11:
        return <Slide11 fx={fx} />;
      default:
        return <Slide12 fx={fx} totalXp={game.xp} />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <ConfettiOverlay burst={burst} />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -24, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.8 }}
            className="fixed top-20 left-1/2 z-50 -translate-x-1/2"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-dark px-5 py-2 font-extrabold text-gold-light shadow-2xl ring-4 ring-gold/40">
              <Star size={16} className="fill-gold-light" /> {toast.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-primary text-white shadow-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md ring-2 ring-gold">
              <img
                src="/logo.png"
                alt="Logo del proyecto"
                className="h-full w-full object-cover"
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm leading-tight font-extrabold md:text-base">
                Las TIC para el aprendizaje del inglés
              </p>
              <p className="hidden text-[11px] font-bold text-gold-light sm:block">
                Click · Learn · Speak · Proyecto de aula
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-gold px-3.5 py-1.5 text-sm font-extrabold text-primary-dark shadow-md">
              <Star size={15} className="fill-primary-dark" /> XP: {game.xp}
            </span>
            <button
              onClick={() => setSonido((s) => !s)}
              aria-label={sonido ? "Silenciar sonido" : "Activar sonido"}
              className="rounded-full bg-primary-light p-2 transition hover:bg-primary-dark active:scale-90"
            >
              {sonido ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button
              onClick={alternarPantallaCompleta}
              aria-label={
                pantallaCompleta
                  ? "Salir de pantalla completa"
                  : "Ver en pantalla completa"
              }
              className="rounded-full bg-primary-light p-2 transition hover:bg-primary-dark active:scale-90"
            >
              {pantallaCompleta ? (
                <Minimize2 size={17} />
              ) : (
                <Fullscreen size={17} />
              )}
            </button>
            <button
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú de diapositivas"
              className="rounded-full bg-primary-light p-2 transition hover:bg-primary-dark active:scale-90"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>
        <div className="h-2 w-full bg-primary-dark">
          <div
            className="h-full rounded-r-full bg-success transition-all duration-500"
            style={{ width: `${((step + 1) / SLIDES.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            <SlideShell n={step}>{slideActual()}</SlideShell>
          </motion.section>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 z-40 border-t-4 border-cream bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button
            onClick={irAtras}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-full bg-primary-light px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition hover:bg-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-primary-light"
          >
            <ChevronLeft size={18} /> Anterior
          </button>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                onClick={() => {
                  setStep(i);
                  fx.play("click");
                }}
                aria-label={`Ir a la diapositiva ${i + 1}: ${s.title}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === step
                    ? "w-8 bg-gold"
                    : i < step
                      ? "w-2.5 bg-success"
                      : "w-2.5 bg-primary-light/30"
                }`}
              />
            ))}
          </div>
          <button
            onClick={irAdelante}
            className={`flex items-center gap-1 rounded-full px-5 py-2.5 text-sm font-extrabold shadow-md transition hover:scale-105 active:scale-95 ${
              step === SLIDES.length - 1
                ? "bg-gold text-primary-dark"
                : "bg-success text-white"
            }`}
          >
            {step === SLIDES.length - 1 ? (
              <>
                <Trophy size={18} /> Finalizar
              </>
            ) : (
              <>
                Siguiente <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </footer>

      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuAbierto(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-3xl border-4 border-gold bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-primary">
                  Índice de diapositivas
                </h3>
                <button
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                  className="rounded-full bg-cream p-2 text-primary transition hover:bg-gold-light active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.title}
                    onClick={() => {
                      setStep(i);
                      setMenuAbierto(false);
                      fx.play("click");
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-4 p-4 transition-all active:scale-95 ${
                      i === step
                        ? "border-gold bg-gold-light"
                        : "border-cream bg-bg hover:shadow-md"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${s.color} text-white shadow-md`}
                    >
                      <s.icon size={18} />
                    </span>
                    <span className="text-center text-xs font-extrabold text-primary-dark">
                      {i + 1}. {s.title}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

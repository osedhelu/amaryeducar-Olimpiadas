"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  useParametros,
  tieneRetos,
  gradosHabilitados,
  mostrarDuelos,
  mostrarEnfrentamiento,
  vidasHabilitadas,
} from "@/lib/parametros";
import { useWebSocket } from "@/hooks/useWebSocket";
import ColegiosPanel from "@/components/admin/ColegiosPanel";
import AlumnosPanel from "@/components/admin/AlumnosPanel";
import EnfrentamientoPanel from "@/components/admin/EnfrentamientoPanel";
import DuelosPanel from "@/components/admin/DuelosPanel";
import ParametrosPanel from "@/components/admin/ParametrosPanel";
import RetosPanel from "@/components/admin/RetosPanel";
import type {
  Colegio,
  GanadorRonda,
  Grado,
  InfoRondas,
  SesionJuego,
  Pregunta,
  Jugador,
  PodiumEntry,
  PuntajeReto,
  Respuesta,
  Reto,
  EventoWS,
  TablaColegio,
  EstadoVida,
} from "@/types/game";

type Vista =
  | "menu"
  | "control"
  | "preguntas"
  | "retos"
  | "podium"
  | "colegios"
  | "alumnos"
  | "enfrentamiento"
  | "duelos"
  | "parametros";

export default function AdminSessionPage() {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>("menu");
  const [grados, setGrados] = useState<Grado[]>([]);
  const [sesiones, setSesiones] = useState<(SesionJuego & { grado?: Grado })[]>(
    [],
  );
  const [sesionActiva, setSesionActiva] = useState<SesionJuego | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestasPregunta, setRespuestasPregunta] = useState<Respuesta[]>([]);
  const [respuestasTodas, setRespuestasTodas] = useState<Respuesta[]>([]);
  const [podium, setPodium] = useState<PodiumEntry[]>([]);
  const [podiumReto, setPodiumReto] = useState<PuntajeReto[] | null>(null);
  const [tablaColegios, setTablaColegios] = useState<TablaColegio[]>([]);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [nuevoPin, setNuevoPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [verificando, setVerificando] = useState(true);
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [rondas, setRondas] = useState<InfoRondas | null>(null);
  const [resultadosAbierto, setResultadosAbierto] = useState(false);
  const [rondaTab, setRondaTab] = useState(1);
  const [ganadorRonda, setGanadorRonda] = useState<GanadorRonda | null>(null);
  const [vidasEstado, setVidasEstado] = useState<EstadoVida[]>([]);

  const parametros = useParametros();
  const retosActivos = tieneRetos(parametros);
  const vidasActivas = vidasHabilitadas(parametros);
  const gradosSet = gradosHabilitados(parametros);
  const verDuelos = mostrarDuelos(parametros);
  const verEnfrentamiento = mostrarEnfrentamiento(parametros);
  const gradosVisibles = grados.filter((g) => gradosSet.has(g.orden));

  const { lastEvent } = useWebSocket(sesionActiva?.id ?? null, "admin");

  // Navegación entre vistas del panel con historial del navegador: cada cambio
  // de vista empuja una entrada para que "atrás" recorra las vistas del panel
  // en vez de salir al login.
  const cambiarVista = useCallback(
    (nueva: Vista, sesionId: string | null = null) => {
      if (typeof window !== "undefined") {
        const base =
          (window.history.state as Record<string, unknown> | null) ?? {};
        window.history.pushState({ ...base, vista: nueva, sesionId }, "");
      }
      setVista(nueva);
      if (nueva === "menu") setSesionActiva(null);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    },
    [],
  );

  const cargarDatos = useCallback(async () => {
    const g = await api.grados();
    setGrados(g);
    const s = await api.sesiones();
    const sesionesConGrado = s.map((ses) => ({
      ...ses,
      grado: g.find((gr) => gr.id === ses.grado_id),
    }));
    setSesiones(sesionesConGrado);
    api
      .colegios()
      .then(setColegios)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { esTokenDocente } = await import("@/lib/session");
      if (!esTokenDocente()) {
        router.replace("/admin");
        return;
      }
      if (!activo) return;
      cargarDatos();
      setVerificando(false);
    })();
    return () => {
      activo = false;
    };
  }, [cargarDatos, router]);

  // Al retroceder/avanzar en el navegador, restaura la vista (y la sesión)
  // guardada en la entrada del historial en lugar de salir del panel.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const base = (window.history.state as Record<string, unknown> | null) ?? {};
    window.history.replaceState({ ...base, vista: "menu", sesionId: null }, "");

    const onPop = (event: PopStateEvent) => {
      const state = event.state as {
        vista?: Vista;
        sesionId?: string | null;
      } | null;
      const nueva: Vista = state?.vista ?? "menu";
      setVista(nueva);

      if (nueva === "menu") {
        setSesionActiva(null);
        return;
      }

      const id = state?.sesionId;
      if (!id) return;

      api
        .sesion(id)
        .then((s) => {
          setSesionActiva(s);
          api
            .jugadores(s.id)
            .then(setJugadores)
            .catch(() => {});
          api
            .preguntasSesion(s.id)
            .then(setPreguntas)
            .catch(() => {});
          if (s.pregunta_activa_id) {
            api
              .respuestasSesion(s.id, s.pregunta_activa_id)
              .then(setRespuestasPregunta)
              .catch(() => {});
          }
          if (nueva === "podium") {
            api
              .podium(s.id)
              .then(setPodium)
              .catch(() => {});
            api
              .tablaGrado(s.grado_id)
              .then(setTablaColegios)
              .catch(() => {});
          }
        })
        .catch(() => {});
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!lastEvent || !sesionActiva) return;
    const ev = lastEvent as EventoWS;

    if (ev.tipo === "jugador_unido" && ev.data.sesion_id === sesionActiva.id) {
      setJugadores((prev) =>
        prev.some((j) => j.id === ev.data.id) ? prev : [...prev, ev.data],
      );
    }

    if (ev.tipo === "jugador_cambio" && ev.data.sesion_id === sesionActiva.id) {
      setJugadores((prev) =>
        prev.map((j) => (j.id === ev.data.id ? ev.data : j)),
      );
    }

    if (ev.tipo === "vidas_cambio") {
      setVidasEstado((prev) => {
        const sinEse = prev.filter((v) => v.jugador_id !== ev.data.jugador_id);
        return [...sinEse, ev.data].sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        );
      });
    }

    if (ev.tipo === "sesion_cambio" && ev.data.id === sesionActiva.id) {
      setSesionActiva(ev.data);
      if (ev.data.pregunta_activa_id) {
        cargarRespuestas(ev.data.pregunta_activa_id);
      }
    }

    if (
      ev.tipo === "respuesta_recibida" &&
      ev.data.pregunta_id === sesionActiva.pregunta_activa_id
    ) {
      setRespuestasPregunta((prev) => {
        if (prev.some((r) => r.id === ev.data.id)) return prev;
        return [...prev, ev.data];
      });
    }
  }, [lastEvent, sesionActiva]);

  // Reconcilia TODO desde la BD (sesión, jugadores, respuestas y, opcionalmente,
  // preguntas). Así el panel se autocorrige aunque se pierda un evento WebSocket.
  const cargarEstadoControl = useCallback(
    async (id: string, conPreguntas = true) => {
      try {
        const [s, js, todas, vs] = await Promise.all([
          api.sesion(id),
          api.jugadores(id),
          api.respuestasSesion(id),
          api.vidasSesion(id).catch(() => [] as EstadoVida[]),
        ]);
        setSesionActiva(s);
        setJugadores(js);
        setVidasEstado(vs);
        setRespuestasTodas(todas);
        setRespuestasPregunta(
          s.pregunta_activa_id
            ? todas.filter((r) => r.pregunta_id === s.pregunta_activa_id)
            : [],
        );
        if (conPreguntas) {
          const [ps, info] = await Promise.all([
            api.preguntasSesion(id),
            api.infoRondas(id),
          ]);
          setPreguntas(ps);
          setRondas(info);
        }
      } catch {
        /* mantener estado actual */
      }
    },
    [],
  );

  const recargarTodo = useCallback(
    async (conPreguntas = true) => {
      const id = sesionActiva?.id;
      if (id) await cargarEstadoControl(id, conPreguntas);
    },
    [sesionActiva?.id, cargarEstadoControl],
  );

  async function continuarRonda() {
    if (!sesionActiva) return;
    setLoading(true);
    try {
      const info = await api.nuevaRonda(sesionActiva.id);
      setRondas(info);
      setRondaTab(info.ronda_actual);
      setGanadorRonda(null);
      await cargarEstadoControl(sesionActiva.id, true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo crear la ronda");
    } finally {
      setLoading(false);
    }
  }

  async function mostrarGanadorRonda() {
    if (!sesionActiva) return;
    const ronda = rondas?.ronda_actual ?? 1;
    try {
      const g = await api.mostrarGanador(sesionActiva.id, ronda);
      setGanadorRonda(g);
      await cargarEstadoControl(sesionActiva.id, false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo mostrar");
    }
  }

  async function ocultarGanadorRonda() {
    if (!sesionActiva) return;
    try {
      await api.ocultarGanador(sesionActiva.id);
      setGanadorRonda(null);
      await cargarEstadoControl(sesionActiva.id, false);
    } catch {
      /* ignorar */
    }
  }

  useEffect(() => {
    if (!lastEvent || !sesionActiva) return;
    const ev = lastEvent as EventoWS;
    if (
      ev.tipo === "respuesta_recibida" ||
      ev.tipo === "resultado_pregunta" ||
      (ev.tipo === "sesion_cambio" && ev.data.id === sesionActiva.id)
    ) {
      const t = setTimeout(() => recargarTodo(false), 600);
      return () => clearTimeout(t);
    }
  }, [lastEvent, sesionActiva, recargarTodo]);

  // Mientras se está controlando una sala, reconciliar cada 3s (estado incluido)
  // por si el WebSocket se queda desconectado o pierde eventos.
  useEffect(() => {
    if (vista !== "control" || !sesionActiva?.id) return;
    const interval = setInterval(() => recargarTodo(false), 3000);
    return () => clearInterval(interval);
  }, [vista, sesionActiva?.id, recargarTodo]);

  async function crearSesion(gradoId: string) {
    setLoading(true);
    try {
      const nueva = await api.crearSesion(gradoId);
      setNuevoPin(nueva.pin);
      await cargarDatos();
      setSesionActiva(nueva);
      cambiarVista("control", nueva.id);
      cargarEstadoControl(nueva.id, true);
    } finally {
      setLoading(false);
    }
  }

  async function cargarRespuestas(preguntaId: string) {
    if (!sesionActiva) return;
    const r = await api.respuestasSesion(sesionActiva.id, preguntaId);
    setRespuestasPregunta(r);
  }

  async function seleccionarSesion(s: SesionJuego) {
    setSesionActiva(s);
    cambiarVista("control", s.id);
    cargarEstadoControl(s.id, true);
  }

  function toggleSeleccion(id: string) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleTodas() {
    setSeleccionadas((prev) =>
      prev.length === sesiones.length ? [] : sesiones.map((s) => s.id),
    );
  }

  function limpiarSesionActivaSiIncluida(ids: string[]) {
    if (sesionActiva && ids.includes(sesionActiva.id)) {
      setSesionActiva(null);
      setJugadores([]);
      setPreguntas([]);
      setRespuestasPregunta([]);
      setRespuestasTodas([]);
      setPodium([]);
      cambiarVista("menu");
    }
  }

  async function eliminarSeleccionadas() {
    if (seleccionadas.length === 0) return;
    const confirmar = window.confirm(
      `¿Eliminar ${seleccionadas.length} sesión(es)? Se borran sus jugadores, respuestas, puntajes y preguntas asignadas. No se puede deshacer.`,
    );
    if (!confirmar) return;
    setLoading(true);
    try {
      await api.eliminarSesiones(seleccionadas);
      limpiarSesionActivaSiIncluida(seleccionadas);
      setSeleccionadas([]);
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudieron eliminar");
    } finally {
      setLoading(false);
    }
  }

  async function eliminarUna(id: string) {
    const s = sesiones.find((x) => x.id === id);
    const confirmar = window.confirm(
      `¿Eliminar la sesión de ${s?.grado?.nombre ?? "—"} (PIN ${s?.pin ?? ""})? Se borran jugadores, respuestas y puntajes.`,
    );
    if (!confirmar) return;
    setLoading(true);
    try {
      await api.eliminarSesion(id);
      limpiarSesionActivaSiIncluida([id]);
      setSeleccionadas((prev) => prev.filter((x) => x !== id));
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  }

  async function lanzarPregunta(p: Pregunta) {
    if (!sesionActiva) return;
    setRespuestasPregunta([]);
    const updated = await api.lanzarPregunta(sesionActiva.id, p.id);
    setSesionActiva(updated);
    cargarEstadoControl(sesionActiva.id, false);
  }

  async function cerrarPregunta() {
    if (!sesionActiva) return;
    const updated = await api.cerrarPregunta(sesionActiva.id);
    setSesionActiva(updated);
    cargarEstadoControl(sesionActiva.id, false);
  }

  async function siguientePregunta() {
    if (!sesionActiva) return;
    const index = preguntas.findIndex(
      (p) => p.id === sesionActiva.pregunta_activa_id,
    );
    const next = preguntas[index + 1];
    if (next) {
      await lanzarPregunta(next);
      return;
    }
    // Fin de la lista: en modo quiz, si quedan preguntas en el banco NO se
    // finaliza; el docente pulsa "Nueva ronda".
    if (rondas && rondas.disponibles > 0) {
      window.alert(
        "Fin de la ronda. Pulsa «➕ Nueva ronda» para cargar las siguientes preguntas.",
      );
      return;
    }
    const updated = await api.finalizarSesion(sesionActiva.id);
    setSesionActiva(updated);
  }

  // Cronómetro en vivo: SOLO visual. No cierra la pregunta; esta se cierra
  // cuando el último jugador conectado responde o cuando el docente la cierra.
  useEffect(() => {
    if (!sesionActiva || sesionActiva.estado !== "pregunta") return;
    if (!sesionActiva.cronometro_inicio || !sesionActiva.cronometro_segundos)
      return;

    const inicio = new Date(sesionActiva.cronometro_inicio).getTime();
    const total = sesionActiva.cronometro_segundos;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - inicio) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setTiempoRestante(remaining);
    }, 250);

    return () => clearInterval(interval);
  }, [sesionActiva?.estado, sesionActiva?.pregunta_activa_id]);

  async function finalizarSesion() {
    if (!sesionActiva) return;

    const confirmar = window.confirm(
      "¿Finalizar esta sesión? Se desconectará a todos los jugadores y volverás al menú principal para continuar con las siguientes preguntas o activar la siguiente sección.",
    );
    if (!confirmar) return;

    try {
      // Pone la sesión en estado final y desconecta a todos
      const updated = await api.finalizarSesion(sesionActiva.id);
      if (updated) setSesionActiva(updated);
    } catch (err) {
      console.error("Error finalizando sesión:", err);
    }
    // Recarga los datos de las sesiones (para que el menú muestre el estado final)
    await cargarDatos();
    // Redirige al menú principal para continuar con la siguiente sesión
    setSesionActiva(null);
    setJugadores([]);
    setRespuestasPregunta([]);
    setRespuestasTodas([]);
    setPodium([]);
    setPreguntas([]);
    cambiarVista("menu");
  }

  async function mostrarPodium() {
    if (!sesionActiva) return;
    const p = await api.podium(sesionActiva.id);
    setPodium(p);
    api
      .tablaGrado(sesionActiva.grado_id)
      .then(setTablaColegios)
      .catch(() => {});
    cambiarVista("podium", sesionActiva.id);
    await api.actualizarSesion(sesionActiva.id, { estado: "podium" });
  }

  /** Podio SOLO del reto lúdico activo (no el acumulado de la sesión).
   *  Además envía el estado a la pantalla grande para que muestre el resultado
   *  de este reto. No sale del flujo: el jurado puede seguir calificando. */
  async function mostrarPodioReto() {
    if (!sesionActiva?.reto_activo_id) return;
    try {
      const p = await api.puntajesReto(
        sesionActiva.reto_activo_id,
        sesionActiva.id,
      );
      setPodiumReto([...p].sort((a, b) => a.puesto - b.puesto));
      const updated = await api.actualizarSesion(sesionActiva.id, {
        estado: "reto_podium",
      });
      if (updated) setSesionActiva(updated);
    } catch {
      setPodiumReto([]);
    }
  }

  async function volverAlReto() {
    if (!sesionActiva) return;
    const updated = await api.actualizarSesion(sesionActiva.id, {
      estado: "reto",
    });
    if (updated) setSesionActiva(updated);
  }

  async function aprobarRespuesta(respuestaId: string, correcta: boolean) {
    await api.aprobarRespuesta(respuestaId, correcta);
  }

  async function revivirJugador(jugadorId: string, todas = false) {
    if (!sesionActiva) return;
    try {
      await api.revivirJugador(sesionActiva.id, jugadorId, todas);
      const vs = await api.vidasSesion(sesionActiva.id);
      setVidasEstado(vs);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo revivir");
    }
  }

  const sesionConGrado = sesiones.find((s) => s.id === sesionActiva?.id);

  if (verificando) {
    return (
      <main className="min-h-screen bg-bg p-6 flex items-center justify-center">
        <div className="text-azul text-xl font-heading animate-pulse">
          Cargando...
        </div>
      </main>
    );
  }

  if (vista === "colegios") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => cambiarVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <ColegiosPanel />
        </div>
      </main>
    );
  }

  if (vista === "alumnos") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => cambiarVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <AlumnosPanel />
        </div>
      </main>
    );
  }

  if (vista === "enfrentamiento" && verEnfrentamiento) {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => cambiarVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <EnfrentamientoPanel />
        </div>
      </main>
    );
  }

  if (vista === "duelos" && verDuelos) {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => cambiarVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <DuelosPanel />
        </div>
      </main>
    );
  }

  if (vista === "parametros") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => cambiarVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <ParametrosPanel />
        </div>
      </main>
    );
  }

  if (vista === "menu") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-heading font-extrabold text-azul">
                Panel del Docente
              </h1>
              <p className="text-texto-light">
                Registra colegios y alumnos, arma duelos y controla las sesiones
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("jwt_token");
                router.push("/");
              }}
              className="px-4 py-2 text-sm bg-rojo text-white rounded-lg hover:bg-rojo/80"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <button
              onClick={() => router.push("/admin/preguntas")}
              className="bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">📚</div>
              <p className="font-heading font-bold text-azul">Preguntas</p>
              <p className="text-xs text-texto-light">
                Crear, editar y poner imagen
              </p>
            </button>
            <button
              onClick={() => cambiarVista("colegios")}
              className="bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">🏫</div>
              <p className="font-heading font-bold text-azul">Colegios</p>
              <p className="text-xs text-texto-light">
                Registrar y administrar colegios
              </p>
            </button>
            <button
              onClick={() => cambiarVista("alumnos")}
              className="bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">🎓</div>
              <p className="font-heading font-bold text-azul">Alumnos</p>
              <p className="text-xs text-texto-light">
                Registrar alumnos por grado
              </p>
            </button>
            {verEnfrentamiento && (
              <button
                onClick={() => cambiarVista("enfrentamiento")}
                className="bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors text-left"
              >
                <div className="text-3xl mb-1">⚔️</div>
                <p className="font-heading font-bold text-azul">
                  Enfrentamiento
                </p>
                <p className="text-xs text-texto-light">
                  Tabla colegio vs colegio
                </p>
              </button>
            )}
            {verDuelos && (
              <button
                onClick={() => cambiarVista("duelos")}
                className="bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors text-left"
              >
                <div className="text-3xl mb-1">🥊</div>
                <p className="font-heading font-bold text-azul">Prueba 1v1</p>
                <p className="text-xs text-texto-light">
                  Duelo interno alumno vs alumno
                </p>
              </button>
            )}
            <button
              onClick={() => cambiarVista("parametros")}
              className="bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">⚙️</div>
              <p className="font-heading font-bold text-azul">Configuración</p>
              <p className="text-xs text-texto-light">
                Textos, marca y clave del portal
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {gradosVisibles.length === 0 && (
              <p className="text-texto-light text-sm">
                No hay grados habilitados. Actívalos en Configuración.
              </p>
            )}
            {gradosVisibles.map((g) => (
              <div
                key={g.id}
                className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10"
              >
                <h3 className="text-xl font-heading font-bold text-azul mb-2">
                  Grado {g.nombre}
                </h3>
                <p className="text-sm text-texto-light mb-3">
                  {parametros.modo_quiz === "true" || g.orden >= 4
                    ? "Competencia individual"
                    : "Duelo individual"}
                </p>
                <button
                  onClick={() => crearSesion(g.id)}
                  disabled={loading}
                  className="w-full py-2 bg-dorado text-azul-dark font-heading font-bold rounded-lg hover:bg-dorado-light transition-colors disabled:opacity-50"
                >
                  + Crear sesión
                </button>
              </div>
            ))}
          </div>

          {nuevoPin && (
            <div className="bg-verde/10 border-2 border-verde rounded-xl p-4 mb-6 animate-bounce-in text-center">
              <p className="text-verde font-heading font-bold text-lg">
                ¡PIN generado:{" "}
                <span className="text-3xl tracking-widest">{nuevoPin}</span>
              </p>
            </div>
          )}

          {sesiones.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h2 className="text-xl font-heading font-bold text-azul">
                  Sesiones existentes
                </h2>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-texto cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        seleccionadas.length === sesiones.length &&
                        sesiones.length > 0
                      }
                      onChange={toggleTodas}
                      className="w-4 h-4 accent-azul"
                    />
                    Seleccionar todas
                  </label>
                  <button
                    onClick={eliminarSeleccionadas}
                    disabled={seleccionadas.length === 0 || loading}
                    className="px-4 py-2 bg-rojo text-white rounded-lg font-heading font-bold text-sm hover:bg-rojo/80 disabled:opacity-50"
                  >
                    🗑 Eliminar ({seleccionadas.length})
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {sesiones.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 bg-bg-card rounded-xl p-4 shadow-sm border border-azul/10 hover:border-azul/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(s.id)}
                      onChange={() => toggleSeleccion(s.id)}
                      className="w-4 h-4 accent-azul shrink-0"
                      aria-label={`Seleccionar sesión ${s.pin}`}
                    />
                    <button
                      onClick={() => seleccionarSesion(s)}
                      className="flex-1 flex items-center justify-between text-left"
                    >
                      <div>
                        <span className="font-heading font-bold text-azul">
                          {s.grado?.nombre ?? "—"}
                        </span>
                        <span className="ml-3 text-texto-light">
                          PIN: {s.pin}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          s.estado === "lobby"
                            ? "bg-azul-light/20 text-azul"
                            : s.estado === "pregunta"
                              ? "bg-dorado/20 text-dorado"
                              : s.estado === "final"
                                ? "bg-verde/20 text-verde"
                                : "bg-azul/10 text-azul"
                        }`}
                      >
                        {s.estado}
                      </span>
                    </button>
                    <button
                      onClick={() => eliminarUna(s.id)}
                      disabled={loading}
                      className="text-lg shrink-0 text-rojo hover:text-rojo-error disabled:opacity-40"
                      title="Eliminar esta sesión"
                      aria-label={`Eliminar sesión ${s.pin}`}
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (vista === "podium") {
    const estudiantes = podium.filter((e) => !e.es_colegio);
    const colegiosTabla =
      tablaColegios.length > 0
        ? tablaColegios
        : podium.filter((e) => e.es_colegio);
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => cambiarVista("control", sesionActiva?.id ?? null)}
              className="text-azul hover:text-azul-light"
            >
              ← Volver al control
            </button>
            <button
              onClick={finalizarSesion}
              className="px-4 py-2 bg-verde text-white rounded-xl font-heading font-bold text-sm hover:bg-verde/80"
            >
              ✅ Finalizar sesión
            </button>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-azul mb-8">
            🏆 Podium
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="bg-bg-card border border-azul/10 rounded-2xl p-5">
              <h2 className="text-lg font-heading font-bold text-azul mb-1 text-center">
                🎓 Estudiantes
              </h2>
              <p className="text-xs text-texto-light text-center mb-3">
                Quien acierta más preguntas
              </p>
              <div className="space-y-2">
                {estudiantes.map((entry) => (
                  <div
                    key={entry.entity_id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.puesto === 1
                        ? "bg-dorado text-azul-dark"
                        : "bg-white border border-azul/10 text-texto"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {entry.puesto === 1
                          ? "🥇"
                          : entry.puesto === 2
                            ? "🥈"
                            : entry.puesto === 3
                              ? "🥉"
                              : `${entry.puesto}°`}
                      </span>
                      <span className="font-heading font-bold">
                        {entry.nombre}
                      </span>
                    </div>
                    <span className="font-heading font-extrabold text-right">
                      {entry.aciertos ?? 0} aciertos
                      <span className="ml-2 font-normal text-sm opacity-70">
                        {entry.puntos_total} pts
                      </span>
                    </span>
                  </div>
                ))}
                {estudiantes.length === 0 && (
                  <p className="text-texto-light text-sm text-center">
                    Sin datos individuales.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-bg-card border border-azul/10 rounded-2xl p-5">
              <h2 className="text-lg font-heading font-bold text-azul mb-3 text-center">
                🏫 Colegios
              </h2>
              <div className="space-y-2">
                {colegiosTabla.map((entry, idx) => (
                  <div
                    key={`${entry.nombre}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.puesto === 1
                        ? "bg-dorado text-azul-dark"
                        : "bg-white border border-azul/10 text-texto"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {entry.puesto === 1
                          ? "🥇"
                          : entry.puesto === 2
                            ? "🥈"
                            : entry.puesto === 3
                              ? "🥉"
                              : `${entry.puesto}°`}
                      </span>
                      <span className="font-heading font-bold">
                        {entry.nombre}
                      </span>
                    </div>
                    <span className="font-heading font-extrabold">
                      {entry.puntos_total} pts
                    </span>
                  </div>
                ))}
                {colegiosTabla.length === 0 && (
                  <p className="text-texto-light text-sm text-center">
                    Sin datos de colegios.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (vista === "control" && sesionActiva) {
    const bienActiva = respuestasPregunta.filter(
      (r) => r.correcta === true,
    ).length;
    const malActiva = respuestasPregunta.filter(
      (r) => r.correcta === false,
    ).length;
    const jugadoresOrdenados = [...jugadores].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
    const respuestasPorJugadorPregunta = new Map<string, Respuesta>();
    for (const r of respuestasTodas) {
      respuestasPorJugadorPregunta.set(`${r.jugador_id}:${r.pregunta_id}`, r);
    }
    const rondaSize = rondas?.ronda_size ?? 10;
    const totalRondas = rondas?.total_rondas ?? 1;
    const preguntasDeRonda = (tab: number): Pregunta[] =>
      tab === 0
        ? preguntas
        : preguntas.filter((_, i) => Math.floor(i / rondaSize) + 1 === tab);
    const tablaResultados = (qs: Pregunta[]) => (
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-texto-light">
            <th className="text-left py-1 pr-3 font-bold">Estudiante</th>
            {qs.map((p, i) => (
              <th
                key={p.id}
                className="px-1 text-center font-bold"
                title={p.enunciado}
              >
                #{i + 1}
              </th>
            ))}
            <th className="px-2 text-center font-bold text-verde">Bien</th>
            <th className="px-2 text-center font-bold text-rojo-error">Mal</th>
            <th className="px-2 text-center font-bold text-dorado">Pts</th>
          </tr>
        </thead>
        <tbody>
          {jugadoresOrdenados.map((j) => {
            let bien = 0;
            let mal = 0;
            let pts = 0;
            const celdas = qs.map((p) => {
              const r = respuestasPorJugadorPregunta.get(`${j.id}:${p.id}`);
              if (r) {
                if (r.correcta === true) {
                  bien += 1;
                  pts += r.puntos || 0;
                } else if (r.correcta === false) {
                  mal += 1;
                }
              }
              return r;
            });
            return (
              <tr key={j.id} className="border-t border-azul/10">
                <td className="py-1 pr-3 font-medium text-texto">{j.nombre}</td>
                {celdas.map((r, i) => (
                  <td key={qs[i].id} className="px-1 text-center">
                    {r ? (
                      r.correcta === true ? (
                        <span className="text-verde font-bold">✓</span>
                      ) : r.correcta === false ? (
                        <span className="text-rojo-error font-bold">✗</span>
                      ) : (
                        <span className="text-texto-light">·</span>
                      )
                    ) : (
                      <span className="text-azul/20">—</span>
                    )}
                  </td>
                ))}
                <td className="px-2 text-center font-bold text-verde">
                  {bien}
                </td>
                <td className="px-2 text-center font-bold text-rojo-error">
                  {mal}
                </td>
                <td className="px-2 text-center font-bold text-dorado">
                  {pts}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );

    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => cambiarVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>

          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-heading font-extrabold text-azul">
                {sesionConGrado?.grado?.nombre ?? "—"} — PIN: {sesionActiva.pin}
              </h1>
              <p className="text-texto-light text-sm">
                Estado:{" "}
                <span className="font-bold">
                  {sesionActiva.estado === "pregunta"
                    ? `pregunta en curso (${tiempoRestante}s)`
                    : sesionActiva.estado}
                </span>{" "}
                · {jugadores.length} jugadores
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => recargarTodo(true)}
                className="px-4 py-2 bg-azul/10 text-azul rounded-lg font-heading font-bold text-sm hover:bg-azul/20"
                title="Volver a leer sesión, jugadores y respuestas desde la base de datos"
              >
                🔄 Recargar
              </button>
              <a
                href={`/presentacion/${sesionActiva.id}`}
                target="_blank"
                className="px-4 py-2 bg-azul text-white rounded-lg font-heading font-bold text-sm hover:bg-azul-light"
              >
                Pantalla Grande ↗
              </a>
              <button
                onClick={mostrarPodium}
                className="px-4 py-2 bg-dorado text-azul-dark rounded-lg font-heading font-bold text-sm hover:bg-dorado-light"
              >
                Ver Podium
              </button>
              {(sesionActiva.estado === "podium" ||
                sesionActiva.estado === "final") && (
                <button
                  onClick={finalizarSesion}
                  className="px-4 py-2 bg-verde text-white rounded-lg font-heading font-bold text-sm hover:bg-verde/80"
                >
                  ✅ Finalizar sesión
                </button>
              )}
            </div>
          </div>

          {sesionActiva.estado === "pregunta" && (
            <div className="bg-dorado/10 border-2 border-dorado rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-azul-dark">
                    Pregunta en curso
                  </p>
                  <p className="text-sm text-texto-light">
                    {respuestasPregunta.length} de{" "}
                    {jugadores.filter((j) => j.conectado).length} conectados
                    respondieron ·{" "}
                    <span className="text-verde font-bold">
                      {bienActiva} bien
                    </span>{" "}
                    ·{" "}
                    <span className="text-rojo-error font-bold">
                      {malActiva} mal
                    </span>
                  </p>
                </div>
                <button
                  onClick={cerrarPregunta}
                  className="px-5 py-2 bg-rojo text-white rounded-xl font-heading font-bold hover:bg-rojo/80"
                >
                  Cerrar y ver resultado
                </button>
              </div>
            </div>
          )}

          {sesionActiva.estado === "resultado" && (
            <div className="bg-verde/10 border-2 border-verde rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-verde">
                    ✓ Resultado mostrado
                  </p>
                  <p className="text-sm text-texto-light">
                    {respuestasPregunta.filter((r) => r.correcta).length} de{" "}
                    {respuestasPregunta.length} acertaron ·{" "}
                    <span className="text-verde font-bold">
                      {bienActiva} bien
                    </span>{" "}
                    ·{" "}
                    <span className="text-rojo-error font-bold">
                      {malActiva} mal
                    </span>{" "}
                    — lista para la siguiente
                  </p>
                </div>
                <button
                  onClick={siguientePregunta}
                  className="px-6 py-2 bg-verde text-white rounded-xl text-lg font-heading font-bold hover:bg-verde/80 animate-pulse-score"
                >
                  Siguiente pregunta →
                </button>
              </div>
            </div>
          )}

          {sesionActiva.estado === "final" && (
            <div className="bg-verde/10 border-2 border-verde rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-verde">
                    🏁 ¡Grado finalizado!
                  </p>
                  <p className="text-sm text-texto-light">
                    Los puntos están sumados. Muestra el podium para premiar, o{" "}
                    <span className="font-bold">
                      re-lanza cualquier pregunta
                    </span>{" "}
                    desde la lista de abajo para continuar.
                  </p>
                </div>
                <button
                  onClick={mostrarPodium}
                  className="px-6 py-2 bg-dorado text-azul-dark rounded-xl text-lg font-heading font-bold hover:bg-dorado-light"
                >
                  Ver Podium 🏆
                </button>
              </div>
            </div>
          )}

          {retosActivos && sesionActiva.estado === "reto" && (
            <div className="bg-azul/10 border-2 border-azul rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-azul">
                    🎯 Actividad lúdica en curso
                  </p>
                  <p className="text-sm text-texto-light">
                    El jurado está calificando el reto. La pantalla grande
                    muestra las instrucciones.
                  </p>
                </div>
                <button
                  onClick={mostrarPodioReto}
                  className="px-4 py-2 bg-azul text-white rounded-lg font-heading font-bold text-sm hover:bg-azul-light"
                >
                  Ver Podium del reto
                </button>
              </div>
            </div>
          )}

          {retosActivos && sesionActiva.estado === "reto_podium" && (
            <div className="bg-dorado/10 border-2 border-dorado rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-azul-dark">
                    🏆 Podio del reto en pantalla grande
                  </p>
                  <p className="text-sm text-texto-light">
                    La pantalla grande muestra los ganadores de este reto. El
                    jurado puede seguir corrigiendo puestos.
                  </p>
                </div>
                <button
                  onClick={volverAlReto}
                  className="px-4 py-2 bg-azul text-white rounded-lg font-heading font-bold text-sm hover:bg-azul-light"
                >
                  ← Volver al reto
                </button>
              </div>
            </div>
          )}

          <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10 mb-6">
            <h2 className="font-heading font-bold text-azul mb-3">
              Jugadores conectados
            </h2>
            {jugadores.length === 0 ? (
              <p className="text-texto-light text-sm">Esperando jugadores...</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {jugadores.map((j) => (
                  <span
                    key={j.id}
                    className="px-3 py-1 bg-azul/10 text-azul rounded-full text-sm font-medium"
                  >
                    {j.nombre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {vidasActivas && vidasEstado.length > 0 && (
            <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10 mb-6">
              <h2 className="font-heading font-bold text-azul mb-3">
                ❤️ Vidas
              </h2>
              <div className="flex flex-wrap gap-2">
                {vidasEstado.map((v) => (
                  <div
                    key={v.jugador_id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                      v.eliminado
                        ? "bg-rojo/10 text-rojo-error"
                        : "bg-verde/10 text-verde"
                    }`}
                  >
                    <span className="font-bold">{v.nombre}</span>
                    <span className="font-extrabold">
                      {v.eliminado
                        ? "☠️ 0"
                        : `❤️ ${v.vidas_restantes}/${v.vidas_max}`}
                    </span>
                    <button
                      onClick={() => revivirJugador(v.jugador_id)}
                      disabled={
                        !v.eliminado && v.vidas_restantes >= v.vidas_max
                      }
                      title="Devolver 1 vida"
                      className="ml-1 px-2 py-0.5 rounded-md bg-white/70 hover:bg-white text-azul-dark font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +1
                    </button>
                    {v.eliminado && (
                      <button
                        onClick={() => revivirJugador(v.jugador_id, true)}
                        title="Revivir todas las vidas"
                        className="px-2 py-0.5 rounded-md bg-white/70 hover:bg-white text-azul-dark font-bold text-xs"
                      >
                        Revivir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10 mb-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-heading font-bold text-azul">Resultados</h2>
                <p className="text-sm text-texto-light">
                  {rondas
                    ? `Ronda ${rondas.ronda_actual} de ${rondas.total_rondas} · quedan ${rondas.disponibles} de ${rondas.banco}`
                    : "Resultados por estudiante y por ronda."}
                </p>
              </div>
              <button
                onClick={() => {
                  setRondaTab(1);
                  setResultadosAbierto(true);
                }}
                className="px-4 py-2 bg-azul/10 text-azul rounded-lg font-heading font-bold text-sm hover:bg-azul/20"
              >
                📊 Ver por ronda
              </button>
            </div>
          </div>

          {retosActivos && (
            <div className="mb-6">
              <RetosPanel
                gradoId={sesionActiva.grado_id}
                sesion={sesionActiva}
                jugadores={jugadores}
                colegios={colegios}
                onIniciarReto={() => {}}
              />
            </div>
          )}

          <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10">
            <div className="flex justify-between items-start mb-3 gap-3 flex-wrap">
              <div>
                <h2 className="font-heading font-bold text-azul">Preguntas</h2>
                {rondas && (
                  <p className="text-xs text-texto-light">
                    Ronda {rondas.ronda_actual} de {rondas.total_rondas} ·
                    quedan {rondas.disponibles} preguntas
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {parametros.modo_quiz === "true" &&
                  sesionActiva.ronda_ganador_num == null &&
                  rondas != null && (
                    <button
                      onClick={mostrarGanadorRonda}
                      className="px-3 py-2 bg-dorado text-azul-dark rounded-lg font-heading font-bold text-sm hover:bg-dorado-light"
                    >
                      🏆 Mostrar ganador de ronda
                    </button>
                  )}
                {sesionActiva.ronda_ganador_num != null && (
                  <button
                    onClick={ocultarGanadorRonda}
                    className="px-3 py-2 bg-azul/10 text-azul rounded-lg font-heading font-bold text-sm hover:bg-azul/20"
                  >
                    Ocultar ganador
                  </button>
                )}
                {parametros.modo_quiz === "true" &&
                  rondas != null &&
                  rondas.disponibles > 0 && (
                    <button
                      onClick={continuarRonda}
                      disabled={loading}
                      className="px-3 py-2 bg-azul text-white rounded-lg font-heading font-bold text-sm hover:bg-azul-light disabled:opacity-50"
                    >
                      ➕ Nueva ronda (+{rondas.ronda_size})
                    </button>
                  )}
                {sesionActiva.estado === "pregunta" && (
                  <button
                    onClick={cerrarPregunta}
                    className="px-4 py-2 bg-rojo text-white rounded-lg font-heading font-bold text-sm hover:bg-rojo/80"
                  >
                    Cerrar pregunta
                  </button>
                )}
                {sesionActiva.estado === "resultado" && (
                  <button
                    onClick={siguientePregunta}
                    className="px-4 py-2 bg-verde text-white rounded-lg font-heading font-bold text-sm hover:bg-verde/80"
                  >
                    Siguiente pregunta →
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {preguntas.map((p, idx) => {
                const indiceActiva = preguntas.findIndex(
                  (q) => q.id === sesionActiva.pregunta_activa_id,
                );
                // Solo está ACTIVA si la sesión está realmente en pregunta
                // (no basta con que pregunta_activa_id apunte a ella).
                const esActiva =
                  p.id === sesionActiva.pregunta_activa_id &&
                  sesionActiva.estado === "pregunta";
                const esAnterior = indiceActiva > idx;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      esActiva
                        ? "border-dorado bg-dorado/10"
                        : esAnterior
                          ? "border-verde/40 bg-verde/5"
                          : "border-azul/10"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-xs font-bold text-texto-light">
                        S{p.sesion} #{idx + 1}
                        {esAnterior && !esActiva && (
                          <span className="ml-2 text-verde">✓</span>
                        )}
                      </span>
                      <p className="text-sm text-texto line-clamp-1">
                        {p.enunciado}
                      </p>
                    </div>
                    {esActiva ? (
                      <div className="ml-3 flex items-center gap-2">
                        <span className="text-dorado font-bold text-sm">
                          ACTIVA
                        </span>
                        <button
                          onClick={() => lanzarPregunta(p)}
                          className="px-3 py-1 bg-azul/10 text-azul rounded-lg text-sm font-bold hover:bg-azul/20"
                          title="Reiniciar la pregunta (borra las respuestas actuales)"
                        >
                          Reiniciar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => lanzarPregunta(p)}
                        className={`ml-3 px-3 py-1 rounded-lg text-sm font-bold ${
                          esAnterior
                            ? "bg-azul/10 text-azul hover:bg-azul/20"
                            : "bg-verde text-white hover:bg-verde/80"
                        }`}
                      >
                        {esAnterior ? "Re-lanzar" : "Lanzar →"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {resultadosAbierto && (
          <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setResultadosAbierto(false)}
          >
            <div
              className="bg-white rounded-2xl p-5 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-bounce-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-heading font-extrabold text-azul">
                  📊 Resultados por ronda
                </h3>
                <button
                  onClick={() => setResultadosAbierto(false)}
                  className="text-texto-light hover:text-texto text-xl"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                {Array.from({ length: totalRondas }, (_, i) => i + 1).map(
                  (r) => (
                    <button
                      key={r}
                      onClick={() => setRondaTab(r)}
                      className={`px-3 py-1 rounded-lg text-sm font-bold ${
                        rondaTab === r
                          ? "bg-azul text-white"
                          : "bg-azul/10 text-azul hover:bg-azul/20"
                      }`}
                    >
                      Ronda {r}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setRondaTab(0)}
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    rondaTab === 0
                      ? "bg-azul text-white"
                      : "bg-azul/10 text-azul hover:bg-azul/20"
                  }`}
                >
                  Total
                </button>
              </div>

              <div className="overflow-x-auto">
                {jugadoresOrdenados.length === 0 ? (
                  <p className="text-texto-light text-sm">Sin jugadores.</p>
                ) : (
                  tablaResultados(preguntasDeRonda(rondaTab))
                )}
              </div>
              <p className="text-xs text-texto-light mt-2">
                ✓ bien · ✗ mal · · pendiente · — sin responder
              </p>
            </div>
          </div>
        )}
        {podiumReto && (
          <div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPodiumReto(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-bounce-in"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-heading font-extrabold text-azul text-center mb-1">
                🏆 Podio del reto
              </h3>
              <p className="text-sm text-texto-light text-center mb-4">
                Puntos de esta prueba lúdica
              </p>
              {podiumReto.length === 0 ? (
                <p className="text-center text-texto-light py-6">
                  Aún no hay puestos asignados en este reto.
                </p>
              ) : (
                <div className="space-y-2">
                  {podiumReto.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        p.puesto === 1
                          ? "bg-dorado text-azul-dark"
                          : "bg-bg-card text-texto"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {p.puesto === 1
                            ? "🥇"
                            : p.puesto === 2
                              ? "🥈"
                              : p.puesto === 3
                                ? "🥉"
                                : `${p.puesto}°`}
                        </span>
                        <span className="font-heading font-bold">
                          {p.nombre ?? "—"}
                        </span>
                      </div>
                      <span className="font-heading font-extrabold">
                        +{p.puntos} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setPodiumReto(null)}
                className="mt-5 w-full py-2.5 bg-azul text-white rounded-xl font-heading font-bold hover:bg-azul-light"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return null;
}

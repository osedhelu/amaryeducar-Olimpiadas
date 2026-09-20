"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/postgrest";
import { useWebSocket } from "@/hooks/useWebSocket";
import type {
  Grado,
  SesionJuego,
  Pregunta,
  Jugador,
  PodiumEntry,
  Respuesta,
  EventoWS,
} from "@/types/game";

type Vista = "menu" | "control" | "preguntas" | "retos" | "podium";

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
  const [podium, setPodium] = useState<PodiumEntry[]>([]);
  const [nuevoPin, setNuevoPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const { lastEvent } = useWebSocket(sesionActiva?.id ?? null, "admin");

  const cargarDatos = useCallback(async () => {
    const g = await api.get<Grado[]>("/grados?order=orden.asc");
    setGrados(g);
    const s = await api.get<SesionJuego[]>(
      "/sesiones_juego?order=creado_en.desc",
    );
    const sesionesConGrado = s.map((ses) => ({
      ...ses,
      grado: g.find((gr) => gr.id === ses.grado_id),
    }));
    setSesiones(sesionesConGrado);
  }, []);

  useEffect(() => {
    let activo = true;
    (async () => {
      const { esTokenDocente } = await import("@/lib/session");
      if (!esTokenDocente()) {
        router.push("/admin");
        return;
      }
      if (!activo) return;
      cargarDatos();
    })();
    return () => {
      activo = false;
    };
  }, [cargarDatos, router]);

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

  // Contador exacto de respuestas: reconcilia con la BD para que "X de Y
  // jugadores respondieron" sea correcto aunque se pierda un evento WS.
  const recargarRespuestas = useCallback(async () => {
    if (!sesionActiva?.pregunta_activa_id) return;
    try {
      const r = await api.rpc<Respuesta[]>("obtener_respuestas_sesion", {
        p_sesion_id: sesionActiva.id,
      });
      setRespuestasPregunta(r);
    } catch {
      /* mantener estado */
    }
  }, [sesionActiva?.id, sesionActiva?.pregunta_activa_id]);

  useEffect(() => {
    if (!lastEvent || !sesionActiva) return;
    const ev = lastEvent as EventoWS;
    if (
      ev.tipo === "respuesta_recibida" ||
      (ev.tipo === "sesion_cambio" && ev.data.id === sesionActiva.id)
    ) {
      const t = setTimeout(recargarRespuestas, 600);
      return () => clearTimeout(t);
    }
  }, [lastEvent, sesionActiva, recargarRespuestas]);

  // Mientras hay pregunta activa, reconciliar cada 2s por si se perdió un evento
  useEffect(() => {
    if (!sesionActiva?.pregunta_activa_id) return;
    const interval = setInterval(recargarRespuestas, 2000);
    return () => clearInterval(interval);
  }, [sesionActiva?.pregunta_activa_id, recargarRespuestas]);

  async function crearSesion(gradoId: string) {
    setLoading(true);
    try {
      const pin = await api.rpc<string>("/generar_pin_unico", {});
      const [nueva] = await api.post<SesionJuego[]>("/sesiones_juego", {
        pin,
        grado_id: gradoId,
        estado: "lobby",
      });
      setNuevoPin(pin);
      await cargarDatos();
      setSesionActiva(nueva);
      setVista("control");
      cargarJugadores(nueva.id);
      cargarPreguntas(gradoId);
    } finally {
      setLoading(false);
    }
  }

  async function cargarJugadores(sesionId: string) {
    const j = await api.get<Jugador[]>(
      `/jugadores?sesion_id=eq.${sesionId}&order=creado_en.asc`,
    );
    setJugadores(j);
  }

  async function cargarRespuestas(preguntaId: string) {
    if (!sesionActiva) return;
    const r = await api.rpc<Respuesta[]>("obtener_respuestas_sesion", {
      p_sesion_id: sesionActiva.id,
    });
    setRespuestasPregunta(r);
  }

  async function seleccionarSesion(s: SesionJuego) {
    setSesionActiva(s);
    setVista("control");
    cargarJugadores(s.id);
    cargarPreguntas(s.grado_id);
    if (s.pregunta_activa_id) cargarRespuestas(s.pregunta_activa_id);
  }

  async function cargarPreguntas(gradoId: string) {
    const p = await api.get<Pregunta[]>(
      `/preguntas?grado_id=eq.${gradoId}&order=sesion,orden`,
    );
    setPreguntas(p);
  }

  async function lanzarPregunta(p: Pregunta) {
    if (!sesionActiva) return;
    setRespuestasPregunta([]);
    await api.patch(`/sesiones_juego?id=eq.${sesionActiva.id}`, {
      estado: "pregunta",
      pregunta_activa_id: p.id,
      cronometro_inicio: new Date().toISOString(),
      cronometro_segundos: p.tiempo_limite,
    });
    const [updated] = await api.get<SesionJuego[]>(
      `/sesiones_juego?id=eq.${sesionActiva.id}`,
    );
    setSesionActiva(updated);
  }

  async function cerrarPregunta() {
    if (!sesionActiva) return;
    await api.patch(`/sesiones_juego?id=eq.${sesionActiva.id}`, {
      estado: "resultado",
    });
    const [updated] = await api.get<SesionJuego[]>(
      `/sesiones_juego?id=eq.${sesionActiva.id}`,
    );
    setSesionActiva(updated);
    if (updated.pregunta_activa_id)
      cargarRespuestas(updated.pregunta_activa_id);
  }

  async function siguientePregunta() {
    if (!sesionActiva) return;
    const index = preguntas.findIndex(
      (p) => p.id === sesionActiva.pregunta_activa_id,
    );
    const next = preguntas[index + 1];
    if (next) {
      await lanzarPregunta(next);
    } else {
      await api.patch(`/sesiones_juego?id=eq.${sesionActiva.id}`, {
        estado: "final",
      });
      const [updated] = await api.get<SesionJuego[]>(
        `/sesiones_juego?id=eq.${sesionActiva.id}`,
      );
      setSesionActiva(updated);
    }
  }

  // Cronómetro en vivo: cierra la pregunta automáticamente al agotarse el tiempo
  useEffect(() => {
    if (!sesionActiva || sesionActiva.estado !== "pregunta") return;
    if (!sesionActiva.cronometro_inicio || !sesionActiva.cronometro_segundos)
      return;

    const inicio = new Date(sesionActiva.cronometro_inicio).getTime();
    const total = sesionActiva.cronometro_segundos;
    let cerrada = false;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - inicio) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setTiempoRestante(remaining);
      if (remaining === 0 && !cerrada) {
        cerrada = true;
        clearInterval(interval);
        cerrarPregunta();
      }
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
      // Marca a todos los jugadores de la sesión como desconectados
      await api.patch(`/jugadores?sesion_id=eq.${sesionActiva.id}`, {
        conectado: false,
      });
      // Pone la sesión en estado final
      await api.patch(`/sesiones_juego?id=eq.${sesionActiva.id}`, {
        estado: "final",
      });
    } catch (err) {
      console.error("Error finalizando sesión:", err);
    }
    // Recarga los datos de las sesiones (para que el menú muestre el estado final)
    await cargarDatos();
    // Redirige al menú principal para continuar con la siguiente sesión
    setSesionActiva(null);
    setJugadores([]);
    setRespuestasPregunta([]);
    setPodium([]);
    setPreguntas([]);
    setVista("menu");
    window.scrollTo(0, 0);
  }

  async function mostrarPodium() {
    if (!sesionActiva) return;
    const p = await api.rpc<PodiumEntry[]>("/obtener_podium", {
      p_sesion_id: sesionActiva.id,
    });
    setPodium(p);
    setVista("podium");
    await api.patch(`/sesiones_juego?id=eq.${sesionActiva.id}`, {
      estado: "podium",
    });
  }

  async function aprobarRespuesta(respuestaId: string, correcta: boolean) {
    await api.rpc("/aprobar_respuesta_abierta", {
      p_respuesta_id: respuestaId,
      p_correcta: correcta,
    });
  }

  const sesionConGrado = sesiones.find((s) => s.id === sesionActiva?.id);

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
                Selecciona un grado para crear o controlar una sesión
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {grados.map((g) => (
              <div
                key={g.id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <h3 className="text-xl font-heading font-bold text-azul mb-2">
                  Grado {g.nombre}
                </h3>
                <p className="text-sm text-texto-light mb-3">
                  {g.orden <= 3
                    ? "Duelo individual"
                    : "Competencia entre colegios"}
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
              <h2 className="text-xl font-heading font-bold text-azul mb-3">
                Sesiones existentes
              </h2>
              <div className="space-y-2">
                {sesiones.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => seleccionarSesion(s)}
                    className="w-full flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-azul/30 transition-colors text-left"
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
                              : "bg-gray-100 text-texto-light"
                      }`}
                    >
                      {s.estado}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  if (vista === "podium") {
    return (
      <main className="min-h-screen bg-gradient-to-b from-azul to-azul-dark p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex gap-3 justify-center mb-4">
            <button
              onClick={() => setVista("control")}
              className="text-white/70 hover:text-white"
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
          <h1 className="text-3xl font-heading font-extrabold text-dorado mb-8">
            🏆 Podium
          </h1>
          <div className="space-y-3">
            {podium.map((entry) => (
              <div
                key={entry.entity_id}
                className={`flex items-center justify-between p-4 rounded-xl animate-slide-up ${
                  entry.puesto === 1
                    ? "bg-dorado text-azul-dark"
                    : entry.puesto === 2
                      ? "bg-white/90 text-azul-dark"
                      : "bg-white/20 text-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-heading font-extrabold">
                    {entry.puesto === 1
                      ? "🥇"
                      : entry.puesto === 2
                        ? "🥈"
                        : entry.puesto === 3
                          ? "🥉"
                          : `${entry.puesto}°`}
                  </span>
                  <span className="font-heading font-bold text-lg">
                    {entry.nombre}
                  </span>
                </div>
                <span className="text-2xl font-heading font-extrabold">
                  {entry.puntos_total} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (vista === "control" && sesionActiva) {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              setVista("menu");
              setSesionActiva(null);
            }}
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
                    respondieron
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
                    {respuestasPregunta.length} acertaron — lista para la
                    siguiente
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
                    Los puntos están sumados. Muestra el podium para premiar.
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

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
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

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-heading font-bold text-azul">Preguntas</h2>
              <div className="flex gap-2">
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
                const esActiva = p.id === sesionActiva.pregunta_activa_id;
                const esAnterior =
                  preguntas.findIndex(
                    (q) => q.id === sesionActiva.pregunta_activa_id,
                  ) > idx;
                const esSiguiente =
                  preguntas.findIndex(
                    (q) => q.id === sesionActiva.pregunta_activa_id,
                  ) ===
                    idx - 1 &&
                  (sesionActiva.estado === "resultado" ||
                    sesionActiva.estado === "final");

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      esActiva
                        ? "border-dorado bg-dorado/10"
                        : esAnterior
                          ? "border-verde/40 bg-verde/5"
                          : "border-gray-100"
                    }`}
                  >
                    <div className="flex-1">
                      <span className="text-xs font-bold text-texto-light">
                        S{p.sesion} #{p.orden}
                        {esAnterior && !esActiva && (
                          <span className="ml-2 text-verde">✓</span>
                        )}
                      </span>
                      <p className="text-sm text-texto line-clamp-1">
                        {p.enunciado}
                      </p>
                    </div>
                    {esActiva && (
                      <span className="ml-3 text-dorado font-bold text-sm">
                        ACTIVA
                      </span>
                    )}
                    {esSiguiente && (
                      <button
                        onClick={() => lanzarPregunta(p)}
                        className="ml-3 px-3 py-1 bg-verde text-white rounded-lg text-sm font-bold hover:bg-verde/80"
                      >
                        Lanzar →
                      </button>
                    )}
                    {!esActiva && !esSiguiente && !esAnterior && (
                      <button
                        onClick={() => lanzarPregunta(p)}
                        className="ml-3 px-3 py-1 bg-gray-200 text-texto rounded-lg text-sm font-bold hover:bg-gray-300"
                      >
                        Lanzar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return null;
}

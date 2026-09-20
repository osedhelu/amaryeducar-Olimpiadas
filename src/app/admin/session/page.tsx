"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import ColegiosPanel from "@/components/admin/ColegiosPanel";
import AlumnosPanel from "@/components/admin/AlumnosPanel";
import EnfrentamientoPanel from "@/components/admin/EnfrentamientoPanel";
import DuelosPanel from "@/components/admin/DuelosPanel";
import type {
  Grado,
  SesionJuego,
  Pregunta,
  Jugador,
  PodiumEntry,
  Respuesta,
  EventoWS,
  TablaColegio,
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
  | "duelos";

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
  const [tablaColegios, setTablaColegios] = useState<TablaColegio[]>([]);
  const [nuevoPin, setNuevoPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const { lastEvent } = useWebSocket(sesionActiva?.id ?? null, "admin");

  const cargarDatos = useCallback(async () => {
    const g = await api.grados();
    setGrados(g);
    const s = await api.sesiones();
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
      const r = await api.respuestasSesion(
        sesionActiva.id,
        sesionActiva.pregunta_activa_id,
      );
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
      const nueva = await api.crearSesion(gradoId);
      setNuevoPin(nueva.pin);
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
    const j = await api.jugadores(sesionId);
    setJugadores(j);
  }

  async function cargarRespuestas(preguntaId: string) {
    if (!sesionActiva) return;
    const r = await api.respuestasSesion(sesionActiva.id, preguntaId);
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
    const p = await api.preguntas(gradoId);
    setPreguntas(p);
  }

  async function lanzarPregunta(p: Pregunta) {
    if (!sesionActiva) return;
    setRespuestasPregunta([]);
    const updated = await api.lanzarPregunta(sesionActiva.id, p.id);
    setSesionActiva(updated);
  }

  async function cerrarPregunta() {
    if (!sesionActiva) return;
    const updated = await api.cerrarPregunta(sesionActiva.id);
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
      const updated = await api.finalizarSesion(sesionActiva.id);
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
    setPodium([]);
    setPreguntas([]);
    setVista("menu");
    window.scrollTo(0, 0);
  }

  async function mostrarPodium() {
    if (!sesionActiva) return;
    const p = await api.podium(sesionActiva.id);
    setPodium(p);
    api
      .tablaGrado(sesionActiva.grado_id)
      .then(setTablaColegios)
      .catch(() => {});
    setVista("podium");
    await api.actualizarSesion(sesionActiva.id, { estado: "podium" });
  }

  async function aprobarRespuesta(respuestaId: string, correcta: boolean) {
    await api.aprobarRespuesta(respuestaId, correcta);
  }

  const sesionConGrado = sesiones.find((s) => s.id === sesionActiva?.id);

  if (vista === "colegios") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setVista("menu")}
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
            onClick={() => setVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <AlumnosPanel />
        </div>
      </main>
    );
  }

  if (vista === "enfrentamiento") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <EnfrentamientoPanel />
        </div>
      </main>
    );
  }

  if (vista === "duelos") {
    return (
      <main className="min-h-screen bg-bg p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setVista("menu")}
            className="text-azul mb-4 hover:text-azul-light"
          >
            ← Volver al menú
          </button>
          <DuelosPanel />
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
              onClick={() => setVista("colegios")}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">🏫</div>
              <p className="font-heading font-bold text-azul">Colegios</p>
              <p className="text-xs text-texto-light">
                Registrar y administrar colegios
              </p>
            </button>
            <button
              onClick={() => setVista("alumnos")}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">🎓</div>
              <p className="font-heading font-bold text-azul">Alumnos</p>
              <p className="text-xs text-texto-light">
                Registrar alumnos por grado
              </p>
            </button>
            <button
              onClick={() => setVista("enfrentamiento")}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">⚔️</div>
              <p className="font-heading font-bold text-azul">Enfrentamiento</p>
              <p className="text-xs text-texto-light">
                Tabla colegio vs colegio
              </p>
            </button>
            <button
              onClick={() => setVista("duelos")}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-azul/30 transition-colors text-left"
            >
              <div className="text-3xl mb-1">🥊</div>
              <p className="font-heading font-bold text-azul">Prueba 1v1</p>
              <p className="text-xs text-texto-light">
                Duelo interno alumno vs alumno
              </p>
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
    const estudiantes = podium.filter((e) => !e.es_colegio);
    const colegiosTabla =
      tablaColegios.length > 0
        ? tablaColegios
        : podium.filter((e) => e.es_colegio);
    return (
      <main className="min-h-screen bg-gradient-to-b from-azul to-azul-dark p-6">
        <div className="max-w-4xl mx-auto text-center">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
              <h2 className="text-lg font-heading font-bold text-white mb-3 text-center">
                🎓 Estudiantes
              </h2>
              <div className="space-y-2">
                {estudiantes.map((entry) => (
                  <div
                    key={entry.entity_id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.puesto === 1
                        ? "bg-dorado text-azul-dark"
                        : "bg-white/5 text-white"
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
                {estudiantes.length === 0 && (
                  <p className="text-white/60 text-sm text-center">
                    Sin datos individuales.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
              <h2 className="text-lg font-heading font-bold text-white mb-3 text-center">
                🏫 Colegios
              </h2>
              <div className="space-y-2">
                {colegiosTabla.map((entry, idx) => (
                  <div
                    key={`${entry.nombre}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      entry.puesto === 1
                        ? "bg-dorado text-azul-dark"
                        : "bg-white/5 text-white"
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
                  <p className="text-white/60 text-sm text-center">
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

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api, imagenPreguntaUrl } from "@/lib/api";
import type {
  SesionJuego,
  Pregunta,
  Jugador,
  PodiumEntry,
  Respuesta,
  EventoWS,
  TablaColegio,
  Reto,
} from "@/types/game";

type Vista =
  | "bienvenida"
  | "lobby"
  | "pregunta"
  | "resultado"
  | "reto"
  | "podium"
  | "final";

export default function PresentacionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [retoActivo, setRetoActivo] = useState<Reto | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [podium, setPodium] = useState<PodiumEntry[]>([]);
  const [tabla, setTabla] = useState<TablaColegio[]>([]);
  const [vista, setVista] = useState<Vista>("bienvenida");
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [preguntasLista, setPreguntasLista] = useState<Pregunta[]>([]);
  const [controlUnlocked, setControlUnlocked] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [claveInput, setClaveInput] = useState("");
  const [claveError, setClaveError] = useState("");
  const [controlesLoading, setControlesLoading] = useState(false);

  const { lastEvent, connected } = useWebSocket(sessionId, "presentacion");

  const cargarEstado = useCallback(async () => {
    const s = await api.sesion(sessionId);
    if (!s) return;
    setSesion(s);

    const j = await api.jugadores(s.id);
    setJugadores(j);

    const preguntas = await api.preguntas(s.grado_id);
    setPreguntasLista(preguntas);

    if (s.estado === "reto" && s.reto_activo_id) {
      const retos = await api.retos(s.grado_id);
      const activo = retos.find((r) => r.id === s.reto_activo_id) ?? null;
      setRetoActivo(activo);
    } else {
      setRetoActivo(null);
    }

    if (s.pregunta_activa_id) {
      const p = await api.preguntasPorId(s.pregunta_activa_id);
      setPregunta(p);
      const r = await api.respuestasSesion(s.id, s.pregunta_activa_id);
      setRespuestas(r);
    }

    if (s.estado === "podium" || s.estado === "final") {
      const p = await api.podium(s.id);
      setPodium(p);
      api
        .tablaGrado(s.grado_id)
        .then(setTabla)
        .catch(() => {});
    }
  }, [sessionId]);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  useEffect(() => {
    if (!lastEvent) return;
    const ev = lastEvent as EventoWS;
    switch (ev.tipo) {
      case "jugador_unido":
        setJugadores((prev) => {
          if (prev.find((j) => j.id === ev.data.id)) return prev;
          return [...prev, ev.data];
        });
        break;
      case "jugador_cambio":
        setJugadores((prev) =>
          prev.map((j) => (j.id === ev.data.id ? ev.data : j)),
        );
        break;
      case "sesion_cambio":
        setSesion(ev.data);
        if (ev.data.estado === "podium" || ev.data.estado === "final") {
          api.podium(ev.data.id).then(setPodium);
          api
            .tablaGrado(ev.data.grado_id)
            .then(setTabla)
            .catch(() => {});
        }
        if (ev.data.estado === "reto" && ev.data.reto_activo_id) {
          api.retos(ev.data.grado_id).then((retos) => {
            setRetoActivo(
              retos.find((r) => r.id === ev.data.reto_activo_id) ?? null,
            );
          });
        } else if (ev.data.estado !== "reto") {
          setRetoActivo(null);
        }
        break;
      case "respuesta_recibida":
        if (ev.data.pregunta_id === pregunta?.id) {
          setRespuestas((prev) => {
            if (prev.some((r) => r.id === ev.data.id)) return prev;
            return [...prev, ev.data];
          });
        }
        break;
      default:
        break;
    }
  }, [lastEvent, pregunta?.id]);

  // Contador exacto: reconcilia con la BD en cada evento y al cambiar de
  // pregunta, para que "X respuestas recibidas" siempre sea correcto aunque
  // se pierda un evento WebSocket.
  const recargarRespuestas = useCallback(async () => {
    if (!sesion?.pregunta_activa_id) {
      setRespuestas([]);
      return;
    }
    try {
      const r = await api.respuestasSesion(
        sesion.id,
        sesion.pregunta_activa_id,
      );
      setRespuestas(r);
    } catch {
      /* consulta fallida, mantener estado actual */
    }
  }, [sesion?.id, sesion?.pregunta_activa_id]);

  useEffect(() => {
    if (!lastEvent) return;
    const ev = lastEvent as EventoWS;
    if (ev.tipo === "respuesta_recibida" || ev.tipo === "sesion_cambio") {
      const delay = ev.tipo === "respuesta_recibida" ? 600 : 100;
      const t = setTimeout(recargarRespuestas, delay);
      return () => clearTimeout(t);
    }
  }, [lastEvent, recargarRespuestas]);

  // Mientras la pregunta está activa, reconciliar cada 2s por si un evento
  // se perdió (reconexión, pestaña en segundo plano, etc.)
  useEffect(() => {
    if (vista !== "pregunta" && vista !== "resultado") return;
    const interval = setInterval(recargarRespuestas, 2000);
    return () => clearInterval(interval);
  }, [vista, recargarRespuestas]);

  useEffect(() => {
    if (!sesion) return;
    if (sesion.estado === "lobby") setVista("lobby");
    else if (sesion.estado === "pregunta") setVista("pregunta");
    else if (sesion.estado === "resultado") setVista("resultado");
    else if (sesion.estado === "reto") setVista("reto");
    else if (sesion.estado === "podium") setVista("podium");
    else if (sesion.estado === "final") setVista("final");
  }, [sesion?.estado]);

  useEffect(() => {
    if (!sesion?.cronometro_inicio || !sesion?.cronometro_segundos) return;
    const inicio = new Date(sesion.cronometro_inicio).getTime();
    const total = sesion.cronometro_segundos;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - inicio) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setTiempoRestante(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [sesion?.cronometro_inicio, sesion?.cronometro_segundos]);

  useEffect(() => {
    if (pregunta && sesion?.pregunta_activa_id === pregunta.id) return;
    if (sesion?.pregunta_activa_id) {
      api.preguntasPorId(sesion.pregunta_activa_id).then((p) => {
        setPregunta(p);
        setRespuestas([]);
        api
          .respuestasSesion(sesion.id, sesion.pregunta_activa_id)
          .then(setRespuestas)
          .catch(() => {});
      });
    } else {
      setPregunta(null);
      setRespuestas([]);
    }
  }, [sesion?.pregunta_activa_id, pregunta, recargarRespuestas]);

  // ─── Control de ronda desde la pantalla grande ───

  async function desbloquearControl() {
    setControlesLoading(true);
    setClaveError("");
    try {
      const { token } = await api.loginDocente(claveInput);
      localStorage.setItem("jwt_token", token);
      setControlUnlocked(true);
      setShowKeyModal(false);
      setClaveInput("");
    } catch {
      setClaveError("Clave incorrecta");
    } finally {
      setControlesLoading(false);
    }
  }

  async function iniciarPrimeraPregunta() {
    if (!sesion || preguntasLista.length === 0 || controlesLoading) return;
    setControlesLoading(true);
    try {
      const primera = preguntasLista[0];
      const updated = await api.lanzarPregunta(sesion.id, primera.id);
      setSesion(updated);
    } finally {
      setControlesLoading(false);
    }
  }

  async function cerrarPreguntaActual() {
    if (!sesion || controlesLoading) return;
    setControlesLoading(true);
    try {
      const updated = await api.cerrarPregunta(sesion.id);
      setSesion(updated);
    } finally {
      setControlesLoading(false);
    }
  }

  async function siguientePregunta() {
    if (!sesion || controlesLoading) return;
    setControlesLoading(true);
    try {
      const updated = await api.siguientePregunta(sesion.id);
      setSesion(updated);
    } finally {
      setControlesLoading(false);
    }
  }

  async function verPodium() {
    if (!sesion || controlesLoading) return;
    setControlesLoading(true);
    try {
      await api.actualizarSesion(sesion.id, { estado: "podium" });
      const p = await api.podium(sesion.id);
      setPodium(p);
      const updated = await api.sesion(sesion.id);
      setSesion(updated);
    } finally {
      setControlesLoading(false);
    }
  }

  async function finalizarSesionDesdePresentacion() {
    if (!sesion || controlesLoading) return;
    setControlesLoading(true);
    try {
      const updated = await api.finalizarSesion(sesion.id);
      setSesion(updated);
    } finally {
      setControlesLoading(false);
    }
  }

  const vistaLobby = vista === "bienvenida" || vista === "lobby";

  const barraControles = (
    <>
      {controlUnlocked && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 items-center bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-2xl border-2 border-dorado animate-slide-up">
          <span className="text-[11px] font-heading font-bold text-texto-light mr-1 uppercase">
            Control
          </span>
          {(vistaLobby || vista === "resultado") && (
            <button
              onClick={siguientePregunta}
              disabled={controlesLoading}
              className="px-5 py-2 bg-verde text-white rounded-xl font-heading font-bold text-sm hover:bg-verde/80 disabled:opacity-50"
            >
              {sesion?.pregunta_activa_id
                ? "Siguiente pregunta →"
                : "Iniciar preguntas ▶"}
            </button>
          )}
          {vista === "pregunta" && (
            <button
              onClick={cerrarPreguntaActual}
              disabled={controlesLoading}
              className="px-5 py-2 bg-rojo text-white rounded-xl font-heading font-bold text-sm hover:bg-rojo/80 disabled:opacity-50"
            >
              Cerrar pregunta ⏹
            </button>
          )}
          {vista === "reto" && (
            <button
              onClick={async () => {
                if (!sesion || controlesLoading) return;
                setControlesLoading(true);
                try {
                  const updated = await api.actualizarSesion(sesion.id, {
                    estado: "lobby",
                  });
                  setSesion(updated);
                  setRetoActivo(null);
                } finally {
                  setControlesLoading(false);
                }
              }}
              disabled={controlesLoading}
              className="px-5 py-2 bg-verde text-white rounded-xl font-heading font-bold text-sm hover:bg-verde/80 disabled:opacity-50"
            >
              Volver a preguntas →
            </button>
          )}
          {(vista === "resultado" ||
            vista === "final" ||
            vista === "podium") && (
            <button
              onClick={verPodium}
              disabled={controlesLoading}
              className="px-5 py-2 bg-dorado text-azul-dark rounded-xl font-heading font-bold text-sm hover:bg-dorado-light disabled:opacity-50"
            >
              Podium 🏆
            </button>
          )}
          {vista === "podium" && (
            <button
              onClick={iniciarPrimeraPregunta}
              disabled={controlesLoading}
              className="px-5 py-2 bg-azul text-white rounded-xl font-heading font-bold text-sm hover:bg-azul-light disabled:opacity-50"
            >
              Reiniciar ▶
            </button>
          )}
          {vista === "podium" && (
            <button
              onClick={finalizarSesionDesdePresentacion}
              disabled={controlesLoading}
              className="px-5 py-2 bg-verde text-white rounded-xl font-heading font-bold text-sm hover:bg-verde/80 disabled:opacity-50"
            >
              ✅ Finalizar
            </button>
          )}
          <button
            onClick={() => setControlUnlocked(false)}
            className="px-3 py-2 text-texto-light rounded-xl hover:bg-gray-200 font-bold text-sm"
            title="Bloquear control"
          >
            🔒
          </button>
        </div>
      )}

      {!controlUnlocked && (
        <button
          onClick={() => setShowKeyModal(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-xl border-2 border-gray-200 hover:border-dorado flex items-center justify-center text-xl transition-colors"
          title="Desbloquear control del docente"
        >
          🔑
        </button>
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
            <h3 className="text-xl font-heading font-bold text-azul mb-3 text-center">
              Control del docente
            </h3>
            <p className="text-sm text-texto-light mb-4 text-center">
              Ingresa la clave maestra para controlar las preguntas desde esta
              pantalla.
            </p>
            <input
              type="password"
              value={claveInput}
              onChange={(e) => setClaveInput(e.target.value)}
              placeholder="Clave maestra"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && desbloquearControl()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-azul focus:outline-none transition-colors mb-3"
            />
            {claveError && (
              <p className="text-rojo-error text-sm text-center mb-3 font-medium">
                {claveError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowKeyModal(false);
                  setClaveError("");
                  setClaveInput("");
                }}
                className="flex-1 py-2.5 bg-gray-200 text-texto rounded-xl font-heading font-bold hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={desbloquearControl}
                disabled={controlesLoading}
                className="flex-1 py-2.5 bg-dorado text-azul-dark rounded-xl font-heading font-bold hover:bg-dorado-light disabled:opacity-50"
              >
                {controlesLoading ? "Verificando..." : "Desbloquear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (!sesion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="text-white text-3xl font-heading font-bold animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }

  if (vista === "bienvenida" || vista === "lobby") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
          <div className="text-7xl">🏆</div>
          <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-white">
            Amar y Educar
          </h1>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-dorado">
            Olimpiadas Matemáticas 2026
          </h2>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-sm mx-auto">
            <p className="text-white/70 text-sm mb-1">PIN de la sesión</p>
            <p className="text-dorado text-6xl font-heading font-extrabold tracking-widest">
              {sesion.pin}
            </p>
          </div>

          <div>
            <p className="text-white/70 text-sm mb-2">Jugadores conectados</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {jugadores.map((j) => (
                <span
                  key={j.id}
                  className="px-3 py-1 bg-dorado/20 text-dorado rounded-full text-sm font-heading font-bold animate-bounce-in"
                >
                  {j.nombre}
                </span>
              ))}
            </div>
            <p className="text-white/50 text-sm mt-2">
              {jugadores.length} participantes
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "bg-verde" : "bg-rojo-error"}`}
            />
            {connected ? "En vivo" : "Reconectando..."}
          </div>
        </div>
        {barraControles}
      </div>
    );
  }

  if (vista === "pregunta" && pregunta) {
    const opciones = pregunta.opciones ?? [];
    const letras = ["A", "B", "C", "D"];
    const colores = [
      "bg-rojo",
      "bg-azul-light",
      "bg-dorado text-azul-dark",
      "bg-verde",
    ];
    const porcentaje =
      sesion.cronometro_segundos > 0
        ? (tiempoRestante / sesion.cronometro_segundos) * 100
        : 100;

    const conectados = jugadores.filter((j) => j.conectado);
    const respondidos = new Set(respuestas.map((r) => r.jugador_id));
    const totalConectados = conectados.length;
    const totalRespondidos = conectados.filter((j) =>
      respondidos.has(j.id),
    ).length;

    return (
      <div className="flex-1 flex flex-col p-6 md:p-10 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
            <span className="text-dorado font-heading font-bold">
              PIN: {sesion.pin}
            </span>
          </div>
          {sesion.cronometro_segundos > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-48 h-4 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dorado transition-all duration-200 rounded-full"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <span className="text-white font-heading font-extrabold text-3xl w-12 text-right">
                {tiempoRestante}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full space-y-8">
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-fade-in">
            <p className="text-texto text-2xl md:text-3xl font-body leading-relaxed text-center">
              {pregunta.enunciado}
            </p>
          </div>

          {imagenPreguntaUrl(pregunta) && (
            <div className="bg-white rounded-2xl p-3 shadow-2xl animate-fade-in flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenPreguntaUrl(pregunta)!}
                alt="Imagen de la pregunta"
                className="max-h-[38vh] max-w-full object-contain rounded-xl"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opciones.map((opcion, idx) => (
              <div
                key={letras[idx]}
                className={`${colores[idx]} p-6 rounded-2xl shadow-lg flex items-center text-white text-xl md:text-2xl font-heading font-bold animate-slide-up`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="text-3xl mr-4 opacity-80">{letras[idx]}</span>
                {opcion.replace(/^[A-D]\)\s*/, "")}
              </div>
            ))}
          </div>

          {totalConectados > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-40 h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-verde rounded-full transition-all duration-300"
                      style={{
                        width: `${(totalRespondidos / totalConectados) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-white font-heading font-bold text-sm">
                    {totalRespondidos}/{totalConectados} respondieron
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {conectados.map((j) => {
                  const respondio = respondidos.has(j.id);
                  return (
                    <span
                      key={j.id}
                      className={`px-3 py-1 rounded-full text-sm font-heading font-bold transition-all duration-200 ${
                        respondio
                          ? "bg-verde text-white"
                          : "bg-white/20 text-white/60"
                      }`}
                    >
                      {respondio && "✓"} {j.nombre}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {barraControles}
      </div>
    );
  }

  if (vista === "resultado" && pregunta) {
    const ordenadas = [...respuestas].sort(
      (a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999),
    );
    const correctas = ordenadas.filter((r) => r.correcta === true);
    const incorrectas = ordenadas.filter((r) => r.correcta !== true);
    const colores = [
      "text-dorado",
      "text-white",
      "text-white/80",
      "text-white/60",
    ];
    const medallas = ["🥇", "🥈", "🥉", "4°"];
    const nombreDe = (r: Respuesta) =>
      (r as Respuesta & { jugador_nombre?: string }).jugador_nombre ??
      jugadores.find((j) => j.id === r.jugador_id)?.nombre ??
      "";
    const items = [
      ...correctas.map((r, idx) => ({
        r,
        medalla: medallas[idx] ?? `${idx + 1}°`,
        color: colores[idx] ?? "text-white/50",
        esCorrecta: true,
      })),
      ...incorrectas.map((r) => ({
        r,
        medalla: "✘",
        color: "text-rojo-error",
        esCorrecta: false,
      })),
    ];

    // Jugadores conectados que NO respondieron esta pregunta
    const respondieron = new Set(respuestas.map((r) => r.jugador_id));
    const noRespondieron = jugadores.filter(
      (j) => j.conectado && !respondieron.has(j.id),
    );

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-2xl w-full text-center space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-2xl animate-fade-in">
            <p className="text-sm text-texto-light mb-1">Respuesta correcta</p>
            <p className="text-4xl font-heading font-extrabold text-verde">
              {pregunta.respuesta_correcta}
            </p>
          </div>

          <div className="space-y-3">
            {items.length === 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 animate-bounce-in">
                <p className="text-3xl">😅</p>
                <p className="text-white/80 font-heading font-bold text-xl mt-2">
                  Nadie acertó esta pregunta
                </p>
                <p className="text-white/50 text-sm mt-1">
                  Sin puntos para esta ronda
                </p>
              </div>
            )}
            {items.map(({ r, medalla, color, esCorrecta }, idx) => (
              <div
                key={r.id}
                className={`flex items-center justify-between rounded-xl p-4 animate-slide-up ${
                  esCorrecta
                    ? "bg-white/10 backdrop-blur-sm"
                    : "bg-rojo/10 border border-rojo/30"
                }`}
                style={{ animationDelay: `${idx * 200}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{medalla}</span>
                  <span
                    className={`font-heading font-bold text-xl ${color} ${
                      esCorrecta ? "" : "text-white/70"
                    }`}
                  >
                    {nombreDe(r)}
                  </span>
                </div>
                <span
                  className={`font-heading font-extrabold text-2xl ${
                    esCorrecta ? "text-dorado" : "text-rojo-error"
                  }`}
                >
                  {esCorrecta ? `+${r.puntos} pts` : "✘ Incorrecta"}
                </span>
              </div>
            ))}
            {noRespondieron.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-fade-in">
                <p className="text-white/50 text-sm font-heading font-bold mb-2">
                  Sin responder
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {noRespondieron.map((j) => (
                    <span
                      key={j.id}
                      className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-sm font-heading font-bold"
                    >
                      {j.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {barraControles}
      </div>
    );
  }

  if (vista === "reto") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🎯</div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-dorado">
            RETO LÚDICO
          </h1>
          {retoActivo ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 animate-fade-in space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
                {retoActivo.nombre}
              </h2>
              <span className="inline-block px-4 py-1 bg-dorado/20 text-dorado rounded-full text-sm font-heading font-bold">
                {retoActivo.tipo === "grupal" ? "👥 Grupal" : "🙋 Individual"}
              </span>
              <p className="text-white/80 text-xl md:text-2xl font-body leading-relaxed max-w-3xl mx-auto">
                {retoActivo.instrucciones}
              </p>
            </div>
          ) : (
            <p className="text-white/70 text-xl font-heading">
              Cargando actividad...
            </p>
          )}
        </div>
        {barraControles}
      </div>
    );
  }

  if (vista === "podium") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🏆</div>
          <h1 className="text-5xl font-heading font-extrabold text-dorado">
            PÓDIUM
          </h1>

          <div className="space-y-4">
            {podium.map((entry, idx) => (
              <div
                key={entry.entity_id}
                className={`flex items-center justify-between p-6 rounded-2xl shadow-xl animate-slide-up ${
                  entry.puesto === 1
                    ? "bg-dorado text-azul-dark scale-105"
                    : entry.puesto === 2
                      ? "bg-white/90 text-azul-dark"
                      : entry.puesto === 3
                        ? "bg-white/70 text-azul-dark"
                        : "bg-white/30 text-white"
                }`}
                style={{ animationDelay: `${idx * 300}ms` }}
              >
                <div className="flex items-center gap-5">
                  <span className="text-5xl">
                    {entry.puesto === 1
                      ? "🥇"
                      : entry.puesto === 2
                        ? "🥈"
                        : entry.puesto === 3
                          ? "🥉"
                          : `${entry.puesto}°`}
                  </span>
                  <span className="font-heading font-extrabold text-2xl md:text-3xl">
                    {entry.nombre}
                  </span>
                </div>
                <span className="font-heading font-extrabold text-3xl md:text-4xl">
                  {entry.puntos_total}
                  <span className="text-lg ml-1 opacity-70">pts</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        {barraControles}
      </div>
    );
  }

  if (vista === "final") {
    const estudiantes = podium.filter((e) => !e.es_colegio);
    const colegiosTabla =
      tabla.length > 0 ? tabla : podium.filter((e) => e.es_colegio);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-5xl w-full text-center space-y-8">
          <div className="text-6xl">🏁</div>
          <h1 className="text-4xl font-heading font-extrabold text-dorado">
            ¡Sesión terminada!
          </h1>
          <p className="text-white/70 text-lg">
            Resultados finales de este grupo
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-4">
                🎓 Puntos por estudiante
              </h2>
              <div className="space-y-2">
                {estudiantes.length === 0 && (
                  <p className="text-white/60 text-sm">Sin resultados.</p>
                )}
                {estudiantes.map((entry, idx) => (
                  <div
                    key={entry.entity_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 animate-slide-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {entry.puesto === 1
                          ? "🥇"
                          : entry.puesto === 2
                            ? "🥈"
                            : entry.puesto === 3
                              ? "🥉"
                              : `${entry.puesto}°`}
                      </span>
                      <span className="font-heading font-bold text-white text-lg">
                        {entry.nombre}
                      </span>
                    </div>
                    <span className="font-heading font-extrabold text-dorado text-xl">
                      {entry.puntos_total} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-4">
                🏫 Puntos por colegio
              </h2>
              <div className="space-y-2">
                {colegiosTabla.length === 0 && (
                  <p className="text-white/60 text-sm">Sin resultados.</p>
                )}
                {colegiosTabla.map((entry, idx) => (
                  <div
                    key={`${entry.nombre}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 animate-slide-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {entry.puesto === 1
                          ? "🥇"
                          : entry.puesto === 2
                            ? "🥈"
                            : entry.puesto === 3
                              ? "🥉"
                              : `${entry.puesto}°`}
                      </span>
                      <span className="font-heading font-bold text-white text-lg">
                        {entry.nombre}
                      </span>
                    </div>
                    <span className="font-heading font-extrabold text-dorado text-xl">
                      {entry.puntos_total} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={verPodium}
            disabled={controlesLoading}
            className="px-6 py-3 bg-dorado text-azul-dark rounded-xl font-heading font-bold text-lg hover:bg-dorado-light disabled:opacity-50"
          >
            Ver Podium 🏆
          </button>
        </div>
        {barraControles}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <div className="text-white text-xl font-heading">
        Estado: {sesion.estado}
      </div>
      {barraControles}
    </div>
  );
}

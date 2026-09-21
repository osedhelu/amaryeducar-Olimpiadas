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
  PuntajeReto,
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
  | "reto_podium"
  | "podium"
  | "final";

const LETRAS = ["A", "B", "C", "D"];
const COLORES_OPCION = [
  "bg-rojo",
  "bg-azul-light",
  "bg-dorado text-azul-dark",
  "bg-verde",
];
const COLORES_BARRA = ["bg-rojo", "bg-azul-light", "bg-dorado", "bg-verde"];

interface ConteoOpcion {
  letra: string;
  texto: string;
  count: number;
}

/** Cuenta cuántas respuestas eligieron cada opción (sin exponer nombres). */
function contarPorOpcion(
  respuestas: Respuesta[],
  opciones: string[] | null,
): ConteoOpcion[] {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of respuestas) {
    const k = (r.opcion_seleccionada ?? "").trim().toUpperCase();
    if (k in counts) counts[k] += 1;
  }
  return LETRAS.map((letra, i) => ({
    letra,
    texto: (opciones?.[i] ?? "").replace(/^[A-D]\)\s*/, ""),
    count: counts[letra],
  }));
}

export default function PresentacionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [retoActivo, setRetoActivo] = useState<Reto | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [puntajesReto, setPuntajesReto] = useState<PuntajeReto[]>([]);
  const [podium, setPodium] = useState<PodiumEntry[]>([]);
  const [tabla, setTabla] = useState<TablaColegio[]>([]);
  const [vista, setVista] = useState<Vista>("bienvenida");
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const { lastEvent, connected } = useWebSocket(sessionId, "presentacion");

  const cargarEstado = useCallback(async () => {
    const s = await api.sesion(sessionId);
    if (!s) return;
    setSesion(s);

    const j = await api.jugadores(s.id);
    setJugadores(j);

    if (
      (s.estado === "reto" || s.estado === "reto_podium") &&
      s.reto_activo_id
    ) {
      const retos = await api.retos(s.grado_id);
      setRetoActivo(retos.find((r) => r.id === s.reto_activo_id) ?? null);
      if (s.estado === "reto_podium") {
        const pr = await api.puntajesReto(s.reto_activo_id, s.id);
        setPuntajesReto([...pr].sort((a, b) => a.puesto - b.puesto));
      }
    } else {
      setRetoActivo(null);
      setPuntajesReto([]);
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
        if (
          (ev.data.estado === "reto" || ev.data.estado === "reto_podium") &&
          ev.data.reto_activo_id
        ) {
          api.retos(ev.data.grado_id).then((retos) => {
            setRetoActivo(
              retos.find((r) => r.id === ev.data.reto_activo_id) ?? null,
            );
          });
          if (ev.data.estado === "reto_podium") {
            api
              .puntajesReto(ev.data.reto_activo_id, ev.data.id)
              .then((pr) =>
                setPuntajesReto([...pr].sort((a, b) => a.puesto - b.puesto)),
              );
          }
        } else if (
          ev.data.estado !== "reto" &&
          ev.data.estado !== "reto_podium"
        ) {
          setRetoActivo(null);
          setPuntajesReto([]);
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
  // pregunta, para que la distribución siempre sea correcta aunque se pierda
  // un evento WebSocket.
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
    else if (sesion.estado === "reto_podium") setVista("reto_podium");
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
      </div>
    );
  }

  if (vista === "pregunta" && pregunta) {
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
    const esMultiple = pregunta.tipo === "opcion-multiple";
    const conteos = contarPorOpcion(respuestas, pregunta.opciones);
    const maxCount = Math.max(1, ...conteos.map((c) => c.count));
    const opciones = pregunta.opciones ?? [];

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

          {esMultiple && opciones.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opciones.map((opcion, idx) => (
                <div
                  key={LETRAS[idx]}
                  className={`${COLORES_OPCION[idx]} p-6 rounded-2xl shadow-lg flex items-center text-white text-xl md:text-2xl font-heading font-bold animate-slide-up`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <span className="text-3xl mr-4 opacity-80">
                    {LETRAS[idx]}
                  </span>
                  {opcion.replace(/^[A-D]\)\s*/, "")}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-40 h-2.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-verde rounded-full transition-all duration-300"
                  style={{
                    width: `${totalConectados > 0 ? (totalRespondidos / totalConectados) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-white font-heading font-bold text-sm">
                {totalRespondidos}/{totalConectados} respondieron
              </span>
            </div>
            {esMultiple ? (
              <div className="space-y-2">
                {conteos.map((c, i) => (
                  <div key={c.letra} className="flex items-center gap-3">
                    <span className="w-6 text-white font-heading font-extrabold">
                      {c.letra}
                    </span>
                    <div className="flex-1 h-7 bg-white/10 rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${COLORES_BARRA[i]} transition-all duration-500`}
                        style={{ width: `${(c.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-white font-heading font-bold">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm text-center">
                Las respuestas abiertas se revelan al cierre de la pregunta.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (vista === "resultado" && pregunta) {
    const esMultiple = pregunta.tipo === "opcion-multiple";
    const correcta = (pregunta.respuesta_correcta ?? "").trim().toUpperCase();
    const conteos = contarPorOpcion(respuestas, pregunta.opciones);
    const maxCount = Math.max(1, ...conteos.map((c) => c.count));

    const conectados = jugadores.filter((j) => j.conectado);
    const respondieron = new Set(respuestas.map((r) => r.jugador_id));
    const totalRespondidos = respuestas.length;
    const sinResponder = conectados.filter(
      (j) => !respondieron.has(j.id),
    ).length;
    const acertaron = respuestas.filter((r) => r.correcta === true).length;
    const fallaron = totalRespondidos - acertaron;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="text-5xl animate-bounce-in">🎉</div>
          <h1 className="text-4xl font-heading font-extrabold text-dorado">
            ¡Ronda completada!
          </h1>

          {esMultiple ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 text-left">
              <p className="text-white/60 text-sm font-heading font-bold uppercase mb-4 text-center">
                Distribución de respuestas
              </p>
              <div className="space-y-3">
                {conteos.map((c, i) => {
                  const esCorrecta = c.letra === correcta;
                  const atenuar = correcta && !esCorrecta;
                  return (
                    <div
                      key={c.letra}
                      className={`flex items-center gap-3 animate-slide-up ${atenuar ? "opacity-50" : ""}`}
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <span
                        className={`w-7 text-2xl font-heading font-extrabold text-center ${
                          esCorrecta ? "text-verde" : "text-white/80"
                        }`}
                      >
                        {esCorrecta ? "✓" : c.letra}
                      </span>
                      <div className="flex-1">
                        <div className="h-10 bg-white/10 rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${COLORES_BARRA[i]} transition-all duration-700`}
                            style={{ width: `${(c.count / maxCount) * 100}%` }}
                          />
                        </div>
                        {c.texto && (
                          <p className="text-white/60 text-xs mt-1">
                            {c.texto}
                          </p>
                        )}
                      </div>
                      <span className="w-10 text-right text-white font-heading font-bold text-xl">
                        {c.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <p className="text-white/80 font-heading text-xl">
                {totalRespondidos === 0
                  ? "Nadie respondió esta pregunta"
                  : "Respuestas recibidas"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-verde/20 rounded-2xl p-4 animate-bounce-in">
              <p className="text-4xl font-heading font-extrabold text-verde">
                {acertaron}
              </p>
              <p className="text-white/70 text-sm">acertaron</p>
            </div>
            <div className="bg-rojo/20 rounded-2xl p-4 animate-bounce-in">
              <p className="text-4xl font-heading font-extrabold text-rojo-error">
                {fallaron}
              </p>
              <p className="text-white/70 text-sm">fallaron</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 animate-bounce-in">
              <p className="text-4xl font-heading font-extrabold text-white/70">
                {sinResponder}
              </p>
              <p className="text-white/70 text-sm">sin responder</p>
            </div>
          </div>
        </div>
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
      </div>
    );
  }

  if (vista === "reto_podium") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🎯🏆</div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-dorado">
            Resultado del reto
          </h1>
          {retoActivo && (
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
              {retoActivo.nombre}
            </h2>
          )}

          {puntajesReto.length === 0 ? (
            <p className="text-white/70 text-xl font-heading">
              Aún no hay puestos asignados en este reto.
            </p>
          ) : (
            <div className="space-y-4">
              {puntajesReto.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-6 rounded-2xl shadow-xl animate-slide-up ${
                    p.puesto === 1
                      ? "bg-dorado text-azul-dark scale-105"
                      : p.puesto === 2
                        ? "bg-white/90 text-azul-dark"
                        : p.puesto === 3
                          ? "bg-white/70 text-azul-dark"
                          : "bg-white/30 text-white"
                  }`}
                  style={{ animationDelay: `${idx * 300}ms` }}
                >
                  <div className="flex items-center gap-5">
                    <span className="text-5xl">
                      {p.puesto === 1
                        ? "🥇"
                        : p.puesto === 2
                          ? "🥈"
                          : p.puesto === 3
                            ? "🥉"
                            : `${p.puesto}°`}
                    </span>
                    <span className="font-heading font-extrabold text-2xl md:text-3xl">
                      {p.nombre ?? "—"}
                    </span>
                  </div>
                  <span className="font-heading font-extrabold text-3xl md:text-4xl">
                    {p.puntos}
                    <span className="text-lg ml-1 opacity-70">pts</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <div className="text-white text-xl font-heading">
        Estado: {sesion.estado}
      </div>
    </div>
  );
}

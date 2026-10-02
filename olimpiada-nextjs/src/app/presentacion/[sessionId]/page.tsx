"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api, imagenPreguntaUrl } from "@/lib/api";
import { useParametros, tieneRetos } from "@/lib/parametros";
import type {
  GanadorRonda,
  SesionJuego,
  Pregunta,
  Jugador,
  PodiumEntry,
  PuntajeReto,
  Respuesta,
  EventoWS,
  Reto,
  EstadoVida,
} from "@/types/game";

type Vista =
  | "bienvenida"
  | "lobby"
  | "pregunta"
  | "resultado"
  | "reto"
  | "reto_podium"
  | "ronda_ganador"
  | "podium"
  | "final";

export default function PresentacionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const parametros = useParametros();
  const retosActivos = tieneRetos(parametros);

  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [retoActivo, setRetoActivo] = useState<Reto | null>(null);
  const [ganadorRonda, setGanadorRonda] = useState<GanadorRonda | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [puntajesReto, setPuntajesReto] = useState<PuntajeReto[]>([]);
  const [podium, setPodium] = useState<PodiumEntry[]>([]);
  const [vidas, setVidas] = useState<EstadoVida[]>([]);
  const [vista, setVista] = useState<Vista>("bienvenida");
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const { lastEvent, connected } = useWebSocket(sessionId, "presentacion");

  const cargarVidas = useCallback(async (sesionId: string) => {
    try {
      setVidas(await api.vidasSesion(sesionId));
    } catch {
      /* sistema de vidas opcional */
    }
  }, []);

  const cargarEstado = useCallback(async () => {
    const s = await api.sesion(sessionId);
    if (!s) return;
    setSesion(s);

    const j = await api.jugadores(s.id);
    setJugadores(j);
    await cargarVidas(s.id);

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

    if (s.ronda_ganador_num != null) {
      api
        .ganadorRonda(s.id, s.ronda_ganador_num)
        .then(setGanadorRonda)
        .catch(() => setGanadorRonda(null));
    } else {
      setGanadorRonda(null);
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
        cargarVidas(ev.data.id);
        if (ev.data.ronda_ganador_num != null) {
          api
            .ganadorRonda(ev.data.id, ev.data.ronda_ganador_num)
            .then(setGanadorRonda)
            .catch(() => {});
        } else {
          setGanadorRonda(null);
        }
        if (ev.data.estado === "podium" || ev.data.estado === "final") {
          api.podium(ev.data.id).then(setPodium);
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
      case "vidas_cambio":
        setVidas((prev) => {
          const sinEse = prev.filter(
            (v) => v.jugador_id !== ev.data.jugador_id,
          );
          return [...sinEse, ev.data].sort((a, b) =>
            a.nombre.localeCompare(b.nombre),
          );
        });
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
    // El pódium/final tiene prioridad sobre el ganador de ronda: cuando el
    // docente pulsa "Ver Podium" la pantalla grande debe cambiar de vista.
    if (sesion.estado === "podium") {
      setVista("podium");
      return;
    }
    if (sesion.estado === "final") {
      setVista("final");
      return;
    }
    if (sesion.ronda_ganador_num != null) {
      setVista("ronda_ganador");
      return;
    }
    if (sesion.estado === "lobby") setVista("lobby");
    else if (sesion.estado === "pregunta") setVista("pregunta");
    else if (sesion.estado === "resultado") setVista("resultado");
    else if (sesion.estado === "reto") setVista("reto");
    else if (sesion.estado === "reto_podium") setVista("reto_podium");
  }, [sesion?.estado, sesion?.ronda_ganador_num]);

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
      <div className="flex-1 flex items-center justify-center bg-bg min-h-screen">
        <div className="text-azul text-3xl font-heading font-bold animate-pulse">
          Cargando...
        </div>
      </div>
    );
  }

  const estaEliminado = (nombre: string): boolean =>
    vidas.find((v) => v.nombre === nombre)?.eliminado ?? false;

  if (vista === "bienvenida" || vista === "lobby") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-4xl w-full text-center space-y-8 animate-fade-in">
          <div className="text-7xl">🏆</div>
          <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-azul">
            {parametros.nombre_institucion}
          </h1>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-azul">
            {parametros.nombre_evento}
          </h2>

          <div className="bg-bg-card border border-azul/10 rounded-2xl p-6 max-w-sm mx-auto">
            <p className="text-texto-light text-sm mb-1">
              {parametros.texto_pin_label}
            </p>
            <p className="text-azul text-6xl font-heading font-extrabold tracking-widest">
              {sesion.pin}
            </p>
          </div>

          <div>
            <p className="text-texto-light text-sm mb-2">
              Jugadores conectados
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {jugadores.map((j) => (
                <span
                  key={j.id}
                  className="px-3 py-1 bg-dorado/20 text-azul rounded-full text-sm font-heading font-bold animate-bounce-in"
                >
                  {j.nombre}
                </span>
              ))}
            </div>
            <p className="text-texto-light text-sm mt-2">
              {jugadores.length} participantes
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-texto-light text-sm">
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

    return (
      <div className="flex-1 flex flex-col p-6 md:p-10 bg-bg min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-bg-card border border-azul/10 px-4 py-2 rounded-xl">
            <span className="text-azul font-heading font-bold">
              PIN: {sesion.pin}
            </span>
          </div>
          {sesion.cronometro_segundos > 0 && (
            <div className="flex items-center gap-3">
              <div className="w-48 h-4 bg-azul/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dorado transition-all duration-200 rounded-full"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <span className="text-texto font-heading font-extrabold text-3xl w-12 text-right">
                {tiempoRestante}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full space-y-8">
          <div className="bg-azul rounded-2xl p-8 shadow-2xl animate-fade-in">
            <p className="text-white text-2xl md:text-3xl font-body leading-relaxed text-center">
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

          <div className="bg-bg-card rounded-2xl p-4 border border-azul/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-40 h-2.5 bg-azul/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-verde rounded-full transition-all duration-300"
                  style={{
                    width: `${totalConectados > 0 ? (totalRespondidos / totalConectados) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-texto font-heading font-bold text-sm">
                {totalRespondidos}/{totalConectados} respondieron
              </span>
            </div>
            {vidas.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {vidas.map((e) => (
                  <span
                    key={e.jugador_id}
                    className={`px-3 py-1 rounded-full text-xs font-heading font-bold ${
                      e.eliminado
                        ? "bg-rojo/10 text-rojo-error line-through opacity-70"
                        : "bg-verde/10 text-verde"
                    }`}
                  >
                    {e.nombre} ·{" "}
                    {e.eliminado
                      ? "☠️ 0"
                      : `❤️ ${e.vidas_restantes}/${e.vidas_max}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (vista === "resultado" && pregunta) {
    const conectados = jugadores.filter((j) => j.conectado);
    const respondieron = new Set(respuestas.map((r) => r.jugador_id));
    const totalRespondidos = respuestas.length;
    const sinResponder = conectados.filter(
      (j) => !respondieron.has(j.id),
    ).length;
    const acertaron = respuestas.filter((r) => r.correcta === true).length;
    const fallaron = totalRespondidos - acertaron;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="text-5xl animate-bounce-in">🎉</div>
          <h1 className="text-4xl font-heading font-extrabold text-azul">
            {parametros.texto_ronda_completada}
          </h1>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-verde/20 rounded-2xl p-4 animate-bounce-in">
              <p className="text-4xl font-heading font-extrabold text-verde">
                {acertaron}
              </p>
              <p className="text-texto-light text-sm">acertaron</p>
            </div>
            <div className="bg-rojo/20 rounded-2xl p-4 animate-bounce-in">
              <p className="text-4xl font-heading font-extrabold text-rojo-error">
                {fallaron}
              </p>
              <p className="text-texto-light text-sm">fallaron</p>
            </div>
            <div className="bg-bg-card border border-azul/10 rounded-2xl p-4 animate-bounce-in">
              <p className="text-4xl font-heading font-extrabold text-texto-light">
                {sinResponder}
              </p>
              <p className="text-texto-light text-sm">sin responder</p>
            </div>
          </div>

          {vidas.length > 0 && (
            <div className="bg-bg-card border border-azul/10 rounded-2xl p-4 animate-fade-in">
              <p className="text-sm font-bold text-azul mb-3">
                ❤️ Vidas restantes
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {vidas.map((e) => (
                  <span
                    key={e.jugador_id}
                    className={`px-4 py-2 rounded-full text-sm font-heading font-bold flex items-center gap-2 ${
                      e.eliminado
                        ? "bg-rojo/10 text-rojo-error line-through opacity-80"
                        : "bg-verde/10 text-verde"
                    }`}
                  >
                    <span>{e.nombre}</span>
                    <span className="text-base">
                      {e.eliminado
                        ? "☠️ 0 vidas"
                        : `❤️ ${e.vidas_restantes}/${e.vidas_max}`}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (retosActivos && vista === "reto") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🎯</div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-azul">
            RETO LÚDICO
          </h1>
          {retoActivo ? (
            <div className="bg-bg-card border border-azul/10 rounded-2xl p-8 animate-fade-in space-y-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-azul-dark">
                {retoActivo.nombre}
              </h2>
              <span className="inline-block px-4 py-1 bg-dorado/20 text-azul rounded-full text-sm font-heading font-bold">
                {retoActivo.tipo === "grupal" ? "👥 Grupal" : "🙋 Individual"}
              </span>
              <p className="text-texto text-xl md:text-2xl font-body leading-relaxed max-w-3xl mx-auto">
                {retoActivo.instrucciones}
              </p>
            </div>
          ) : (
            <p className="text-texto-light text-xl font-heading">
              Cargando actividad...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (retosActivos && vista === "reto_podium") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🎯🏆</div>
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-azul">
            Resultado del reto
          </h1>
          {retoActivo && (
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-azul-dark">
              {retoActivo.nombre}
            </h2>
          )}

          {puntajesReto.length === 0 ? (
            <p className="text-texto-light text-xl font-heading">
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
                        ? "bg-bg-card text-texto"
                        : p.puesto === 3
                          ? "bg-white border border-azul/15 text-texto"
                          : "bg-white border border-azul/10 text-texto-light"
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

  if (vista === "ronda_ganador") {
    const ronda = sesion.ronda_ganador_num ?? ganadorRonda?.ronda ?? 1;
    const ranking = ganadorRonda?.ranking ?? [];
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🏆</div>
          <h1 className="text-5xl font-heading font-extrabold text-azul">
            Ganador de la Ronda {ronda}
          </h1>
          <div className="space-y-4">
            {ranking.length === 0 && (
              <p className="text-texto-light text-xl">
                Aún no hay respuestas en esta ronda.
              </p>
            )}
            {ranking.map((e, idx) => (
              <div
                key={e.puesto}
                className={`flex items-center justify-between p-6 rounded-2xl shadow-xl animate-slide-up ${
                  e.puesto === 1
                    ? "bg-dorado text-azul-dark scale-105"
                    : e.puesto === 2
                      ? "bg-bg-card text-texto"
                      : e.puesto === 3
                        ? "bg-white border border-azul/15 text-texto"
                        : "bg-white border border-azul/10 text-texto-light"
                }`}
                style={{ animationDelay: `${idx * 250}ms` }}
              >
                <div className="flex items-center gap-5">
                  <span className="text-5xl">
                    {e.puesto === 1
                      ? "🥇"
                      : e.puesto === 2
                        ? "🥈"
                        : e.puesto === 3
                          ? "🥉"
                          : `${e.puesto}°`}
                  </span>
                  <span className="font-heading font-extrabold text-2xl md:text-3xl">
                    {e.nombre}
                  </span>
                </div>
                <span className="font-heading font-extrabold text-2xl md:text-3xl">
                  {e.aciertos}
                  <span className="text-lg ml-1 opacity-70">aciertos</span>
                </span>
              </div>
            ))}
          </div>
          {ganadorRonda && (
            <p className="text-texto-light text-sm">
              Ronda {ronda} · {ganadorRonda.total_preguntas} preguntas
            </p>
          )}
        </div>
      </div>
    );
  }

  if (vista === "podium") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="text-7xl animate-bounce-in">🏆</div>
          <h1 className="text-5xl font-heading font-extrabold text-azul">
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
                      ? "bg-bg-card text-texto"
                      : entry.puesto === 3
                        ? "bg-white border border-azul/15 text-texto"
                        : "bg-white border border-azul/10 text-texto-light"
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
                  <span
                    className={`font-heading font-extrabold text-2xl md:text-3xl ${
                      !entry.es_colegio && estaEliminado(entry.nombre)
                        ? "opacity-50 line-through"
                        : ""
                    }`}
                  >
                    {entry.nombre}
                    {!entry.es_colegio && estaEliminado(entry.nombre) && (
                      <span className="ml-2">💔</span>
                    )}
                  </span>
                </div>
                <span className="font-heading font-extrabold text-3xl md:text-4xl">
                  {entry.puntos_total}
                  <span className="text-lg ml-1 opacity-70">pts</span>
                  {entry.aciertos != null && (
                    <span className="block text-sm font-bold opacity-70 text-right">
                      {entry.aciertos} aciertos
                      {entry.respondidas != null
                        ? ` · ${entry.respondidas} respondidas`
                        : ""}
                    </span>
                  )}
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

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="max-w-3xl w-full text-center space-y-8">
          <div className="text-6xl">🏁</div>
          <h1 className="text-4xl font-heading font-extrabold text-azul">
            ¡Sesión terminada!
          </h1>
          <p className="text-texto-light text-lg">
            Resultados finales de este grupo
          </p>

          <div className="bg-bg-card border border-azul/10 rounded-2xl p-6 text-left">
            <h2 className="text-2xl font-heading font-bold text-azul mb-4 text-center">
              🎓 Puntos por estudiante
            </h2>
            <div className="space-y-2">
              {estudiantes.length === 0 && (
                <p className="text-texto-light text-sm">Sin resultados.</p>
              )}
              {estudiantes.map((entry, idx) => (
                <div
                  key={entry.entity_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-azul/10 animate-slide-up"
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
                    <span
                      className={`font-heading font-bold text-texto text-lg ${
                        estaEliminado(entry.nombre)
                          ? "opacity-60 line-through"
                          : ""
                      }`}
                    >
                      {entry.nombre}
                      {estaEliminado(entry.nombre) && (
                        <span className="ml-1">💔</span>
                      )}
                    </span>
                  </div>
                  <span className="font-heading font-extrabold text-azul text-xl">
                    {entry.puntos_total} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-bg min-h-screen">
      <div className="text-texto text-xl font-heading">
        Estado: {sesion.estado}
      </div>
    </div>
  );
}

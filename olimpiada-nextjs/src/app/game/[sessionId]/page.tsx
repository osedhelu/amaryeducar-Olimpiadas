"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api, imagenPreguntaUrl } from "@/lib/api";
import {
  useParametros,
  tieneRetos,
  vidasHabilitadas,
  numVidas,
  sonidoHabilitado,
} from "@/lib/parametros";
import { getDatosSesionEstudiante } from "@/lib/session";
import { sonido } from "@/lib/sound";
import { fuegoConfeti } from "@/components/Confetti";
import type {
  SesionJuego,
  Pregunta,
  Respuesta,
  EventoWS,
  EstadoVida,
} from "@/types/game";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const parametros = useParametros();
  const retosActivos = tieneRetos(parametros);
  const vidasActivas = vidasHabilitadas(parametros);
  const maxVidas = numVidas(parametros);
  const sonidoActivo = sonidoHabilitado(parametros);

  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [preguntaActual, setPreguntaActual] = useState<Pregunta | null>(null);
  const [jugadorNombre, setJugadorNombre] = useState("");
  const [respuestaEnviada, setRespuestaEnviada] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<{
    correcta: boolean;
    puntos: number;
  } | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [vidas, setVidas] = useState<EstadoVida | null>(null);
  const vidasRef = useRef<EstadoVida | null>(null);

  useEffect(() => {
    vidasRef.current = vidas;
  }, [vidas]);

  const { lastEvent, connected } = useWebSocket(sessionId, "student");

  const cargarVidas = useCallback(async () => {
    const datos = getDatosSesionEstudiante();
    if (!datos.jugadorId) return;
    try {
      const todas = await api.vidasSesion(sessionId);
      const mia = todas.find((v) => v.jugador_id === datos.jugadorId) ?? null;
      setVidas(mia);
    } catch {
      /* sistema de vidas opcional */
    }
  }, [sessionId]);

  const cargarEstado = useCallback(async () => {
    const datos = getDatosSesionEstudiante();
    if (!datos.nombre || !datos.sesionId || datos.sesionId !== sessionId) {
      router.push("/join");
      return;
    }
    setJugadorNombre(datos.nombre);

    const ses = await api.sesion(sessionId);
    setSesion(ses);

    if (ses?.pregunta_activa_id) {
      const pregunta = await api.preguntasPorId(ses.pregunta_activa_id);
      setPreguntaActual(pregunta);
      verificarRespuestaExistente(ses.pregunta_activa_id);
    }

    cargarVidas();
  }, [sessionId, router]);

  async function verificarRespuestaExistente(preguntaId: string) {
    const jugadorId = getDatosSesionEstudiante().jugadorId;
    if (!jugadorId) return;

    try {
      const yaRespondida = await api.verificarRespuesta(preguntaId, jugadorId);
      if (yaRespondida) {
        setRespuestaEnviada(true);
        setUltimoResultado({
          correcta: yaRespondida.correcta === true,
          puntos: yaRespondida.puntos,
        });
      }
    } catch {
      /* sin respuesta previa */
    }
  }

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  useEffect(() => {
    if (!lastEvent) return;

    const ev = lastEvent as EventoWS;
    switch (ev.tipo) {
      case "sesion_cambio": {
        setSesion(ev.data);
        cargarVidas();
        if (ev.data.pregunta_activa_id) {
          const preguntaId: string = ev.data.pregunta_activa_id;
          api.preguntasPorId(preguntaId).then((p) => {
            setPreguntaActual(p);
            setRespuestaEnviada(false);
            setUltimoResultado(null);
            verificarRespuestaExistente(preguntaId);
          });
        } else {
          setPreguntaActual(null);
        }
        break;
      }
      case "cronometro":
        setTiempoRestante(ev.data.segundos_restantes);
        break;
      case "resultado_pregunta": {
        const sesionEstudiante = getDatosSesionEstudiante();
        const jugadorId = sesionEstudiante.jugadorId;
        if (ev.data.estados?.length) {
          const mia = ev.data.estados.find((e) => e.jugador_id === jugadorId);
          if (mia) setVidas(mia);
        }
        const miRespuesta = ev.data.respuestas.find(
          (r) => r.jugador_id === jugadorId,
        );
        if (miRespuesta) {
          setUltimoResultado({
            correcta: miRespuesta.correcta === true,
            puntos: miRespuesta.puntos,
          });
          if (sonidoActivo) {
            if (miRespuesta.correcta === true) {
              sonido.play("correcto");
              fuegoConfeti();
            } else {
              sonido.play("incorrecto");
            }
          }
          if (miRespuesta.eliminado != null) {
            setVidas((prev) =>
              prev
                ? {
                    ...prev,
                    vidas_restantes:
                      miRespuesta.vidas_restantes ?? prev.vidas_restantes,
                    errores: miRespuesta.errores ?? prev.errores,
                    eliminado: miRespuesta.eliminado ?? prev.eliminado,
                  }
                : prev,
            );
          }
        }
        setRespuestaEnviada(true);
        break;
      }
      case "vidas_cambio":
        if (ev.data.jugador_id === getDatosSesionEstudiante().jugadorId) {
          if (sonidoActivo) {
            const prev = vidasRef.current;
            if (prev && ev.data.errores > prev.errores) {
              sonido.play(ev.data.eliminado ? "eliminado" : "perder-vida");
            }
          }
          setVidas(ev.data);
        }
        break;
      default:
        break;
    }
  }, [lastEvent]);

  useEffect(() => {
    if (!sesion?.cronometro_inicio || !sesion?.cronometro_segundos) return;
    const inicio = new Date(sesion.cronometro_inicio).getTime();
    const total = sesion.cronometro_segundos;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - inicio) / 1000);
      const remaining = Math.max(0, total - elapsed);
      setTiempoRestante(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, [sesion?.cronometro_inicio, sesion?.cronometro_segundos]);

  async function enviarRespuesta(opcion: string) {
    if (respuestaEnviada || !preguntaActual) return;

    const { getDatosSesionEstudiante } = await import("@/lib/session");
    const jugadorId = getDatosSesionEstudiante().jugadorId;
    if (!jugadorId) return;

    sonido.unlock();

    try {
      const timestampCliente = new Date().toISOString();
      const res = await api.enviarRespuesta({
        pregunta_id: preguntaActual.id,
        jugador_id: jugadorId,
        opcion_seleccionada: opcion,
        enviado_en: timestampCliente,
      });
      // Actualizar las vidas CON la respuesta del servidor (fuente de verdad),
      // para no depender del timing del evento vidas_cambio por WebSocket.
      const vres = res?.vidas_restantes;
      if (vres != null) {
        const errores = res?.errores;
        const eliminado = res?.eliminado;
        setVidas((prev) => ({
          jugador_id: jugadorId,
          nombre: prev?.nombre ?? jugadorNombre,
          conectado: true,
          aciertos: prev?.aciertos ?? 0,
          errores: errores ?? prev?.errores ?? 0,
          vidas_restantes: vres,
          vidas_max: prev?.vidas_max ?? maxVidas,
          eliminado: eliminado ?? prev?.eliminado ?? false,
        }));
      }
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("vidas")) {
        // El servidor rechazó por vidas (409): el jugador quedó eliminado.
        // Marcar al instante; el evento vidas_cambio confirma el estado real.
        setVidas((prev) =>
          prev
            ? { ...prev, vidas_restantes: 0, eliminado: true }
            : {
                jugador_id: jugadorId,
                nombre: jugadorNombre,
                conectado: true,
                aciertos: 0,
                errores: maxVidas,
                vidas_restantes: 0,
                vidas_max: maxVidas,
                eliminado: true,
              },
        );
        return;
      }
      const yaRespondio =
        err instanceof Error &&
        (err.message.includes("duplicate") ||
          err.message.includes("Ya respondiste"));
      if (!yaRespondio) {
        console.error("Error al enviar respuesta:", err);
        return;
      }
    }
    setRespuestaEnviada(true);
  }

  if (!sesion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg min-h-screen">
        <div className="text-azul text-xl font-heading">Cargando...</div>
      </div>
    );
  }

  if (sesion.estado === "lobby") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="text-6xl mb-4 animate-bounce-in">⏳</div>
        <h1 className="text-3xl font-heading font-bold text-azul mb-2">
          ¡Hola, {jugadorNombre}!
        </h1>
        <p className="text-azul text-xl font-heading mb-4">
          Esperando al docente...
        </p>
        <div className="flex items-center gap-2 text-texto-light text-sm">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-verde" : "bg-rojo-error"}`}
          />
          {connected ? "Conectado" : "Reconectando..."}
        </div>
      </div>
    );
  }

  if (
    vidasActivas &&
    vidas?.eliminado &&
    (sesion.estado === "pregunta" || sesion.estado === "resultado")
  ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="text-center animate-bounce-in space-y-6">
          <div className="text-8xl">💔</div>
          <h1 className="text-4xl font-heading font-extrabold text-rojo-error">
            Perdiste todas tus vidas
          </h1>
          <p className="text-texto text-lg">
            Ya no puedes seguir respondiendo, {jugadorNombre}.
          </p>
          <p className="text-texto-light text-sm">
            La sección continúa. ¡Gracias por participar!
          </p>
        </div>
      </div>
    );
  }

  if (sesion.estado === "resultado" && ultimoResultado) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div
          className={`text-center ${
            ultimoResultado.correcta ? "animate-bounce-in" : "animate-shake"
          }`}
        >
          <div className="text-6xl mb-4">
            {ultimoResultado.correcta ? "🎉" : "😔"}
          </div>
          <h2 className="text-2xl font-heading font-bold text-azul-dark mb-2">
            {ultimoResultado.correcta ? "¡Correcto!" : "Incorrecto"}
          </h2>
          {ultimoResultado.correcta && (
            <div className="text-azul text-4xl font-heading font-extrabold animate-pop">
              +{ultimoResultado.puntos} pts
            </div>
          )}
          {vidasActivas && vidas && (
            <div className="flex items-center justify-center gap-0.5 mt-4 text-2xl">
              {Array.from({ length: maxVidas }).map((_, i) => (
                <span
                  key={i}
                  className={`${i < vidas.vidas_restantes ? "" : "opacity-25 grayscale"}`}
                >
                  ❤️
                </span>
              ))}
              <span className="ml-2 text-azul font-heading font-bold text-base">
                {vidas.vidas_restantes}/{vidas.vidas_max} vidas
              </span>
            </div>
          )}
          <p className="text-texto-light mt-4">
            Esperando la siguiente pregunta...
          </p>
        </div>
      </div>
    );
  }

  if (preguntaActual && sesion.estado === "pregunta") {
    const opciones = preguntaActual.opciones ?? [];
    const letras = ["A", "B", "C", "D"];
    const porcentajeTiempo =
      sesion.cronometro_segundos > 0
        ? (tiempoRestante / sesion.cronometro_segundos) * 100
        : 100;

    return (
      <div className="flex-1 flex flex-col p-4 md:p-8 bg-bg min-h-screen">
        <div className="flex justify-between items-center mb-4 gap-3">
          <span className="text-azul font-heading font-bold text-sm">
            {jugadorNombre}
          </span>
          {vidasActivas && vidas && (
            <div className="flex items-center gap-1 text-lg">
              {Array.from({ length: maxVidas }).map((_, i) => (
                <span
                  key={i}
                  className={`${i < vidas.vidas_restantes ? "" : "opacity-25 grayscale"}`}
                >
                  ❤️
                </span>
              ))}
              <span className="ml-1 text-azul font-heading font-bold text-sm">
                {vidas.vidas_restantes}/{vidas.vidas_max}
              </span>
            </div>
          )}
          {sesion.cronometro_segundos > 0 && (
            <div className="flex items-center gap-2">
              <div
                className={`w-32 h-3 rounded-full ${
                  tiempoRestante > 0 && tiempoRestante <= 5
                    ? "animate-pulse-ring"
                    : ""
                } ${tiempoRestante > 0 && tiempoRestante <= 5 ? "bg-dorado/30" : "bg-azul/15"} overflow-hidden`}
              >
                <div
                  className="h-full bg-dorado transition-all duration-250"
                  style={{ width: `${porcentajeTiempo}%` }}
                />
              </div>
              <span
                className={`font-heading font-bold text-sm w-8 text-right ${
                  tiempoRestante > 0 && tiempoRestante <= 5
                    ? "text-dorado text-base"
                    : "text-azul"
                }`}
              >
                {tiempoRestante}s
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full space-y-6">
          <div className="bg-azul rounded-2xl p-6 animate-zoom-in">
            <p className="text-white text-lg md:text-xl font-body leading-relaxed">
              {preguntaActual.enunciado}
            </p>
          </div>

          {imagenPreguntaUrl(preguntaActual) && (
            <div className="bg-white rounded-2xl p-2 shadow-lg animate-fade-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenPreguntaUrl(preguntaActual)!}
                alt="Imagen de la pregunta"
                className="w-full max-h-[42vh] object-contain rounded-xl"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {opciones.map((opcion, idx) => (
              <button
                key={letras[idx]}
                onClick={() => enviarRespuesta(letras[idx])}
                disabled={respuestaEnviada}
                className={`
                  p-4 rounded-xl font-heading font-bold text-left text-lg
                  transition-all duration-200 transform
                  ${idx === 0 ? "bg-rojo hover:bg-rojo/80" : ""}
                  ${idx === 1 ? "bg-azul-light hover:bg-azul-light/80" : ""}
                  ${idx === 2 ? "bg-dorado hover:bg-dorado/80 text-azul-dark" : ""}
                  ${idx === 3 ? "bg-verde hover:bg-verde/80" : ""}
                  ${respuestaEnviada ? "opacity-50 cursor-not-allowed" : "hover:scale-102 active:scale-98"}
                  text-white
                `}
              >
                <span className="mr-3 text-xl">{letras[idx]}</span>
                {opcion.replace(/^[A-D]\)\s*/, "")}
              </button>
            ))}
          </div>

          {respuestaEnviada && (
            <div className="text-center text-azul font-heading animate-fade-in">
              ✓ Respuesta enviada
            </div>
          )}
        </div>
      </div>
    );
  }

  if (sesion.estado === "final") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="text-center animate-bounce-in space-y-6">
          <div className="text-8xl">🏁</div>
          <h1 className="text-4xl font-heading font-extrabold text-azul">
            ¡La sesión ha finalizado!
          </h1>
          <p className="text-texto-light text-lg">
            Gracias por participar, {jugadorNombre}.
          </p>
          <button
            onClick={async () => {
              const { limpiarSesiones } = await import("@/lib/session");
              limpiarSesiones();
              router.push("/join");
            }}
            className="mt-4 px-8 py-3 bg-dorado text-azul-dark font-heading font-bold text-lg rounded-xl hover:bg-dorado-light transition-colors shadow-lg"
          >
            Unirme al siguiente grupo →
          </button>
        </div>
      </div>
    );
  }

  if (retosActivos && sesion.estado === "reto") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
        <div className="text-center animate-bounce-in space-y-4">
          <div className="text-7xl">🎯</div>
          <h1 className="text-3xl font-heading font-extrabold text-azul">
            ¡Actividad lúdica en curso!
          </h1>
          <p className="text-texto text-lg">
            Escucha las instrucciones del docente y participa.
          </p>
          <p className="text-texto-light text-sm">
            El jurado registrará tu puesto si logras terminar primero.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
      <div className="text-4xl mb-4">🎮</div>
      <h1 className="text-2xl font-heading font-bold text-azul mb-2">
        ¡Listo, {jugadorNombre}!
      </h1>
      <p className="text-texto-light">Sesión: {sesion.estado}</p>
    </div>
  );
}

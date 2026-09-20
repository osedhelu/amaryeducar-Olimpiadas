"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { api } from "@/lib/postgrest";
import { getDatosSesionEstudiante } from "@/lib/session";
import type { SesionJuego, Pregunta, Respuesta, EventoWS } from "@/types/game";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [preguntaActual, setPreguntaActual] = useState<Pregunta | null>(null);
  const [jugadorNombre, setJugadorNombre] = useState("");
  const [respuestaEnviada, setRespuestaEnviada] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState<{
    correcta: boolean;
    puntos: number;
  } | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  const { lastEvent, connected } = useWebSocket(sessionId, "student");

  const cargarEstado = useCallback(async () => {
    const { getDatosSesionEstudiante } = await import("@/lib/session");
    const datos = getDatosSesionEstudiante();
    if (!datos.nombre || !datos.sesionId || datos.sesionId !== sessionId) {
      router.push("/join");
      return;
    }
    setJugadorNombre(datos.nombre);

    const [ses] = await api.get<SesionJuego[]>(
      `/sesiones_juego?id=eq.${sessionId}&limit=1`,
    );
    setSesion(ses);

    if (ses?.pregunta_activa_id) {
      const [p] = await api.get<Pregunta[]>(
        `/preguntas?id=eq.${ses.pregunta_activa_id}&limit=1`,
      );
      setPreguntaActual(p);
      verificarRespuestaExistente(ses.pregunta_activa_id);
    }
  }, [sessionId, router]);

  async function verificarRespuestaExistente(preguntaId: string) {
    const { getDatosSesionEstudiante } = await import("@/lib/session");
    const jugadorId = getDatosSesionEstudiante().jugadorId;
    if (!jugadorId) return;

    try {
      const yaRespondidas = await api.get<Respuesta[]>(
        `/respuestas?pregunta_id=eq.${preguntaId}&jugador_id=eq.${jugadorId}&limit=1`,
      );
      if (yaRespondidas.length > 0) {
        const r = yaRespondidas[0];
        setRespuestaEnviada(true);
        setUltimoResultado({
          correcta: r.correcta === true,
          puntos: r.puntos,
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
        if (ev.data.pregunta_activa_id) {
          const preguntaId: string = ev.data.pregunta_activa_id;
          api
            .get<Pregunta[]>(`/preguntas?id=eq.${preguntaId}&limit=1`)
            .then(([p]) => {
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
        const miRespuesta = ev.data.respuestas.find(
          (r) => r.jugador_id === jugadorId,
        );
        if (miRespuesta) {
          setUltimoResultado({
            correcta: miRespuesta.correcta === true,
            puntos: miRespuesta.puntos,
          });
        }
        setRespuestaEnviada(true);
        break;
      }
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

    try {
      const timestampCliente = new Date().toISOString();
      await api.post("/respuestas", {
        pregunta_id: preguntaActual.id,
        jugador_id: jugadorId,
        opcion_seleccionada: opcion,
        enviado_en: timestampCliente,
      });
    } catch (err) {
      const yaRespondio =
        err instanceof Error && err.message.includes("duplicate");
      if (!yaRespondio) {
        console.error("Error al enviar respuesta:", err);
        return;
      }
    }
    setRespuestaEnviada(true);
  }

  if (!sesion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="text-white text-xl font-heading">Cargando...</div>
      </div>
    );
  }

  if (sesion.estado === "lobby") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="text-6xl mb-4 animate-bounce-in">⏳</div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">
          ¡Hola, {jugadorNombre}!
        </h1>
        <p className="text-dorado text-xl font-heading mb-4">
          Esperando al docente...
        </p>
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-verde" : "bg-rojo-error"}`}
          />
          {connected ? "Conectado" : "Reconectando..."}
        </div>
      </div>
    );
  }

  if (sesion.estado === "resultado" && ultimoResultado) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="text-center animate-bounce-in">
          <div className="text-6xl mb-4">
            {ultimoResultado.correcta ? "🎉" : "😔"}
          </div>
          <h2 className="text-2xl font-heading font-bold text-white mb-2">
            {ultimoResultado.correcta ? "¡Correcto!" : "Incorrecto"}
          </h2>
          {ultimoResultado.correcta && (
            <div className="text-dorado text-4xl font-heading font-extrabold animate-pulse-score">
              +{ultimoResultado.puntos} pts
            </div>
          )}
          <p className="text-white/70 mt-4">
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
      <div className="flex-1 flex flex-col p-4 md:p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <span className="text-dorado font-heading font-bold text-sm">
            {jugadorNombre}
          </span>
          {sesion.cronometro_segundos > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dorado transition-all duration-250"
                  style={{ width: `${porcentajeTiempo}%` }}
                />
              </div>
              <span className="text-white font-heading font-bold text-sm w-8 text-right">
                {tiempoRestante}s
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 animate-fade-in">
            <p className="text-white text-lg md:text-xl font-body leading-relaxed">
              {preguntaActual.enunciado}
            </p>
          </div>

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
            <div className="text-center text-dorado font-heading animate-fade-in">
              ✓ Respuesta enviada
            </div>
          )}
        </div>
      </div>
    );
  }

  if (sesion.estado === "final") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
        <div className="text-center animate-bounce-in space-y-6">
          <div className="text-8xl">🏁</div>
          <h1 className="text-4xl font-heading font-extrabold text-dorado">
            ¡La sesión ha finalizado!
          </h1>
          <p className="text-white/70 text-lg">
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <div className="text-4xl mb-4">🎮</div>
      <h1 className="text-2xl font-heading font-bold text-white mb-2">
        ¡Listo, {jugadorNombre}!
      </h1>
      <p className="text-white/70">Sesión: {sesion.estado}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  Colegio,
  Jugador,
  PuntajeReto,
  Reto,
  SesionJuego,
} from "@/types/game";

const MEDALLAS = ["🥇", "🥈", "🥉"];

interface Props {
  gradoId: string;
  sesion: SesionJuego;
  jugadores: Jugador[];
  colegios: Colegio[];
  onIniciarReto: (reto: Reto) => void;
}

export default function RetosPanel({
  gradoId,
  sesion,
  jugadores,
  colegios,
  onIniciarReto,
}: Props) {
  const [retos, setRetos] = useState<Reto[]>([]);
  const [retoActivo, setRetoActivo] = useState<Reto | null>(null);
  const [puntajes, setPuntajes] = useState<PuntajeReto[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .retos(gradoId)
      .then(setRetos)
      .catch(() => {});
  }, [gradoId]);

  async function cargarPuntajes(retoId: string) {
    try {
      setPuntajes(await api.puntajesReto(retoId));
    } catch {
      setPuntajes([]);
    }
  }

  async function abrirReto(reto: Reto) {
    setRetoActivo(reto);
    setError("");
    setCargando(true);
    try {
      await api.actualizarSesion(sesion.id, {
        estado: "reto",
        reto_activo_id: reto.id,
      });
      onIniciarReto(reto);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
    await cargarPuntajes(reto.id);
  }

  async function cerrarReto() {
    if (!retoActivo) return;
    try {
      await api.actualizarSesion(sesion.id, {
        estado: "lobby",
        reset_pregunta: false,
      });
    } catch {
      /* ignorar */
    }
    setRetoActivo(null);
    setPuntajes([]);
  }

  async function asignar(
    puesto: number,
    jugadorId?: string,
    colegioId?: string,
  ) {
    if (!retoActivo) return;
    setError("");
    try {
      const res = await api.asignarPuestoReto({
        retoId: retoActivo.id,
        jugadorId,
        colegioId,
        puesto,
      });
      setPuntajes(res.puntajes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function quitar(jugadorId?: string, colegioId?: string) {
    if (!retoActivo) return;
    setError("");
    try {
      const res = await api.quitarPuestoReto({
        retoId: retoActivo.id,
        jugadorId,
        colegioId,
      });
      setPuntajes(res.puntajes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const esGrupal = retoActivo?.tipo === "grupal";
  const puestosAsignados = new Set(puntajes.map((p) => p.puesto));
  const siguientePuesto = retoActivo?.puntos_por_puesto
    ? Number(
        Object.keys(retoActivo.puntos_por_puesto)
          .map(Number)
          .sort((a, b) => a - b)
          .find((p) => !puestosAsignados.has(p)) ?? 0,
      )
    : 0;
  const puntosSiguiente = retoActivo?.puntos_por_puesto
    ? retoActivo.puntos_por_puesto[String(siguientePuesto)]
    : 0;

  const nombreParticipante = (p: PuntajeReto) =>
    p.nombre ??
    (p.jugador_id
      ? jugadores.find((j) => j.id === p.jugador_id)?.nombre
      : colegios.find((c) => c.id === p.colegio_id)?.nombre) ??
    "";

  const participantes = esGrupal
    ? colegios.filter((c) => jugadores.some((j) => j.colegio_id === c.id))
    : jugadores;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading font-bold text-azul">🎯 Retos lúdicos</h2>
        {retoActivo && (
          <button
            onClick={cerrarReto}
            className="px-3 py-1 bg-gray-200 text-texto rounded-lg text-sm font-bold hover:bg-gray-300"
          >
            Cerrar reto
          </button>
        )}
      </div>

      {!retoActivo ? (
        retos.length === 0 ? (
          <p className="text-texto-light text-sm">
            No hay retos para este grado.
          </p>
        ) : (
          <div className="space-y-2">
            {retos.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100"
              >
                <div>
                  <span className="font-heading font-bold text-texto">
                    {r.nombre}
                  </span>
                  <span className="ml-2 text-xs text-texto-light">
                    {r.tipo === "grupal" ? "👥 Grupal" : "🙋 Individual"}
                  </span>
                  <span className="ml-2 text-xs text-dorado">
                    {Object.entries(r.puntos_por_puesto)
                      .map(([p, pts]) => `${p}º=${pts}`)
                      .join(" · ")}
                  </span>
                </div>
                <button
                  onClick={() => abrirReto(r)}
                  disabled={cargando}
                  className="px-3 py-1 bg-dorado text-azul-dark rounded-lg text-sm font-bold hover:bg-dorado-light disabled:opacity-50"
                >
                  Iniciar / Calificar
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="bg-azul/5 border border-azul/20 rounded-lg p-3 mb-3">
            <p className="font-heading font-bold text-azul">
              {retoActivo.nombre}
              <span className="ml-2 text-xs font-normal text-texto-light">
                {retoActivo.tipo === "grupal" ? "👥 Grupal" : "🙋 Individual"}
              </span>
            </p>
            {retoActivo.instrucciones && (
              <p className="text-sm text-texto-light mt-1">
                {retoActivo.instrucciones}
              </p>
            )}
          </div>

          {siguientePuesto > 0 && (
            <div className="bg-verde/10 border border-verde rounded-lg p-2 mb-3 text-sm text-verde font-heading font-bold">
              Siguiente puesto a otorgar: {siguientePuesto}º → {puntosSiguiente}{" "}
              pts
            </div>
          )}

          <div className="mb-4">
            <p className="text-xs font-bold text-texto-light uppercase mb-2">
              Puestos ya asignados
            </p>
            {puntajes.length === 0 ? (
              <p className="text-sm text-texto-light">
                Aún no hay puestos asignados.
              </p>
            ) : (
              <div className="space-y-1">
                {puntajes.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-heading font-bold text-texto">
                      {MEDALLAS[p.puesto - 1] ?? `${p.puesto}º`}{" "}
                      {nombreParticipante(p)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-dorado font-bold">
                        +{p.puntos} pts
                      </span>
                      <button
                        onClick={() =>
                          quitar(
                            p.jugador_id ?? undefined,
                            p.colegio_id ?? undefined,
                          )
                        }
                        className="text-xs text-rojo hover:text-rojo-error font-bold"
                        title="Quitar puesto"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-texto-light uppercase mb-2">
            Toca al participante que terminó{" "}
            {siguientePuesto > 0 ? `${siguientePuesto}º` : "primero"}
          </p>
          {participantes.length === 0 ? (
            <p className="text-sm text-texto-light">
              {esGrupal
                ? "No hay colegios con participantes en la sesión."
                : "No hay jugadores conectados."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {participantes.map((part) => {
                const jugadorId = "id" in part ? part.id : undefined;
                const colegioId = "id" in part ? part.id : undefined;
                const yaAsignado =
                  "id" in part &&
                  puntajes.some(
                    (p) =>
                      (jugadorId && p.jugador_id === jugadorId) ||
                      (colegioId && p.colegio_id === colegioId),
                  );
                const esColegio = !("sesion_id" in part);
                return (
                  <button
                    key={part.id}
                    onClick={() =>
                      esGrupal
                        ? asignar(siguientePuesto, undefined, part.id)
                        : asignar(siguientePuesto, part.id, undefined)
                    }
                    disabled={yaAsignado || siguientePuesto <= 0}
                    className={`px-4 py-2 rounded-full text-sm font-heading font-bold transition-colors disabled:opacity-50 ${
                      yaAsignado
                        ? "bg-verde text-white"
                        : esColegio
                          ? "bg-azul/10 text-azul hover:bg-azul hover:text-white"
                          : "bg-dorado/20 text-azul-dark hover:bg-dorado hover:text-azul-dark"
                    }`}
                  >
                    {part.nombre}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="text-rojo-error text-sm font-medium mt-3">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Alumno, Colegio, SesionJuego } from "@/types/game";

export default function JoinPage() {
  const [pin, setPin] = useState("");
  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .colegios()
      .then(setColegios)
      .catch(() => {});
  }, []);

  async function consultarPin(nuevoPin: string) {
    if (nuevoPin.length !== 4) {
      setSesion(null);
      setAlumnos([]);
      return;
    }
    setConsultando(true);
    try {
      const datos = await api.alumnosPorPin(nuevoPin);
      setSesion(datos.sesion);
      setAlumnos(datos.alumnos);
      setError("");
    } catch {
      setSesion(null);
      setAlumnos([]);
      setError("PIN no válido");
    } finally {
      setConsultando(false);
    }
  }

  function nombreColegio(id: string | null): string {
    const c = colegios.find((col) => col.id === id);
    return c?.nombre ?? "";
  }

  // Agrupa por colegio si la sesión es oficial; en una prueba no hace falta.
  const agruparPorColegio = sesion?.tipo === "oficial";
  const porColegio = new Map<string, Alumno[]>();
  for (const a of alumnos) {
    const clave = a.colegio_id;
    if (!porColegio.has(clave)) porColegio.set(clave, []);
    porColegio.get(clave)!.push(a);
  }

  async function entrar(alumno: Alumno) {
    setLoading(true);
    setError("");
    try {
      const data = await api.joinSesion(pin, alumno.id);
      const { guardarSesionEstudiante } = await import("@/lib/session");
      guardarSesionEstudiante(
        data.token,
        data.jugadorId,
        data.sesionId,
        data.nombre,
        data.alumnoId,
      );
      router.push(`/game/${data.sesionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg space-y-6 animate-bounce-in">
        <div className="text-center">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-heading font-bold text-azul">
            Únete a la Olimpiada
          </h1>
          <p className="text-texto-light text-sm mt-1">
            Ingresa el PIN y toca tu nombre en la lista
          </p>
        </div>

        <div>
          <label
            htmlFor="pin"
            className="block text-sm font-medium text-texto mb-1"
          >
            PIN de la sesión
          </label>
          <input
            id="pin"
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.slice(0, 4));
              consultarPin(e.target.value.slice(0, 4));
            }}
            placeholder="Ej: 1234"
            maxLength={4}
            autoComplete="off"
            className="w-full px-4 py-3 border-2 border-azul/20 rounded-xl focus:border-azul focus:outline-none bg-white transition-colors text-center text-2xl tracking-widest font-heading"
            required
          />
          {consultando && (
            <p className="text-texto-light text-xs mt-2">Buscando sesión...</p>
          )}
        </div>

        {error && (
          <div className="text-rojo-error text-sm text-center font-medium">
            {error}
          </div>
        )}

        {sesion && alumnos.length === 0 && !consultando && (
          <div className="text-center text-texto-light text-sm py-4">
            No hay alumnos registrados para esta sesión.
          </div>
        )}

        {sesion && alumnos.length > 0 && (
          <div>
            <p className="text-sm font-medium text-texto mb-2">
              {sesion.tipo === "prueba"
                ? "Prueba 1v1 — elige tu nombre:"
                : "Elige tu nombre:"}
            </p>
            {agruparPorColegio ? (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {[...porColegio.entries()].map(([colegioId, lista]) => (
                  <div key={colegioId}>
                    <p className="text-xs font-bold text-azul mb-1 uppercase">
                      {nombreColegio(colegioId)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lista.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => entrar(a)}
                          disabled={loading}
                          className="px-4 py-2 bg-azul/10 text-azul rounded-full text-sm font-heading font-bold hover:bg-azul hover:text-white transition-colors disabled:opacity-50"
                        >
                          {a.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center">
                {alumnos.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => entrar(a)}
                    disabled={loading}
                    className="px-5 py-2 bg-dorado text-azul-dark rounded-full text-base font-heading font-bold hover:bg-dorado-light transition-colors disabled:opacity-50"
                  >
                    {a.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center text-texto-light text-sm">
            Uniéndote...
          </div>
        )}
      </div>
    </main>
  );
}

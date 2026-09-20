"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Grado, Colegio, SesionJuego } from "@/types/game";

export default function JoinPage() {
  const [pin, setPin] = useState("");
  const [nombre, setNombre] = useState("");
  const [colegioId, setColegioId] = useState("");
  const [grados, setGrados] = useState<Grado[]>([]);
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [sesion, setSesion] = useState<SesionJuego | null>(null);
  const [gradoActual, setGradoActual] = useState<Grado | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    api
      .grados()
      .then(setGrados)
      .catch(() => {});
    api
      .colegios()
      .then(setColegios)
      .catch(() => {});
  }, []);

  async function consultarSesion(nuevoPin: string) {
    if (nuevoPin.length !== 4) return;
    try {
      const sesionEncontrada = await api.sesionPorPin(nuevoPin);
      setSesion(sesionEncontrada);
      const grado = grados.find((g) => g.id === sesionEncontrada.grado_id);
      setGradoActual(grado ?? null);
    } catch {
      /* PIN inválido, ignorar */
    }
  }

  useEffect(() => {
    if (grados.length === 0 || !sesion) return;
    const grado = grados.find((g) => g.id === sesion.grado_id);
    setGradoActual(grado ?? null);
  }, [grados, sesion]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.joinSesion(pin, nombre, colegioId || null);

      setSesion({ id: data.sesionId } as SesionJuego);

      const { guardarSesionEstudiante } = await import("@/lib/session");
      guardarSesionEstudiante(
        data.token,
        data.jugadorId,
        data.sesionId,
        nombre,
      );

      router.push(`/game/${data.sesionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const necesitaColegio = gradoActual && gradoActual.orden >= 4;

  return (
    <main className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <form
        onSubmit={handleJoin}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 animate-bounce-in"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-heading font-bold text-azul">
            Únete a la Olimpiada
          </h1>
          <p className="text-texto-light text-sm mt-1">
            Ingresa el PIN y tu nombre para participar
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
              consultarSesion(e.target.value.slice(0, 4));
            }}
            placeholder="Ej: 1234"
            maxLength={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-azul focus:outline-none transition-colors text-center text-2xl tracking-widest font-heading"
            required
          />
        </div>

        <div>
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-texto mb-1"
          >
            Tu nombre
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: María Pérez"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-azul focus:outline-none transition-colors"
            required
          />
        </div>

        {necesitaColegio && (
          <div>
            <label
              htmlFor="colegio"
              className="block text-sm font-medium text-texto mb-1"
            >
              Tu colegio
            </label>
            <select
              id="colegio"
              value={colegioId}
              onChange={(e) => setColegioId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-azul focus:outline-none transition-colors"
              required
            >
              <option value="">Selecciona tu colegio</option>
              {colegios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <div className="text-rojo-error text-sm text-center font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-dorado text-azul-dark font-heading font-bold rounded-xl hover:bg-dorado-light transition-colors disabled:opacity-50"
        >
          {loading ? "Uniéndote..." : "¡Unirme!"}
        </button>
      </form>
    </main>
  );
}

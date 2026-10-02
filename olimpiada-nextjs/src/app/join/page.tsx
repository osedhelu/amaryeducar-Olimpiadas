"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useParametros } from "@/lib/parametros";

export default function JoinPage() {
  const parametros = useParametros();
  const [pin, setPin] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length === 0) {
      setError("Escribe tu nombre para participar");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.joinSesion(pin, limpio);
      const { guardarSesionEstudiante } = await import("@/lib/session");
      guardarSesionEstudiante(
        data.token,
        data.jugadorId,
        data.sesionId,
        data.nombre,
      );
      router.push(`/game/${data.sesionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
      <div className="bg-white rounded-2xl shadow-2xl border border-azul/10 p-8 w-full max-w-lg space-y-6 animate-bounce-in">
        <div className="text-center">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-2xl font-heading font-bold text-azul">
            {parametros.texto_unirse}
          </h1>
          <p className="text-texto-light text-sm mt-1">
            {parametros.texto_join_ayuda}
          </p>
        </div>

        <form onSubmit={entrar} className="space-y-5">
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
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              placeholder="Ej: 1234"
              maxLength={4}
              autoComplete="off"
              inputMode="numeric"
              className="w-full px-4 py-3 border-2 border-azul/20 rounded-xl focus:border-azul focus:outline-none bg-white transition-colors text-center text-2xl tracking-widest font-heading"
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
              onChange={(e) => setNombre(e.target.value.slice(0, 120))}
              placeholder="Escribe tu nombre"
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-azul/20 rounded-xl focus:border-azul focus:outline-none bg-white transition-colors text-center text-xl font-heading"
              required
            />
          </div>

          {error && (
            <div className="text-rojo-error text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-azul text-white font-heading font-bold rounded-xl hover:bg-azul-light transition-colors disabled:opacity-50"
          >
            {loading ? "Uniéndote..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

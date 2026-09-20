"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminLogin() {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { token } = await api.loginDocente(clave);
      const { guardarSesionDocente } = await import("@/lib/session");
      guardarSesionDocente(token);
      router.push("/admin/session");
    } catch {
      setError("Clave incorrecta");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 animate-bounce-in"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-heading font-bold text-azul">
            Panel del Docente
          </h1>
          <p className="text-texto-light text-sm mt-1">
            Ingresa la clave maestra para continuar
          </p>
        </div>

        <div>
          <label
            htmlFor="clave"
            className="block text-sm font-medium text-texto mb-1"
          >
            Clave maestra
          </label>
          <input
            id="clave"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Ingresa la clave"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-azul focus:outline-none transition-colors"
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
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}

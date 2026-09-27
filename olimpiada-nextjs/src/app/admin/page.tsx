"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useParametros } from "@/lib/parametros";

export default function AdminLogin() {
  const parametros = useParametros();
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let activo = true;
    (async () => {
      const { esTokenDocente } = await import("@/lib/session");
      if (!activo) return;
      if (esTokenDocente()) {
        router.replace("/admin/session");
        return;
      }
      setVerificando(false);
    })();
    return () => {
      activo = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { token } = await api.loginDocente(clave);
      const { guardarSesionDocente } = await import("@/lib/session");
      guardarSesionDocente(token);
      router.replace("/admin/session");
    } catch {
      setError("Clave incorrecta");
      setLoading(false);
    }
  }

  if (verificando) {
    return (
      <main className="flex-1 flex items-center justify-center p-8 bg-bg min-h-screen">
        <div className="text-azul text-xl font-heading animate-pulse">
          Cargando...
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-8 bg-bg min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl border border-azul/10 p-8 w-full max-w-md space-y-6 animate-bounce-in"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h1 className="text-2xl font-heading font-bold text-azul">
            {parametros.texto_panel_docente}
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
            className="w-full px-4 py-3 border-2 border-azul/20 rounded-xl focus:border-azul focus:outline-none bg-white transition-colors"
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

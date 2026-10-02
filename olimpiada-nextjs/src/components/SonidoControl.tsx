"use client";

import { useEffect, useState } from "react";

import { sonidoHabilitado, useParametros } from "@/lib/parametros";
import { sonido } from "@/lib/sound";

/**
 * Control global de sonido: botón flotante de silencio y desbloqueo del audio
 * en el primer toque (los navegadores bloquean el autoplay hasta que hay
 * interacción del usuario).
 */
export default function SonidoControl() {
  const parametros = useParametros();
  const activo = sonidoHabilitado(parametros);
  const [muted, setMuted] = useState<boolean>(sonido.muted);

  useEffect(() => {
    const unlock = () => sonido.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  if (!activo) return null;

  return (
    <button
      onClick={() => {
        const siguiente = !sonido.muted;
        sonido.setMuted(siguiente);
        setMuted(siguiente);
      }}
      className="fixed top-4 right-4 z-50 w-11 h-11 rounded-full bg-bg-card border border-azul/20 text-xl shadow-lg hover:bg-dorado/30 transition-colors flex items-center justify-center"
      title={muted ? "Activar sonido" : "Silenciar"}
      aria-label={muted ? "Activar sonido" : "Silenciar"}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

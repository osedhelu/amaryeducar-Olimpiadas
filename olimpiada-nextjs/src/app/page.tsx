"use client";

import Link from "next/link";

import { useParametros } from "@/lib/parametros";

export default function Home() {
  const p = useParametros();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <div className="max-w-2xl text-center space-y-8 animate-fade-in">
        <div className="text-dorado text-6xl font-heading font-extrabold tracking-tight">
          🏆
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white">
          {p.nombre_institucion}
        </h1>
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-dorado">
          {p.nombre_evento}
        </h2>
        <p className="text-lg text-white/80 max-w-md mx-auto">
          {p.texto_bienvenida}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/admin"
            className="px-8 py-4 bg-dorado text-azul-dark font-heading font-bold rounded-xl hover:bg-dorado-light transition-colors shadow-lg"
          >
            {p.texto_panel_docente}
          </Link>
          <Link
            href="/join"
            className="px-8 py-4 bg-white text-azul font-heading font-bold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
          >
            {p.texto_unirme_estudiante}
          </Link>
        </div>
      </div>
    </main>
  );
}

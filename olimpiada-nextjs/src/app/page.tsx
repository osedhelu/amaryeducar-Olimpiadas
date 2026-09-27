"use client";

import Link from "next/link";

import { useParametros } from "@/lib/parametros";

export default function Home() {
  const p = useParametros();

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-bg min-h-screen">
      <div className="max-w-2xl text-center space-y-8 animate-fade-in">
        <div className="text-6xl">🏆</div>
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-azul">
          {p.nombre_institucion}
        </h1>
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-azul-dark">
          {p.nombre_evento}
        </h2>
        <p className="text-lg text-texto-light max-w-md mx-auto">
          {p.texto_bienvenida}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/admin"
            className="px-8 py-4 bg-azul text-white font-heading font-bold rounded-xl hover:bg-azul-light transition-colors shadow-lg"
          >
            {p.texto_panel_docente}
          </Link>
          <Link
            href="/join"
            className="px-8 py-4 bg-white text-azul font-heading font-bold rounded-xl border-2 border-azul hover:bg-azul/5 transition-colors shadow-lg"
          >
            {p.texto_unirme_estudiante}
          </Link>
        </div>
      </div>
    </main>
  );
}

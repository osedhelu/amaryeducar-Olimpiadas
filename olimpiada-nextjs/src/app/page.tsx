import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-azul to-azul-dark min-h-screen">
      <div className="max-w-2xl text-center space-y-8 animate-fade-in">
        <div className="text-dorado text-6xl font-heading font-extrabold tracking-tight">
          🏆
        </div>
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white">
          Amar y Educar
        </h1>
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-dorado">
          Olimpiadas Matemáticas 2026
        </h2>
        <p className="text-lg text-white/80 max-w-md mx-auto">
          Nos alegra enormemente darles la bienvenida a esta jornada de
          conocimiento, lógica y superación.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/admin"
            className="px-8 py-4 bg-dorado text-azul-dark font-heading font-bold rounded-xl hover:bg-dorado-light transition-colors shadow-lg"
          >
            Panel del Docente
          </Link>
          <Link
            href="/join"
            className="px-8 py-4 bg-white text-azul font-heading font-bold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
          >
            Unirme como Estudiante
          </Link>
        </div>
      </div>
    </main>
  );
}

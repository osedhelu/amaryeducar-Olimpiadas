"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Alumno, Grado } from "@/types/game";

export default function DuelosPanel() {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [gradoId, setGradoId] = useState("");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnoA, setAlumnoA] = useState("");
  const [alumnoB, setAlumnoB] = useState("");
  const [error, setError] = useState("");
  const [nuevoPin, setNuevoPin] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .grados()
      .then(setGrados)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!gradoId) {
      setAlumnos([]);
      return;
    }
    api
      .alumnos(gradoId)
      .then((a) => {
        setAlumnos(a);
        setAlumnoA("");
        setAlumnoB("");
      })
      .catch(() => {});
  }, [gradoId]);

  const nombreAlumno = (id: string) => alumnos.find((a) => a.id === id)?.nombre;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNuevoPin("");
    if (!gradoId || !alumnoA || !alumnoB) return;
    if (alumnoA === alumnoB) {
      setError("Elige dos alumnos distintos");
      return;
    }
    setCargando(true);
    try {
      const duelo = await api.crearDuelo(gradoId, alumnoA, alumnoB);
      setNuevoPin(duelo.pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10">
      <h2 className="font-heading font-bold text-azul mb-4">
        Prueba 1v1 (duelo interno)
      </h2>
      <p className="text-sm text-texto-light mb-4">
        Empareja a 2 alumnos del mismo grado (mismo o distinto colegio). Se
        juegan las preguntas del grado y gana el que más puntos sume. No afecta
        la tabla oficial.
      </p>

      <select
        value={gradoId}
        onChange={(e) => setGradoId(e.target.value)}
        className="w-full md:w-72 px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white mb-4"
      >
        <option value="">Selecciona un grado</option>
        {grados.map((g) => (
          <option key={g.id} value={g.id}>
            Grado {g.nombre}
          </option>
        ))}
      </select>

      {gradoId && alumnos.length < 2 && (
        <p className="text-sm text-dorado mb-3">
          Registra al menos 2 alumnos en este grado para crear un duelo.
        </p>
      )}

      {gradoId && alumnos.length >= 2 && (
        <form onSubmit={crear} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={alumnoA}
              onChange={(e) => setAlumnoA(e.target.value)}
              className="px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white"
            >
              <option value="">Alumno A</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
            <select
              value={alumnoB}
              onChange={(e) => setAlumnoB(e.target.value)}
              className="px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white"
            >
              <option value="">Alumno B</option>
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          {alumnoA && alumnoB && alumnoA !== alumnoB && (
            <div className="bg-azul/5 border border-azul/20 rounded-lg p-3 text-sm text-texto">
              <span className="font-heading font-bold text-azul">
                {nombreAlumno(alumnoA)}
              </span>
              <span className="mx-2 text-texto-light">vs</span>
              <span className="font-heading font-bold text-azul">
                {nombreAlumno(alumnoB)}
              </span>
            </div>
          )}

          {error && (
            <div className="text-rojo-error text-sm font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={
              cargando ||
              !gradoId ||
              !alumnoA ||
              !alumnoB ||
              alumnoA === alumnoB
            }
            className="px-5 py-2 bg-dorado text-azul-dark rounded-lg font-heading font-bold hover:bg-dorado-light disabled:opacity-50"
          >
            {cargando ? "Creando..." : "Crear prueba 1v1"}
          </button>

          {nuevoPin && (
            <div className="bg-verde/10 border-2 border-verde rounded-xl p-4 text-center animate-bounce-in">
              <p className="text-verde font-heading font-bold text-lg">
                ¡Prueba creada! PIN:{" "}
                <span className="text-3xl tracking-widest">{nuevoPin}</span>
              </p>
              <p className="text-xs text-texto-light mt-1">
                Los 2 duelistas entran con este PIN y tocan su nombre.
              </p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Alumno, Colegio, Grado } from "@/types/game";

export default function AlumnosPanel() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [colegioId, setColegioId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .colegios()
      .then(setColegios)
      .catch(() => {});
    api
      .grados()
      .then(setGrados)
      .catch(() => {});
  }, []);

  async function cargarAlumnos() {
    if (!gradoId) return;
    try {
      setAlumnos(await api.alumnos(gradoId, colegioId || undefined));
    } catch {
      /* mantener */
    }
  }

  useEffect(() => {
    cargarAlumnos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradoId, colegioId]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!colegioId || !gradoId || !nuevoNombre.trim()) return;
    setCargando(true);
    try {
      await api.crearAlumno(colegioId, gradoId, nuevoNombre.trim());
      setNuevoNombre("");
      await cargarAlumnos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este alumno?")) return;
    try {
      await api.eliminarAlumno(id);
      await cargarAlumnos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-heading font-bold text-azul mb-4">
        Alumnos registrados
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <select
          value={colegioId}
          onChange={(e) => setColegioId(e.target.value)}
          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-azul outline-none"
        >
          <option value="">Todos los colegios</option>
          {colegios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={gradoId}
          onChange={(e) => setGradoId(e.target.value)}
          className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-azul outline-none"
        >
          <option value="">Selecciona un grado</option>
          {grados.map((g) => (
            <option key={g.id} value={g.id}>
              Grado {g.nombre}
            </option>
          ))}
        </select>
      </div>

      {gradoId && (
        <form onSubmit={crear} className="flex gap-2 mb-4">
          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            placeholder="Nombre del alumno"
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-azul outline-none"
          />
          <button
            type="submit"
            disabled={cargando || !nuevoNombre.trim() || !colegioId}
            className="px-4 py-2 bg-dorado text-azul-dark rounded-lg font-heading font-bold hover:bg-dorado-light disabled:opacity-50"
          >
            + Registrar alumno
          </button>
        </form>
      )}

      {!colegioId && gradoId && (
        <p className="text-xs text-dorado mb-3 font-medium">
          Selecciona un colegio para registrar alumnos.
        </p>
      )}

      {error && (
        <div className="text-rojo-error text-sm font-medium mb-3">{error}</div>
      )}

      {!gradoId ? (
        <p className="text-texto-light text-sm">
          Selecciona un grado para ver sus alumnos.
        </p>
      ) : alumnos.length === 0 ? (
        <p className="text-texto-light text-sm">No hay alumnos registrados.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {alumnos.map((a) => {
            const colegio = colegios.find((c) => c.id === a.colegio_id);
            return (
              <span
                key={a.id}
                className="px-3 py-1 bg-azul/10 text-azul rounded-full text-sm font-medium flex items-center gap-2"
              >
                {a.nombre}
                {colegio && (
                  <span className="text-xs text-texto-light">
                    {colegio.nombre}
                  </span>
                )}
                <button
                  onClick={() => eliminar(a.id)}
                  className="text-rojo hover:text-rojo-error font-bold"
                  title="Eliminar"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

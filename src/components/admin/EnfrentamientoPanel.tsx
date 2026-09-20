"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Grado, TablaColegio } from "@/types/game";

export default function EnfrentamientoPanel() {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [gradoId, setGradoId] = useState("");
  const [tabla, setTabla] = useState<TablaColegio[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api
      .grados()
      .then(setGrados)
      .catch(() => {});
  }, []);

  async function cargar(gid: string) {
    if (!gid) return;
    setCargando(true);
    try {
      setTabla(await api.tablaGrado(gid));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar(gradoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradoId]);

  const nombreGrado = grados.find((g) => g.id === gradoId)?.nombre ?? "";

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h2 className="font-heading font-bold text-azul mb-4">
        Enfrentamiento colegio vs colegio
      </h2>

      <select
        value={gradoId}
        onChange={(e) => setGradoId(e.target.value)}
        className="w-full md:w-72 px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-azul outline-none mb-4"
      >
        <option value="">Selecciona un grado</option>
        {grados.map((g) => (
          <option key={g.id} value={g.id}>
            Grado {g.nombre}
          </option>
        ))}
      </select>

      {cargando && (
        <p className="text-texto-light text-sm">Calculando posiciones...</p>
      )}

      {!cargando && gradoId && tabla.length === 0 && (
        <p className="text-texto-light text-sm">
          No hay colegios con alumnos en este grado todavía.
        </p>
      )}

      {tabla.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-texto-light">
            Tabla general · Grado {nombreGrado} — todos contra todos
          </p>
          {tabla.map((entry) => (
            <div
              key={entry.colegio_id}
              className={`flex items-center justify-between p-4 rounded-xl ${
                entry.puesto === 1
                  ? "bg-dorado/15 border-2 border-dorado"
                  : "border border-gray-100"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-heading font-extrabold text-azul">
                  {entry.puesto === 1
                    ? "🥇"
                    : entry.puesto === 2
                      ? "🥈"
                      : entry.puesto === 3
                        ? "🥉"
                        : `${entry.puesto}°`}
                </span>
                <span className="font-heading font-bold text-lg text-texto">
                  {entry.nombre}
                </span>
              </div>
              <span className="text-2xl font-heading font-extrabold text-dorado">
                {entry.puntos_total} pts
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Colegio } from "@/types/game";

export default function ColegiosPanel() {
  const [colegios, setColegios] = useState<Colegio[]>([]);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    try {
      setColegios(await api.colegios());
    } catch {
      /* mantener */
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nombre.trim()) return;
    setCargando(true);
    try {
      await api.crearColegio(nombre.trim(), codigo.trim() || undefined);
      setNombre("");
      setCodigo("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setCargando(false);
    }
  }

  async function guardarEdicion(id: string) {
    try {
      await api.actualizarColegio(id, editandoNombre.trim());
      setEditandoId(null);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este colegio? Se borrarán sus alumnos."))
      return;
    try {
      await api.eliminarColegio(id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10">
      <h2 className="font-heading font-bold text-azul mb-4">
        Colegios participantes
      </h2>

      <form onSubmit={crear} className="flex flex-wrap gap-2 mb-4">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del colegio"
          className="flex-1 min-w-40 px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white"
        />
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Código (opcional)"
          maxLength={20}
          className="w-32 px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white"
        />
        <button
          type="submit"
          disabled={cargando || !nombre.trim()}
          className="px-4 py-2 bg-azul text-white rounded-lg font-heading font-bold hover:bg-azul-light disabled:opacity-50"
        >
          + Registrar
        </button>
      </form>

      {error && (
        <div className="text-rojo-error text-sm font-medium mb-3">{error}</div>
      )}

      {colegios.length === 0 ? (
        <p className="text-texto-light text-sm">Aún no hay colegios.</p>
      ) : (
        <div className="space-y-2">
          {colegios.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-lg border border-azul/10"
            >
              {editandoId === c.id ? (
                <input
                  value={editandoNombre}
                  onChange={(e) => setEditandoNombre(e.target.value)}
                  className="flex-1 px-2 py-1 border-2 border-azul rounded-lg outline-none"
                  autoFocus
                />
              ) : (
                <div>
                  <span className="font-heading font-bold text-texto">
                    {c.nombre}
                  </span>
                  {c.codigo && (
                    <span className="ml-2 text-xs text-texto-light">
                      {c.codigo}
                    </span>
                  )}
                </div>
              )}
              <div className="flex gap-2 ml-3">
                {editandoId === c.id ? (
                  <>
                    <button
                      onClick={() => guardarEdicion(c.id)}
                      className="px-3 py-1 bg-verde text-white rounded-lg text-sm font-bold hover:bg-verde/80"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="px-3 py-1 bg-azul/10 text-azul rounded-lg text-sm font-bold hover:bg-azul/20"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditandoId(c.id);
                        setEditandoNombre(c.nombre);
                      }}
                      className="px-3 py-1 bg-azul/10 text-azul rounded-lg text-sm font-bold hover:bg-azul/20"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminar(c.id)}
                      className="px-3 py-1 bg-rojo/10 text-rojo rounded-lg text-sm font-bold hover:bg-rojo/20"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

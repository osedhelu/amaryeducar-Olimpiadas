"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { PARAMETROS_DEFAULT } from "@/lib/parametros";
import type { ParametrosEvento } from "@/types/game";

interface Campo {
  clave: string;
  etiqueta: string;
  descripcion: string;
  tipo?: "text" | "textarea" | "password" | "checkbox";
}

const CAMPOS: Campo[] = [
  {
    clave: "nombre_institucion",
    etiqueta: "Nombre de la institución",
    descripcion:
      "Aparece en la parte superior del portal y la pantalla grande.",
  },
  {
    clave: "nombre_evento",
    etiqueta: "Nombre del evento",
    descripcion: "Título principal de la olimpiada.",
  },
  {
    clave: "subtitulo_evento",
    etiqueta: "Subtítulo del evento",
    descripcion: "Frase corta debajo del título.",
  },
  {
    clave: "texto_bienvenida",
    etiqueta: "Texto de bienvenida",
    descripcion: "Mensaje de bienvenida en la página de inicio.",
    tipo: "textarea",
  },
  {
    clave: "texto_panel_docente",
    etiqueta: "Botón Panel del Docente",
    descripcion: "Texto del botón de acceso docente en el inicio.",
  },
  {
    clave: "texto_unirme_estudiante",
    etiqueta: "Botón Unirme como Estudiante",
    descripcion: "Texto del botón de acceso estudiante en el inicio.",
  },
  {
    clave: "texto_unirse",
    etiqueta: "Título del ingreso estudiante",
    descripcion: "Título de la pantalla donde el alumno elige su nombre.",
  },
  {
    clave: "texto_join_ayuda",
    etiqueta: "Ayuda del ingreso estudiante",
    descripcion: "Instrucción bajo el título de ingreso.",
  },
  {
    clave: "texto_pin_label",
    etiqueta: "Etiqueta del PIN",
    descripcion: "Texto que acompaña el PIN en la pantalla grande.",
  },
  {
    clave: "texto_ronda_completada",
    etiqueta: "Fin de ronda",
    descripcion: "Mensaje que aparece al terminar una ronda.",
  },
  {
    clave: "retos_habilitados",
    etiqueta: "Pruebas lúdicas (retos)",
    descripcion:
      "Si está habilitado, aparece el panel de retos y se pueden usar sus estados. Deshabilitado, se oculta en todo el portal.",
    tipo: "checkbox",
  },
  {
    clave: "clave_admin",
    etiqueta: "Clave del panel docente",
    descripcion: "Clave maestra para entrar a /admin.",
    tipo: "password",
  },
];

const CLAVES_CONOCIDAS = new Set(CAMPOS.map((c) => c.clave));

function aRecord(p: ParametrosEvento): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(p)) {
    if (typeof valor === "string") out[clave] = valor;
  }
  return out;
}

export default function ParametrosPanel() {
  const [valores, setValores] = useState<Record<string, string>>(
    aRecord(PARAMETROS_DEFAULT),
  );
  const [extras, setExtras] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    api
      .parametrosAdmin()
      .then((p) => {
        if (!activo) return;
        setValores((prev) => ({ ...prev, ...aRecord(p) }));
        setExtras(Object.keys(p).filter((k) => !CLAVES_CONOCIDAS.has(k)));
      })
      .catch(() => {
        if (activo) setError("No se pudieron cargar los parámetros.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  function cambiar(clave: string, valor: string) {
    setValores((prev) => ({ ...prev, [clave]: valor }));
  }

  async function guardar() {
    setGuardando(true);
    setMensaje("");
    setError("");
    try {
      const aEnviar: Record<string, string> = {};
      for (const campo of CAMPOS) {
        aEnviar[campo.clave] = valores[campo.clave] ?? "";
      }
      for (const clave of extras) {
        aEnviar[clave] = valores[clave] ?? "";
      }
      const actualizados = await api.actualizarParametros(aEnviar);
      setValores((prev) => ({ ...prev, ...aRecord(actualizados) }));
      setMensaje("Parámetros guardados correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10 text-texto-light">
        Cargando parámetros...
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl p-5 shadow-sm border border-azul/10 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-azul text-lg">
          ⚙️ Configuración del portal
        </h2>
        <p className="text-sm text-texto-light">
          Estos textos se muestran en el portal y la pantalla grande. Los
          cambios se aplican al recargar las páginas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPOS.map((campo) => (
          <label
            key={campo.clave}
            className={
              campo.tipo === "textarea"
                ? "flex flex-col gap-1 md:col-span-2"
                : "flex flex-col gap-1"
            }
          >
            <span className="text-sm font-bold text-azul">
              {campo.etiqueta}
            </span>
            {campo.tipo === "checkbox" ? (
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(valores[campo.clave] ?? "false") === "true"}
                  onChange={(e) =>
                    cambiar(campo.clave, e.target.checked ? "true" : "false")
                  }
                  className="w-5 h-5 accent-azul"
                />
                <span className="text-sm font-medium text-texto">
                  {(valores[campo.clave] ?? "false") === "true"
                    ? "Habilitadas"
                    : "Deshabilitadas"}
                </span>
              </span>
            ) : campo.tipo === "textarea" ? (
              <textarea
                value={valores[campo.clave] ?? ""}
                onChange={(e) => cambiar(campo.clave, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white text-sm"
              />
            ) : (
              <input
                type="text"
                value={valores[campo.clave] ?? ""}
                onChange={(e) => cambiar(campo.clave, e.target.value)}
                className="w-full px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white text-sm"
              />
            )}
            <span className="text-xs text-texto-light">
              {campo.descripcion}
            </span>
          </label>
        ))}
      </div>

      {extras.length > 0 && (
        <div className="border-t border-azul/10 pt-4">
          <p className="text-sm font-bold text-azul mb-2">Otros parámetros</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extras.map((clave) => (
              <label key={clave} className="flex flex-col gap-1">
                <span className="text-sm font-bold text-azul">{clave}</span>
                <input
                  value={valores[clave] ?? ""}
                  onChange={(e) => cambiar(clave, e.target.value)}
                  className="w-full px-3 py-2 border-2 border-azul/20 rounded-lg focus:border-azul outline-none bg-white text-sm"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {mensaje && (
        <div className="bg-verde/10 border border-verde text-verde rounded-lg p-3 text-sm font-medium">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="bg-rojo-error/10 border border-rojo-error text-rojo-error rounded-lg p-3 text-sm font-medium">
          {error}
        </div>
      )}

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full md:w-auto px-6 py-2.5 bg-azul text-white font-heading font-bold rounded-xl hover:bg-azul-light transition-colors disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  );
}

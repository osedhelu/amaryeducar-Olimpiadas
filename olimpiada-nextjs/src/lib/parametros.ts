"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { ParametrosEvento } from "@/types/game";

export const PARAMETROS_DEFAULT: ParametrosEvento = {
  nombre_institucion: "Amar y Educar",
  nombre_evento: "Olimpiadas de Inglés 2026",
  subtitulo_evento: "Preguntas y respuestas en inglés",
  texto_bienvenida:
    "Nos alegra enormemente darles la bienvenida a esta jornada de conocimiento, idioma y superación.",
  texto_unirse: "Únete a la Olimpiada",
  texto_join_ayuda: "Ingresa el PIN y toca tu nombre en la lista",
  texto_panel_docente: "Panel del Docente",
  texto_unirme_estudiante: "Unirme como Estudiante",
  texto_pin_label: "PIN de la sesión",
  texto_ronda_completada: "¡Ronda completada!",
  retos_habilitados: "false",
};

export function tieneRetos(p: ParametrosEvento): boolean {
  const valor = (p.retos_habilitados ?? "false").trim().toLowerCase();
  return valor === "true" || valor === "1" || valor === "si" || valor === "sí";
}

let cache: ParametrosEvento | null = null;
let promesa: Promise<ParametrosEvento> | null = null;

export async function cargarParametros(
  force = false,
): Promise<ParametrosEvento> {
  if (cache && !force) return cache;
  if (!promesa || force) {
    promesa = api
      .parametros()
      .then((p) => {
        cache = { ...PARAMETROS_DEFAULT, ...p };
        return cache;
      })
      .catch(() => {
        cache = PARAMETROS_DEFAULT;
        return cache;
      });
  }
  return promesa;
}

export function useParametros(): ParametrosEvento {
  const [parametros, setParametros] = useState<ParametrosEvento>(
    cache ?? PARAMETROS_DEFAULT,
  );

  useEffect(() => {
    let activo = true;
    cargarParametros().then((p) => {
      if (activo) setParametros(p);
    });
    return () => {
      activo = false;
    };
  }, []);

  return parametros;
}

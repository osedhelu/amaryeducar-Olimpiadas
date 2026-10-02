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
  modo_quiz: "false",
  preguntas_por_sesion: "10",
  vidas_habilitadas: "true",
  vidas_por_sesion: "3",
  mostrar_duelos: "true",
  mostrar_enfrentamiento: "true",
  grado_1: "true",
  grado_2: "true",
  grado_3: "true",
  grado_4: "true",
  grado_5: "true",
};

function esVerdadero(valor: string | undefined): boolean {
  const v = (valor ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "si" || v === "sí";
}

export function tieneRetos(p: ParametrosEvento): boolean {
  return esVerdadero(p.retos_habilitados ?? "false");
}

export function vidasHabilitadas(p: ParametrosEvento): boolean {
  return esVerdadero(p.vidas_habilitadas ?? "true");
}

export function numVidas(p: ParametrosEvento): number {
  const n = parseInt(String(p.vidas_por_sesion ?? "3"), 10);
  return Number.isFinite(n) && n > 0 ? n : 3;
}

export function mostrarDuelos(p: ParametrosEvento): boolean {
  return esVerdadero(p.mostrar_duelos ?? "true");
}

export function mostrarEnfrentamiento(p: ParametrosEvento): boolean {
  return esVerdadero(p.mostrar_enfrentamiento ?? "true");
}

/** Set de grados habilitados por `orden` (1..5). */
export function gradosHabilitados(p: ParametrosEvento): Set<number> {
  const set = new Set<number>();
  for (let i = 1; i <= 5; i++) {
    if (esVerdadero(p[`grado_${i}`] ?? "true")) set.add(i);
  }
  return set;
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

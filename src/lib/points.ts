import type { Grado } from "@/types/game";

export function calcularPuntosRespuesta(
  grado: Grado,
  sesion: "1" | "2",
  ordenCorrecto: number,
): number {
  const tabla = sesion === "1" ? grado.puntos_sesion1 : grado.puntos_sesion2;
  return tabla[String(ordenCorrecto)] ?? 0;
}

export function calcularPuntosReto(
  puntosPorPuesto: Record<string, number>,
  puesto: number,
): number {
  return puntosPorPuesto[String(puesto)] ?? 0;
}

export function esGradoGrupal(orden: number): boolean {
  return orden >= 4;
}

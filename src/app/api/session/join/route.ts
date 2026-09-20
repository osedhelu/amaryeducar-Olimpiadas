import { NextRequest, NextResponse } from "next/server";
import { signDocenteJWT, signEstudianteJWT } from "@/lib/jwt";

const BASE_URL = process.env.NEXT_PUBLIC_POSTGREST_URL!;

async function pgrest(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${signDocenteJWT()}`,
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${body}`);
  return body ? (JSON.parse(body) as unknown) : null;
}

export async function POST(req: NextRequest) {
  const { pin, nombre, colegioId } = (await req.json().catch(() => ({}))) as {
    pin?: string;
    nombre?: string;
    colegioId?: string | null;
  };

  if (!pin || !nombre) {
    return NextResponse.json(
      { error: "PIN y nombre son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const sesiones = (await pgrest(
      `/sesiones_juego?pin=eq.${encodeURIComponent(pin)}&estado=neq.borrador&limit=1`,
    )) as Array<{ id: string; grado_id: string }> | null;

    if (!sesiones || sesiones.length === 0) {
      return NextResponse.json(
        { error: "PIN no encontrado o sesión no activa" },
        { status: 404 },
      );
    }

    const sesion = sesiones[0];

    const grados = (await pgrest(
      `/grados?id=eq.${sesion.grado_id}&select=id,orden&limit=1`,
    )) as Array<{ id: string; orden: number }> | null;

    const grado = grados?.[0];
    const necesitaColegio = (grado?.orden ?? 0) >= 4;
    if (necesitaColegio && !colegioId) {
      return NextResponse.json(
        { error: "Debes seleccionar tu colegio" },
        { status: 400 },
      );
    }

    const existentes = (await pgrest(
      `/jugadores?sesion_id=eq.${sesion.id}&nombre=eq.${encodeURIComponent(nombre)}&select=id`,
    )) as Array<{ id: string }> | null;

    let jugador: { id: string };
    if (existentes && existentes.length > 0) {
      jugador = existentes[0];
      await pgrest(`/jugadores?id=eq.${jugador.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          conectado: true,
          ultima_conexion: new Date().toISOString(),
          colegio_id: necesitaColegio ? (colegioId ?? null) : null,
        }),
      });
    } else {
      const creados = (await pgrest("/jugadores", {
        method: "POST",
        body: JSON.stringify({
          sesion_id: sesion.id,
          nombre,
          conectado: true,
          colegio_id: necesitaColegio ? (colegioId ?? null) : null,
        }),
      })) as Array<{ id: string }> | null;
      const reconsulta = (await pgrest(
        `/jugadores?sesion_id=eq.${sesion.id}&nombre=eq.${encodeURIComponent(nombre)}&select=id&limit=1`,
      )) as Array<{ id: string }> | null;
      jugador = creados?.[0] ?? reconsulta?.[0] ?? { id: "" };
    }

    const token = signEstudianteJWT(jugador.id, sesion.id);

    return NextResponse.json({
      token,
      jugadorId: jugador.id,
      sesionId: sesion.id,
      nombre,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error de conexión" },
      { status: 500 },
    );
  }
}

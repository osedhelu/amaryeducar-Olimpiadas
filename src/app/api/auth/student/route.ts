import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { jugadorId, sesionId } = body as {
    jugadorId?: string;
    sesionId?: string;
  };

  if (!jugadorId || !sesionId) {
    return NextResponse.json(
      { error: "Faltan jugadorId/sesionId" },
      { status: 400 },
    );
  }

  const { signEstudianteJWT } = await import("@/lib/jwt");
  const token = signEstudianteJWT(jugadorId, sesionId);

  return NextResponse.json({ token, role: "estudiante" });
}

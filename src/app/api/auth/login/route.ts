import { NextRequest, NextResponse } from "next/server";

const CLAVE_ADMIN = process.env.CLAVE_ADMIN ?? "ADMadm1234";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clave } = body as { clave?: string };

  if (clave !== CLAVE_ADMIN) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  }

  const { signDocenteJWT } = await import("@/lib/jwt");
  const token = signDocenteJWT();

  return NextResponse.json({ token, role: "docente" });
}

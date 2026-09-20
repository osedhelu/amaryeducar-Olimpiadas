import { NextResponse } from "next/server";

export async function GET() {
  const { signAnonJWT } = await import("@/lib/jwt");
  const token = signAnonJWT();
  return NextResponse.json({ token, role: "anon" });
}

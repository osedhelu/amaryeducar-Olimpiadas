import jwt from "jsonwebtoken";

const SECRET = process.env.POSTGREST_JWT_SECRET!;

export type RolJWT = "anon" | "estudiante" | "docente";

export interface JWTPayload {
  role: RolJWT;
  jugador_id?: string;
  sesion_id?: string;
  exp?: number;
  iat?: number;
}

export function signJWT(
  payload: Omit<JWTPayload, "exp" | "iat">,
  expiresIn: number = 86400,
): string {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function signDocenteJWT(): string {
  return signJWT({ role: "docente" }, 28800);
}

export function signEstudianteJWT(jugadorId: string, sesionId: string): string {
  return signJWT(
    { role: "estudiante", jugador_id: jugadorId, sesion_id: sesionId },
    14400,
  );
}

export function signAnonJWT(): string {
  return signJWT({ role: "anon" });
}

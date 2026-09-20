const CLAVE_DOCENTE = "jwt_token";
const CLAVE_ESTUDIANTE = "jwt_estudiante";
const CLAVE_REFRESH = "sesion_refresh";

// La identidad del estudiante vive en sessionStorage: es POR PESTAÑA.
// Así, si en un mismo navegador se abren varias pestañas (Cada estudiante
// en su pestaña), cada una conserva su propio jugador_id/token sin pisarse.
// El token del docente vive en localStorage: persiste entre pestañas.

const storage = {
  get(key: string): string | null {
    try {
      const s = sessionStorage.getItem(key);
      if (s) return s;
    } catch {
      /* noop */
    }
    return null;
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* noop */
    }
  },
  remove(key: string) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

interface RefreshData {
  role: "estudiante";
  jugadorId: string;
  sesionId: string;
  nombre: string;
}

export function decodificarJWT(
  token: string,
): { role?: string; exp?: number } | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload as { role?: string; exp?: number };
  } catch {
    return null;
  }
}

function tokenExpirado(token: string): boolean {
  const payload = decodificarJWT(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now() - 30000;
}

export function guardarSesionDocente(token: string) {
  localStorage.setItem(CLAVE_DOCENTE, token);
}

export function guardarSesionEstudiante(
  token: string,
  jugadorId: string,
  sesionId: string,
  nombre: string,
) {
  storage.set(CLAVE_ESTUDIANTE, token);
  storage.set("jugador_id", jugadorId);
  storage.set("sesion_id", sesionId);
  storage.set("jugador_nombre", nombre);
  const refresh: RefreshData = {
    role: "estudiante",
    jugadorId,
    sesionId,
    nombre,
  };
  storage.set(CLAVE_REFRESH, JSON.stringify(refresh));
}

export function limpiarSesiones() {
  localStorage.removeItem(CLAVE_DOCENTE);
  storage.remove(CLAVE_ESTUDIANTE);
  storage.remove(CLAVE_REFRESH);
  storage.remove("jugador_id");
  storage.remove("sesion_id");
  storage.remove("jugador_nombre");
}

export function getDatosSesionEstudiante(): {
  jugadorId: string | null;
  sesionId: string | null;
  nombre: string | null;
} {
  return {
    jugadorId: storage.get("jugador_id"),
    sesionId: storage.get("sesion_id"),
    nombre: storage.get("jugador_nombre"),
  };
}

export async function renovarTokenEstudiante(): Promise<string | null> {
  const raw = storage.get(CLAVE_REFRESH);
  if (!raw) return null;

  let refresh: RefreshData;
  try {
    refresh = JSON.parse(raw) as RefreshData;
  } catch {
    return null;
  }
  if (
    refresh.role !== "estudiante" ||
    !refresh.jugadorId ||
    !refresh.sesionId
  ) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugadorId: refresh.jugadorId,
        sesionId: refresh.sesionId,
      }),
    });
    if (!res.ok) return null;
    const { token } = (await res.json()) as { token: string };

    storage.set(CLAVE_ESTUDIANTE, token);
    return token;
  } catch {
    return null;
  }
}

export async function obtenerTokenValido(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  // 1. Identidad del estudiante de ESTA pestaña (sessionStorage)
  const estudiante = storage.get(CLAVE_ESTUDIANTE);
  if (estudiante && !tokenExpirado(estudiante)) return estudiante;

  // 2. Token del docente (localStorage, persiste entre pestañas)
  const docente = localStorage.getItem(CLAVE_DOCENTE);
  if (docente && !tokenExpirado(docente)) return docente;

  // 3. Regenerar el token del estudiante si se guardó el refresh aquí
  const renovado = await renovarTokenEstudiante();
  if (renovado) return renovado;

  return null;
}

export function esTokenDocente(): boolean {
  const token = localStorage.getItem(CLAVE_DOCENTE);
  if (!token) return false;
  const payload = decodificarJWT(token);
  return payload?.role === "docente" && !tokenExpirado(token);
}

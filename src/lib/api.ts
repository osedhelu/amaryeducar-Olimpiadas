import type {
  Colegio,
  Grado,
  Jugador,
  PodiumEntry,
  Pregunta,
  Respuesta,
  Reto,
  SesionJuego,
} from "@/types/game";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

let cachedAnonToken: string | null = null;

async function resolveToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { obtenerTokenValido } = await import("./session");
  return obtenerTokenValido();
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await resolveToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      message = body.detail ?? body.error ?? message;
    } catch {
      /* body no JSON */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // ── Auth ─────────────────────────────────────────────
  loginDocente: (clave: string) =>
    request<{ token: string; role: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ clave }),
    }),

  loginEstudiante: (jugadorId: string, sesionId: string) =>
    request<{ token: string; role: string }>("/auth/student", {
      method: "POST",
      body: JSON.stringify({ jugadorId, sesionId }),
    }),

  anonToken: async (): Promise<string> => {
    if (cachedAnonToken) return cachedAnonToken;
    const r = await request<{ token: string }>("/auth/anon");
    cachedAnonToken = r.token;
    return r.token;
  },

  joinSesion: (pin: string, nombre: string, colegioId: string | null = null) =>
    request<{
      token: string;
      jugadorId: string;
      sesionId: string;
      nombre: string;
    }>("/session/join", {
      method: "POST",
      body: JSON.stringify({ pin, nombre, colegioId }),
    }),

  // ── Catálogos ────────────────────────────────────────
  grados: (): Promise<Grado[]> => request<Grado[]>("/grados"),
  colegios: (): Promise<Colegio[]> => request<Colegio[]>("/colegios"),

  // ── Sesiones ─────────────────────────────────────────
  crearSesion: (gradoId: string) =>
    request<SesionJuego>("/sessions", {
      method: "POST",
      body: JSON.stringify({ grado_id: gradoId }),
    }),

  sesiones: (): Promise<SesionJuego[]> => request<SesionJuego[]>("/sessions"),
  sesionPorPin: (pin: string) =>
    request<SesionJuego>(`/sessions/by-pin/${pin}`),
  sesion: (id: string) => request<SesionJuego>(`/sessions/${id}`),
  jugadores: (sesionId: string): Promise<Jugador[]> =>
    request<Jugador[]>(`/sessions/${sesionId}/jugadores`),
  respuestasSesion: (sesionId: string): Promise<Respuesta[]> =>
    request<Respuesta[]>(`/sessions/${sesionId}/respuestas`),

  actualizarSesion: (id: string, body: Record<string, unknown>) =>
    request<SesionJuego>(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  finalizarSesion: (id: string) =>
    request<SesionJuego>(`/sessions/${id}/finalizar`, { method: "PATCH" }),

  // ── Preguntas / Retos / Respuestas ─────────────────────────
  preguntas: (gradoId: string): Promise<Pregunta[]> =>
    request<Pregunta[]>(`/preguntas?grado_id=${gradoId}`),
  preguntasPorId: (preguntaId: string): Promise<Pregunta> =>
    request<Pregunta>(`/preguntas/${preguntaId}`),
  retos: (gradoId: string): Promise<Reto[]> =>
    request<Reto[]>(`/retos?grado_id=${gradoId}`),
  lanzarPregunta: (sesionId: string, preguntaId: string) =>
    request<SesionJuego>(
      `/sessions/${sesionId}/preguntas/${preguntaId}/lanzar`,
      {
        method: "POST",
      },
    ),
  cerrarPregunta: (sesionId: string) =>
    request<SesionJuego>(`/sessions/${sesionId}/cerrar-pregunta`, {
      method: "POST",
    }),
  siguientePregunta: (sesionId: string) =>
    request<SesionJuego>(`/sessions/${sesionId}/siguiente-pregunta`, {
      method: "POST",
    }),

  enviarRespuesta: (body: {
    pregunta_id: string;
    jugador_id: string;
    opcion_seleccionada?: string;
    texto_respuesta?: string;
    enviado_en?: string;
  }) =>
    request<Respuesta>("/answers", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  verificarRespuesta: (preguntaId: string, jugadorId: string) =>
    request<Respuesta | null>(
      `/answers/check?pregunta_id=${preguntaId}&jugador_id=${jugadorId}`,
    ),

  aprobarRespuesta: (respuestaId: string, correcta: boolean) =>
    request<Respuesta>(`/answers/${respuestaId}/aprobar`, {
      method: "PATCH",
      body: JSON.stringify({ correcta }),
    }),

  // ── Pódium ───────────────────────────────────────────
  podium: (sesionId: string): Promise<PodiumEntry[]> =>
    request<PodiumEntry[]>(`/podium/${sesionId}`),
};

export const apiUrl = BASE_URL;

import type {
  Alumno,
  Colegio,
  Grado,
  Jugador,
  PodiumEntry,
  Pregunta,
  PuntajeReto,
  Respuesta,
  Reto,
  SesionJuego,
  SesionNumero,
  TablaColegio,
  TipoPregunta,
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

async function subirImagen<T>(
  path: string,
  file: Blob,
  ancho?: number,
  alto?: number,
): Promise<T> {
  const token = await resolveToken();
  const form = new FormData();
  form.append("archivo", file, "imagen");
  if (ancho != null) form.append("ancho", String(ancho));
  if (alto != null) form.append("alto", String(alto));

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      message = body.detail ?? body.error ?? message;
    } catch {
      /* sin JSON */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

/** URL de la imagen de una pregunta, con cache-buster; null si no tiene. */
export function imagenPreguntaUrl(
  pregunta: Pick<Pregunta, "id" | "imagen_actualizado_en">,
): string | null {
  if (!pregunta.imagen_actualizado_en) return null;
  return `${BASE_URL}/preguntas/${pregunta.id}/imagen?v=${encodeURIComponent(
    pregunta.imagen_actualizado_en,
  )}`;
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

  joinSesion: (pin: string, alumnoId: string) =>
    request<{
      token: string;
      jugadorId: string;
      sesionId: string;
      nombre: string;
      alumnoId: string;
      colegioId: string | null;
    }>("/session/join", {
      method: "POST",
      body: JSON.stringify({ pin, alumno_id: alumnoId }),
    }),

  // ── Catálogos ────────────────────────────────────────
  grados: (): Promise<Grado[]> => request<Grado[]>("/grados"),
  colegios: (): Promise<Colegio[]> => request<Colegio[]>("/colegios"),
  crearColegio: (nombre: string, codigo?: string) =>
    request<Colegio>("/colegios", {
      method: "POST",
      body: JSON.stringify({ nombre, codigo: codigo ?? null }),
    }),
  actualizarColegio: (id: string, nombre: string) =>
    request<Colegio>(`/colegios/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ nombre }),
    }),
  eliminarColegio: (id: string) =>
    request<{ ok: boolean }>(`/colegios/${id}`, { method: "DELETE" }),

  alumnos: (gradoId?: string, colegioId?: string): Promise<Alumno[]> => {
    const params = new URLSearchParams();
    if (gradoId) params.set("grado_id", gradoId);
    if (colegioId) params.set("colegio_id", colegioId);
    const qs = params.toString();
    return request<Alumno[]>(`/alumnos${qs ? `?${qs}` : ""}`);
  },
  crearAlumno: (colegioId: string, gradoId: string, nombre: string) =>
    request<Alumno>("/alumnos", {
      method: "POST",
      body: JSON.stringify({
        colegio_id: colegioId,
        grado_id: gradoId,
        nombre,
      }),
    }),
  actualizarAlumno: (id: string, nombre: string) =>
    request<Alumno>(`/alumnos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ nombre }),
    }),
  eliminarAlumno: (id: string) =>
    request<{ ok: boolean }>(`/alumnos/${id}`, { method: "DELETE" }),

  // ── Enfrentamiento / Duelos ───────────────────────────
  tablaGrado: (gradoId: string): Promise<TablaColegio[]> =>
    request<TablaColegio[]>(`/tabla/${gradoId}`),
  crearDuelo: (gradoId: string, alumnoAId: string, alumnoBId: string) =>
    request<SesionJuego>("/duelos", {
      method: "POST",
      body: JSON.stringify({
        grado_id: gradoId,
        alumno_a_id: alumnoAId,
        alumno_b_id: alumnoBId,
      }),
    }),
  alumnosPorPin: (pin: string) =>
    request<{ sesion: SesionJuego; alumnos: Alumno[] }>(
      `/sessions/by-pin/${pin}/alumnos`,
    ),

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
  respuestasSesion: (
    sesionId: string,
    preguntaId?: string | null,
  ): Promise<Respuesta[]> =>
    request<Respuesta[]>(
      `/sessions/${sesionId}/respuestas${
        preguntaId ? `?pregunta_id=${preguntaId}` : ""
      }`,
    ),

  actualizarSesion: (id: string, body: Record<string, unknown>) =>
    request<SesionJuego>(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  finalizarSesion: (id: string) =>
    request<SesionJuego>(`/sessions/${id}/finalizar`, { method: "PATCH" }),

  // ── Preguntas / Retos / Respuestas ─────────────────────────
  preguntas: (gradoId: string, incluirInactivas = false): Promise<Pregunta[]> =>
    request<Pregunta[]>(
      `/preguntas?grado_id=${gradoId}${
        incluirInactivas ? "&incluir_inactivas=true" : ""
      }`,
    ),
  preguntasPorId: (preguntaId: string): Promise<Pregunta> =>
    request<Pregunta>(`/preguntas/${preguntaId}`),

  crearPregunta: (body: {
    grado_id: string;
    sesion: SesionNumero;
    tipo?: TipoPregunta;
    enunciado: string;
    opciones?: string[] | null;
    respuesta_correcta?: string | null;
    tiempo_limite?: number;
    puntos_por_puesto?: Record<string, number> | null;
  }) =>
    request<Pregunta>("/preguntas", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  actualizarPregunta: (preguntaId: string, body: Record<string, unknown>) =>
    request<Pregunta>(`/preguntas/${preguntaId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  eliminarPregunta: (preguntaId: string) =>
    request<Pregunta>(`/preguntas/${preguntaId}`, { method: "DELETE" }),

  moverPregunta: (preguntaId: string, delta: number) =>
    request<Pregunta>(`/preguntas/${preguntaId}/mover`, {
      method: "POST",
      body: JSON.stringify({ delta }),
    }),

  subirImagenPregunta: (
    preguntaId: string,
    file: Blob,
    ancho?: number,
    alto?: number,
  ) =>
    subirImagen<Pregunta>(`/preguntas/${preguntaId}/imagen`, file, ancho, alto),

  eliminarImagenPregunta: (preguntaId: string) =>
    request<Pregunta>(`/preguntas/${preguntaId}/imagen`, { method: "DELETE" }),

  retos: (gradoId: string): Promise<Reto[]> =>
    request<Reto[]>(`/retos?grado_id=${gradoId}`),

  asignarPuestoReto: (body: {
    retoId: string;
    sesionId: string;
    jugadorId?: string;
    colegioId?: string;
    puesto: number;
  }) =>
    request<{
      reto_id: string;
      sesion_id: string;
      puesto: number;
      puntos: number;
      puntajes: PuntajeReto[];
    }>(`/retos/${body.retoId}/puestos`, {
      method: "POST",
      body: JSON.stringify({
        sesion_id: body.sesionId,
        jugador_id: body.jugadorId ?? null,
        colegio_id: body.colegioId ?? null,
        puesto: body.puesto,
      }),
    }),

  puntajesReto: (retoId: string, sesionId: string): Promise<PuntajeReto[]> =>
    request<PuntajeReto[]>(`/retos/${retoId}/puntajes?sesion_id=${sesionId}`),

  quitarPuestoReto: (body: {
    retoId: string;
    sesionId: string;
    jugadorId?: string;
    colegioId?: string;
  }) =>
    request<{ reto_id: string; sesion_id: string; puntajes: PuntajeReto[] }>(
      `/retos/${body.retoId}/puestos`,
      {
        method: "DELETE",
        body: JSON.stringify({
          sesion_id: body.sesionId,
          jugador_id: body.jugadorId ?? null,
          colegio_id: body.colegioId ?? null,
        }),
      },
    ),
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

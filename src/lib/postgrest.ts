const BASE_URL = process.env.NEXT_PUBLIC_POSTGREST_URL!;

let cachedAnonToken: string | null = null;
async function resolveToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const { obtenerTokenValido } = await import("./session");
    const tokenValido = await obtenerTokenValido();
    if (tokenValido) return tokenValido;

    if (!cachedAnonToken) {
      const res = await fetch("/api/auth/anon");
      if (!res.ok) throw new Error("No se pudo obtener token anónimo");
      const data = (await res.json()) as { token: string };
      cachedAnonToken = data.token;
    }
    return cachedAnonToken as string;
  }

  const { signAnonJWT } = await import("./jwt");
  return signAnonJWT();
}

async function buildHeaders(): Promise<HeadersInit> {
  const token = await resolveToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Prefer: "return=representation",
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await buildHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PostgREST ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (path: string) => request<void>(path, { method: "DELETE" }),

  rpc: <T>(fn: string, args: Record<string, unknown>) =>
    request<T>(`/rpc/${fn.replace(/^\/+/, "")}`, {
      method: "POST",
      body: JSON.stringify(args),
    }),
};

export const postgrestUrl = BASE_URL;

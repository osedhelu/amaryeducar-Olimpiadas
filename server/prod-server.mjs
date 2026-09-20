import http from "http";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import pg from "pg";

const PORT = Number(process.env.PORT ?? 3000);
const DATABASE_URL = process.env.DATABASE_URL;

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const clients = new Map();
let pgClient = null;
let wss = null;

async function start() {
  await nextApp.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const role = url.searchParams.get("role") ?? "presentacion";
    const sessionId = url.searchParams.get("sessionId") ?? "";
    const jugadorId = url.searchParams.get("jugadorId") ?? "";
    clients.set(ws, { role, sessionId, jugadorId });

    if (role === "student" && jugadorId && pgClient) {
      pgClient
        .query(
          "UPDATE jugadores SET conectado = true, ultima_conexion = now() WHERE id = $1",
          [jugadorId],
        )
        .catch(() => {});
    }

    ws.on("close", () => {
      const meta = clients.get(ws);
      clients.delete(ws);
      if (meta?.role === "student" && meta.jugadorId && pgClient) {
        pgClient
          .query("UPDATE jugadores SET conectado = false WHERE id = $1", [
            meta.jugadorId,
          ])
          .catch(() => {});
      }
    });

    ws.on("error", () => {});
  });

  function parseSessionId(tabla, data) {
    if (!data) return null;
    if (data.sesion_id) return data.sesion_id;
    if (tabla === "sesiones_juego") return data.id;
    return null;
  }

  function broadcast(payload) {
    const msg = JSON.stringify(payload);
    const sessionId = parseSessionId(payload._tabla, payload.data);
    for (const [ws, meta] of clients.entries()) {
      if (ws.readyState !== WebSocket.OPEN) continue;
      if (meta.role === "admin") {
        ws.send(msg);
      } else if (sessionId && meta.sessionId === sessionId) {
        ws.send(msg);
      } else if (!sessionId && meta.sessionId) {
        ws.send(msg);
      }
    }
  }

  const timers = new Map();

  function scheduleQuestionClose(sessionId, cronometroInicio, segundos) {
    if (!cronometroInicio || !segundos) return;
    const ya = timers.get(sessionId);
    if (ya) {
      clearTimeout(ya);
      timers.delete(sessionId);
    }
    const inicio = new Date(cronometroInicio).getTime();
    const fin = inicio + segundos * 1000;
    const espera = Math.max(0, fin - Date.now());
    if (espera === 0) {
      closeQuestion(sessionId);
      return;
    }
    timers.set(sessionId, setTimeout(() => closeQuestion(sessionId), espera));
  }

  async function closeQuestion(sessionId) {
    timers.delete(sessionId);
    if (!pgClient) return;
    try {
      await pgClient.query(
        `UPDATE sesiones_juego SET estado = 'resultado'
         WHERE id = $1 AND estado = 'pregunta'`,
        [sessionId],
      );
    } catch {
      /* noop */
    }
  }

  async function repararSesionesAtascadas() {
    if (!pgClient) return;
    try {
      const res = await pgClient.query(
        `SELECT id FROM sesiones_juego
         WHERE estado = 'pregunta'
           AND cronometro_inicio IS NOT NULL
           AND (cronometro_inicio::timestamptz + (cronometro_segundos || ' seconds')::interval) < now()`,
      );
      for (const row of res.rows) await closeQuestion(row.id);
    } catch {
      /* noop */
    }
  }

  function connect() {
    pgClient = new pg.Client({ connectionString: DATABASE_URL });
    pgClient.connect((err) => {
      if (err) {
        pgClient = null;
        setTimeout(connect, 3000);
        return;
      }
      pgClient
        .query("LISTEN canal_juego")
        .then(() => {
          repararSesionesAtascadas();
          setInterval(repararSesionesAtascadas, 15000);
        })
        .catch(() => {});
    });

    pgClient.on("notification", (msg) => {
      try {
        const parsed = JSON.parse(msg.payload ?? "{}");
        const { tabla, tipo, data, ts } = parsed;
        if (!tabla || !tipo) return;

        if (tabla === "jugadores" && tipo === "INSERT") {
          broadcast({ tipo: "jugador_unido", data, ts, _tabla: tabla });
        } else if (tabla === "jugadores" && tipo === "UPDATE") {
          broadcast({ tipo: "jugador_cambio", data, ts, _tabla: tabla });
        } else if (tabla === "sesiones_juego" && tipo === "UPDATE") {
          broadcast({ tipo: "sesion_cambio", data, ts, _tabla: tabla });
          if (data?.estado === "pregunta") {
            scheduleQuestionClose(
              data.id,
              data.cronometro_inicio,
              data.cronometro_segundos,
            );
          }
        } else if (tabla === "respuestas" && tipo === "INSERT") {
          broadcast({ tipo: "respuesta_recibida", data, ts, _tabla: tabla });
        } else if (tabla === "puntajes_retos") {
          broadcast({ tipo: "reto", data, ts, _tabla: tabla });
        }
      } catch {
        /* payload inválido */
      }
    });

    pgClient.on("error", () => {
      pgClient = null;
      setTimeout(connect, 3000);
    });
  }

  server.listen(PORT, () => {
    console.log(`[prod] Next.js + WebSocket en puerto ${PORT}`);
    if (DATABASE_URL) {
      connect();
    } else {
      console.warn("[prod] Sin DATABASE_URL — WebSocket deshabilitado");
    }
  });
}

start().catch((err) => {
  console.error("[prod] Error al iniciar:", err);
  process.exit(1);
});
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import pg from "pg";

const PORT = Number(process.env.WS_PORT ?? 3001);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("[ws] Falta DATABASE_URL");
  process.exit(1);
}

const clients = new Map();
let pgClient = null;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, clients: clients.size }));
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const role = url.searchParams.get("role") ?? "presentacion";
  const sessionId = url.searchParams.get("sessionId") ?? "";
  const jugadorId = url.searchParams.get("jugadorId") ?? "";
  ws.isAlive = true;
  clients.set(ws, { role, sessionId, jugadorId });

  console.log(`[ws] Conectado: role=${role} session=${sessionId} jugador=${jugadorId || "-"} (total ${clients.size})`);

  // Heartbeat nativo: el navegador responde PONG automáticamente a los PING
  // del servidor (sin JS). Mantiene vivas las conexiones móviles.
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  // Heartbeat: responde al ping del cliente para mantener vivas las conexiones móviles
  ws.on("message", (msg) => {
    if (msg.toString() === "__ping__") {
      ws.send("__pong__");
    }
  });

  // Marca al jugador como conectado en la BD (solo estudiantes)
  if (role === "student" && jugadorId && pgClient) {
    pgClient
      .query(
        "UPDATE jugadores SET conectado = true, ultima_conexion = now() WHERE id = $1",
        [jugadorId],
      )
      .catch((e) => console.error("[ws] Error marcando conectado:", e.message));
  }

  ws.on("close", () => {
    const meta = clients.get(ws);
    clients.delete(ws);
    // Si un estudiante se desconecta, marcarlo como desconectado en la BD
    if (meta?.role === "student" && meta.jugadorId && pgClient) {
      pgClient
        .query(
          "UPDATE jugadores SET conectado = false WHERE id = $1",
          [meta.jugadorId],
        )
        .catch((e) => console.error("[ws] Error marcando desconectado:", e.message));
    }
    console.log(`[ws] Desconectado (total ${clients.size})`);
  });

  ws.on("error", () => {});
});

// Heartbeat activo del servidor: envía PING a todos cada 30s y mata los sockets
// que no respondan (el navegador responde PONG solo, sin JS). Evita que
// proxies/NAT de redes móviles cierren conexiones idle.
setInterval(() => {
  for (const ws of clients.keys()) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      /* socket cerrado */
    }
  }
}, 30000);

function parseSessionId(tabla, data) {
  if (!data) return null;
  if (data.sesion_id) return data.sesion_id;
  if (tabla === "sesiones_juego") return data.id;
  if (data.pregunta_id) return null;
  return null;
}

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  const sessionId = parseSessionId(payload._tabla, payload.data);

  for (const [ws, meta] of clients.entries()) {
    if (ws.readyState !== WebSocket.OPEN) continue;
    // Presentación y estudiantes solo reciben eventos de SU sesión.
    // El admin recibe todo (para poder monitorear varias sesiones).
    if (meta.role === "admin") {
      ws.send(msg);
    } else if (sessionId && meta.sessionId === sessionId) {
      ws.send(msg);
    } else if (!sessionId && meta.sessionId) {
      ws.send(msg);
    }
  }
}

function disconnectPg() {
  if (pgClient) {
    pgClient.removeAllListeners();
    pgClient.end().catch(() => {});
    pgClient = null;
  }
}

const timers = new Map();

function scheduleQuestionClose(sessionId, cronometroInicio, segundos) {
  if (!cronometroInicio || !segundos) return;

  const yaAgendado = timers.get(sessionId);
  if (yaAgendado) {
    clearTimeout(yaAgendado);
    timers.delete(sessionId);
  }

  const inicio = new Date(cronometroInicio).getTime();
  const fin = inicio + segundos * 1000;
  const espera = Math.max(0, fin - Date.now());

  if (espera === 0) {
    closeQuestion(sessionId);
    return;
  }

  const timer = setTimeout(() => closeQuestion(sessionId), espera);
  timers.set(sessionId, timer);
  console.log(
    `[ws] Pregunta de sesión ${sessionId} se cerrará en ${Math.round(espera / 1000)}s`,
  );
}

async function closeQuestion(sessionId) {
  timers.delete(sessionId);
  if (!pgClient) return;
  try {
    const res = await pgClient.query(
      `UPDATE sesiones_juego SET estado = 'resultado'
       WHERE id = $1 AND estado = 'pregunta'`,
      [sessionId],
    );
    if (res.rowCount > 0) {
      console.log(`[ws] Tiempo agotado: pregunta de sesión ${sessionId} cerrada automaticamente`);
    }
  } catch (e) {
    console.error("[ws] Error cerrando pregunta:", e.message);
  }
}

async function repararSesionesAtascadas() {
  if (!pgClient) return;
  try {
    const res = await pgClient.query(
      `SELECT id, cronometro_inicio, cronometro_segundos
       FROM sesiones_juego
       WHERE estado = 'pregunta'
         AND cronometro_inicio IS NOT NULL
         AND (cronometro_inicio::timestamptz + (cronometro_segundos || ' seconds')::interval) < now()`,
    );
    for (const row of res.rows) {
      console.log(`[ws] Reparando sesión ${row.id} atascada en 'pregunta'`);
      await closeQuestion(row.id);
    }
  } catch (e) {
    console.error("[ws] Error reparando sesiones:", e.message);
  }
}

function connect() {
  pgClient = new pg.Client({ connectionString: DATABASE_URL });
  pgClient.connect((err) => {
    if (err) {
      console.error("[ws] Error conectando a Postgres:", err.message);
      disconnectPg();
      setTimeout(connect, 3000);
      return;
    }
    console.log("[ws] Escuchando canal_juego en Postgres");
    pgClient.query("LISTEN canal_juego").catch(() => {});
    repararSesionesAtascadas();
    setInterval(repararSesionesAtascadas, 15000);
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
          scheduleQuestionClose(data.id, data.cronometro_inicio, data.cronometro_segundos);
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

  pgClient.on("error", (e) => {
    console.error("[ws] Error en conexión Postgres:", e.message);
    disconnectPg();
    setTimeout(connect, 3000);
  });
}

server.listen(PORT, () => {
  console.log(`[ws] WebSocket server en ws://localhost:${PORT}`);
  connect();
});
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { EventoWS } from "@/types/game";

const WS_URL_CONFIG = process.env.NEXT_PUBLIC_WS_URL ?? "";

/**
 * Deriva la URL base del WebSocket según dónde se esté ejecutando:
 * - Producción: NEXT_PUBLIC_WS_URL configurada (wss://dominio)
 * - Móvil/dispositivo en la red local: usa el MISMO host de la página
 *   (ej. http://192.168.1.10:3000 → ws://192.168.1.10:3001 en dev)
 * - localhost: ws://localhost:3001 (dev)
 * Esto evita el bug clásico de "localhost" del dispositivo móvil.
 */
function getWsBase(): string {
  if (typeof window === "undefined") {
    return WS_URL_CONFIG || "ws://localhost:3001";
  }

  if (WS_URL_CONFIG && !WS_URL_CONFIG.includes("localhost")) {
    return WS_URL_CONFIG;
  }

  const host = window.location.hostname;
  const port = window.location.port;
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const esLocal = host === "localhost" || host === "127.0.0.1";

  if (esLocal) {
    return port === "3001" || WS_URL_CONFIG
      ? WS_URL_CONFIG
      : "ws://localhost:3001";
  }

  // Dispositivo en red: mismo host, puerto 3001 en dev / mismo puerto con wss en prod
  if (proto === "ws" && port === "3000") {
    return `${proto}://${host}:3001`;
  }
  return `${proto}://${host}`;
}

export function useWebSocket(
  sessionId: string | null,
  role: "presentacion" | "admin" | "student",
) {
  const [lastEvent, setLastEvent] = useState<EventoWS | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    if (!sessionId) return;

    let jugadorId = "";
    if (role === "student" && typeof window !== "undefined") {
      try {
        jugadorId = sessionStorage.getItem("jugador_id") ?? "";
      } catch {
        jugadorId = "";
      }
    }

    const wsUrl = `${getWsBase()}?role=${role}&sessionId=${sessionId}&jugadorId=${jugadorId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        attemptRef.current = 0;

        // Heartbeat: cierra sockets zombie que la red móvil deja "abiertos"
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        heartbeatTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("__ping__");
          } else {
            ws.close();
            setConnected(false);
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (event.data === "__pong__") return;
        try {
          const data = JSON.parse(event.data) as EventoWS;
          setLastEvent(data);
        } catch {
          /* ignore malformed */
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        // Backoff conservador para no disparar protecciones del edge:
        // mín. 8s con jitter (evita ráfagas de handshakes que Railway
        // interpreta como DDoS y corta).
        const intento = Math.min(attemptRef.current, 5);
        const base = 8000 * Math.pow(1.6, intento);
        const jitter = Math.random() * 2000;
        const delay = Math.min(base + jitter, 60000);
        attemptRef.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [sessionId, role]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { lastEvent, connected };
}

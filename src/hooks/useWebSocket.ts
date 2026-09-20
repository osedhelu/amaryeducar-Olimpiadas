"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { EventoWS } from "@/types/game";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";

export function useWebSocket(
  sessionId: string | null,
  role: "presentacion" | "admin" | "student",
) {
  const [lastEvent, setLastEvent] = useState<EventoWS | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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

    const wsUrl = `${WS_URL}?role=${role}&sessionId=${sessionId}&jugadorId=${jugadorId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as EventoWS;
        setLastEvent(data);
      } catch {
        /* ignore malformed */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();
  }, [sessionId, role]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { lastEvent, connected };
}

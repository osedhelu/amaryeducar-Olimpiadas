/**
 * Pruebas del cliente WebSocket del frontend.
 *
 * Validan el "contrato" de sincronización con el backend: la URL lleva
 * role/sessionId/jugadorId, se parsean los eventos a `lastEvent` y se responde
 * el ping para no quedar como socket zombie.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useWebSocket } from "./useWebSocket";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;

  url: string;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  message(data: string) {
    this.onmessage?.({ data });
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

beforeEach(() => {
  MockWebSocket.instances = [];
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
  sessionStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useWebSocket", () => {
  it("conecta con role, sessionId y jugadorId", () => {
    sessionStorage.setItem("jugador_id", "jug-7");
    renderHook(() => useWebSocket("sess-1", "student"));

    const ws = MockWebSocket.instances[0];
    expect(ws).toBeTruthy();
    expect(ws.url).toContain("role=student");
    expect(ws.url).toContain("sessionId=sess-1");
    expect(ws.url).toContain("jugadorId=jug-7");
  });

  it("un estudiante sin jugador_id NO abre conexión", () => {
    renderHook(() => useWebSocket("sess-1", "student"));
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it("parsea los eventos JSON a lastEvent", async () => {
    sessionStorage.setItem("jugador_id", "jug-7");
    const { result } = renderHook(() => useWebSocket("sess-1", "student"));
    const ws = MockWebSocket.instances[0];

    act(() => {
      ws.message(
        JSON.stringify({
          tipo: "respuesta_recibida",
          data: { id: "r1", jugador_id: "jug-7" },
          ts: "2026-09-20T12:00:00Z",
        }),
      );
    });

    await waitFor(() =>
      expect(result.current.lastEvent?.tipo).toBe("respuesta_recibida"),
    );
  });

  it("responde __pong__ al ping del servidor", () => {
    sessionStorage.setItem("jugador_id", "jug-7");
    const { result } = renderHook(() => useWebSocket("sess-1", "student"));
    const ws = MockWebSocket.instances[0];
    act(() => ws.open());
    expect(result.current.connected).toBe(true);

    act(() => ws.message(JSON.stringify({ tipo: "__ping__" })));
    expect(ws.sent).toContain("__pong__");
  });
});

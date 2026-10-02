/**
 * Pruebas de render de la pantalla grande (presentación).
 *
 * Validan que la vista cambia según el estado de la sesión y que, cuando hay
 * una ronda con ganador, se pinta "Ganador de la Ronda N" con su ranking.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  ws: { lastEvent: null as unknown, connected: true },
  api: {
    sesion: vi.fn(),
    jugadores: vi.fn(),
    preguntasPorId: vi.fn(),
    respuestasSesion: vi.fn(),
    podium: vi.fn(),
    tablaGrado: vi.fn(),
    retos: vi.fn(),
    puntajesReto: vi.fn(),
    ganadorRonda: vi.fn(),
  },
}));

vi.mock("@/hooks/useWebSocket", () => ({ useWebSocket: () => h.ws }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "s1" }),
}));
vi.mock("@/lib/api", () => ({
  api: h.api,
  imagenPreguntaUrl: () => null,
}));
vi.mock("@/lib/parametros", () => ({
  useParametros: () => ({
    nombre_institucion: "Amar y Educar",
    nombre_evento: "Olimpiadas de Inglés 2026",
    texto_pin_label: "PIN de la sesión",
    texto_ronda_completada: "¡Ronda completada!",
  }),
  tieneRetos: () => false,
  sonidoHabilitado: () => false,
}));
vi.mock("@/lib/sound", () => ({
  sonido: { play: vi.fn(), unlock: vi.fn(), setMuted: vi.fn(), muted: false },
}));
vi.mock("@/components/Confetti", () => ({
  fuegoConfeti: vi.fn(),
  lluviaConfeti: vi.fn(),
}));

import PresentacionPage from "./page";

const pregunta = {
  id: "p1",
  grado_id: "g1",
  sesion: "1",
  tipo: "opcion-multiple",
  enunciado: "¿Cómo se dice perro en inglés?",
  opciones: ["A) Dog", "B) Cat"],
  respuesta_correcta: "A",
  tiempo_limite: 30,
  puntos_por_puesto: { "1": 10 },
  orden: 1,
  activa: true,
  creado_en: "",
  actualizado_en: "",
};

function sesionBase(overrides: Record<string, unknown>) {
  return {
    id: "s1",
    pin: "1234",
    grado_id: "g1",
    tipo: "oficial",
    estado: "pregunta",
    pregunta_activa_id: null,
    reto_activo_id: null,
    cronometro_inicio: null,
    cronometro_segundos: 0,
    ronda_ganador_num: null,
    colegio_id: null,
    alumno_a_id: null,
    alumno_b_id: null,
    creado_en: "",
    actualizado_en: "",
    ...overrides,
  };
}

beforeEach(() => {
  h.ws.lastEvent = null;
  Object.values(h.api).forEach((fn) => fn.mockReset());
  h.api.jugadores.mockResolvedValue([]);
  h.api.respuestasSesion.mockResolvedValue([]);
  h.api.retos.mockResolvedValue([]);
  h.api.podium.mockResolvedValue([]);
  h.api.tablaGrado.mockResolvedValue([]);
});

describe("PresentacionPage (pantalla grande)", () => {
  it("muestra la pregunta activa", async () => {
    h.api.sesion.mockResolvedValue(
      sesionBase({ estado: "pregunta", pregunta_activa_id: "p1" }),
    );
    h.api.preguntasPorId.mockResolvedValue(pregunta);

    render(<PresentacionPage />);
    expect(
      await screen.findByText(/¿Cómo se dice perro en inglés\?/),
    ).toBeTruthy();
  });

  it("muestra 'ronda completada' en estado resultado", async () => {
    h.api.sesion.mockResolvedValue(
      sesionBase({ estado: "resultado", pregunta_activa_id: "p1" }),
    );
    h.api.preguntasPorId.mockResolvedValue(pregunta);

    render(<PresentacionPage />);
    expect(await screen.findByText(/¡Ronda completada!/)).toBeTruthy();
  });

  it("muestra el ganador de la ronda cuando la sesión lo indica", async () => {
    h.api.sesion.mockResolvedValue(
      sesionBase({ estado: "resultado", ronda_ganador_num: 2 }),
    );
    h.api.ganadorRonda.mockResolvedValue({
      ronda: 2,
      total_preguntas: 10,
      ranking: [{ puesto: 1, nombre: "Ana", aciertos: 8, puntos: 80 }],
    });

    render(<PresentacionPage />);
    expect(await screen.findByText(/Ganador de la Ronda 2/)).toBeTruthy();
    expect(await screen.findByText(/Ana/)).toBeTruthy();
    expect(h.api.ganadorRonda).toHaveBeenCalledWith("s1", 2);
  });
});

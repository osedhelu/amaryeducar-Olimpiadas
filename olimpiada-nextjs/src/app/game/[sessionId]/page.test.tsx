/**
 * Pruebas de render del juego del estudiante.
 *
 * Validan que la pantalla correcta se muestra según el estado de la sesión y
 * que al tocar una opción se envía la respuesta con la letra correcta.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  ws: { lastEvent: null as unknown, connected: true },
  api: {
    sesion: vi.fn(),
    preguntasPorId: vi.fn(),
    verificarRespuesta: vi.fn(),
    enviarRespuesta: vi.fn(),
    vidasSesion: vi.fn(),
  },
  params: { vidasOn: false, maxVidas: 3 },
}));

vi.mock("@/hooks/useWebSocket", () => ({ useWebSocket: () => h.ws }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ sessionId: "s1" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({
  api: h.api,
  imagenPreguntaUrl: () => null,
}));
vi.mock("@/lib/session", () => ({
  getDatosSesionEstudiante: () => ({
    jugadorId: "j1",
    sesionId: "s1",
    nombre: "Ana",
  }),
}));
vi.mock("@/lib/parametros", () => ({
  useParametros: () => ({}),
  tieneRetos: () => false,
  vidasHabilitadas: () => h.params.vidasOn,
  numVidas: () => h.params.maxVidas,
}));

import GamePage from "./page";

const pregunta = {
  id: "p1",
  grado_id: "g1",
  sesion: "1",
  tipo: "opcion-multiple",
  enunciado: "¿Cómo se dice perro en inglés?",
  opciones: ["A) Dog", "B) Cat", "C) Bird", "D) Fish"],
  respuesta_correcta: "A",
  tiempo_limite: 30,
  puntos_por_puesto: { "1": 10 },
  orden: 1,
  activa: true,
  creado_en: "",
  actualizado_en: "",
};

beforeEach(() => {
  h.ws.lastEvent = null;
  h.ws.connected = true;
  h.params.vidasOn = false;
  h.params.maxVidas = 3;
  Object.values(h.api).forEach((fn) => fn.mockReset());
  h.api.vidasSesion.mockResolvedValue([]);
});

describe("GamePage (estudiante)", () => {
  it("muestra la sala de espera en lobby", async () => {
    h.api.sesion.mockResolvedValue({
      id: "s1",
      estado: "lobby",
      pregunta_activa_id: null,
      cronometro_segundos: 0,
    });
    render(<GamePage />);
    expect(await screen.findByText(/Esperando al docente/)).toBeTruthy();
    expect(screen.getByText(/Ana/)).toBeTruthy();
  });

  it("muestra las opciones y envía la respuesta al tocar", async () => {
    h.api.sesion.mockResolvedValue({
      id: "s1",
      estado: "pregunta",
      pregunta_activa_id: "p1",
      cronometro_segundos: 0,
      cronometro_inicio: null,
    });
    h.api.preguntasPorId.mockResolvedValue(pregunta);
    h.api.verificarRespuesta.mockResolvedValue(null);

    render(<GamePage />);
    expect(
      await screen.findByText(/¿Cómo se dice perro en inglés\?/),
    ).toBeTruthy();

    // La opción se muestra sin el prefijo "A) ".
    fireEvent.click(screen.getByRole("button", { name: /Dog/ }));

    await waitFor(() =>
      expect(h.api.enviarRespuesta).toHaveBeenCalledWith(
        expect.objectContaining({
          pregunta_id: "p1",
          jugador_id: "j1",
          opcion_seleccionada: "A",
        }),
      ),
    );
  });

  it("muestra el resultado cuando ya respondió", async () => {
    h.api.sesion.mockResolvedValue({
      id: "s1",
      estado: "resultado",
      pregunta_activa_id: "p1",
      cronometro_segundos: 0,
    });
    h.api.preguntasPorId.mockResolvedValue(pregunta);
    h.api.verificarRespuesta.mockResolvedValue({ correcta: true, puntos: 10 });

    render(<GamePage />);
    expect(await screen.findByText(/¡Correcto!/)).toBeTruthy();
    expect(screen.getByText(/\+10 pts/)).toBeTruthy();
  });

  it("muestra los corazones y el número de vidas restantes", async () => {
    h.params.vidasOn = true;
    h.api.sesion.mockResolvedValue({
      id: "s1",
      estado: "pregunta",
      pregunta_activa_id: "p1",
      cronometro_segundos: 0,
      cronometro_inicio: null,
    });
    h.api.preguntasPorId.mockResolvedValue(pregunta);
    h.api.verificarRespuesta.mockResolvedValue(null);
    h.api.vidasSesion.mockResolvedValue([
      {
        jugador_id: "j1",
        nombre: "Ana",
        conectado: true,
        aciertos: 0,
        errores: 1,
        vidas_restantes: 2,
        vidas_max: 3,
        eliminado: false,
      },
    ]);

    render(<GamePage />);
    expect(await screen.findByText(/2\/3/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Dog/ })).toBeTruthy();
  });

  it("muestra la pantalla de eliminado y oculta las opciones", async () => {
    h.params.vidasOn = true;
    h.api.sesion.mockResolvedValue({
      id: "s1",
      estado: "pregunta",
      pregunta_activa_id: "p1",
      cronometro_segundos: 0,
      cronometro_inicio: null,
    });
    h.api.preguntasPorId.mockResolvedValue(pregunta);
    h.api.verificarRespuesta.mockResolvedValue(null);
    h.api.vidasSesion.mockResolvedValue([
      {
        jugador_id: "j1",
        nombre: "Ana",
        conectado: true,
        aciertos: 0,
        errores: 3,
        vidas_restantes: 0,
        vidas_max: 3,
        eliminado: true,
      },
    ]);

    render(<GamePage />);
    expect(await screen.findByText(/Perdiste todas tus vidas/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Dog/ })).toBeNull();
    expect(h.api.enviarRespuesta).not.toHaveBeenCalled();
  });

  it("rechaza responder cuando el servidor dice que se quedó sin vidas", async () => {
    h.params.vidasOn = true;
    h.api.sesion.mockResolvedValue({
      id: "s1",
      estado: "pregunta",
      pregunta_activa_id: "p1",
      cronometro_segundos: 0,
      cronometro_inicio: null,
    });
    h.api.preguntasPorId.mockResolvedValue(pregunta);
    h.api.verificarRespuesta.mockResolvedValue(null);
    h.api.enviarRespuesta.mockRejectedValue(
      new Error("Ya no te quedan vidas. Se acabó tu turno de responder."),
    );
    h.api.vidasSesion.mockResolvedValue([]);

    render(<GamePage />);
    expect(await screen.findByRole("button", { name: /Dog/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Dog/ }));
    expect(await screen.findByText(/Perdiste todas tus vidas/)).toBeTruthy();
  });
});

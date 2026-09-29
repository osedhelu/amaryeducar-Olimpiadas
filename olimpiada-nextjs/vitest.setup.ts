// Entorno para las pruebas de vitest (jsdom).
process.env.NEXT_PUBLIC_WS_URL = "wss://test.local/ws";
process.env.NEXT_PUBLIC_API_URL = "https://api.test.local";

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

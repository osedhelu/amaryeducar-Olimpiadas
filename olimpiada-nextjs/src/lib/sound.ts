"use client";

/**
 * Gestor de sonido de la olimpiada (Web Audio / HTMLAudioElement sobre los
 * archivos de `public/sounds/`).
 *
 * Los navegadores bloquean audio automático hasta que hay interacción del
 * usuario: por eso existe `unlock()`, que se llama en el primer gesto
 * (botón "Entrar", "Activar sonido", un toque en una respuesta, etc.).
 */

export type SonidoNombre =
  | "correcto"
  | "incorrecto"
  | "unir"
  | "contar"
  | "revelar"
  | "fanfarria"
  | "perder-vida"
  | "eliminado";

const ARCHIVOS: Record<SonidoNombre, string> = {
  correcto: "correcto.wav",
  incorrecto: "incorrecto.wav",
  unir: "unir.wav",
  contar: "contar.wav",
  revelar: "revelar.wav",
  fanfarria: "fanfarria.wav",
  "perder-vida": "perder-vida.wav",
  eliminado: "eliminado.wav",
};

const CLAVE_MUTE = "sonido_mute";

class SoundManager {
  private audio: Map<SonidoNombre, HTMLAudioElement> = new Map();
  private _muted: boolean;
  private unlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      this._muted = localStorage.getItem(CLAVE_MUTE) === "1";
    } else {
      this._muted = false;
    }
  }

  /** Precarga los audios (sin reproducir). */
  preload(): void {
    if (typeof window === "undefined" || this.audio.size > 0) return;
    for (const [nombre, archivo] of Object.entries(ARCHIVOS) as [
      SonidoNombre,
      string,
    ][]) {
      const el = new Audio(`/sounds/${archivo}`);
      el.preload = "auto";
      el.load();
      this.audio.set(nombre, el);
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem(CLAVE_MUTE, muted ? "1" : "0");
    }
  }

  /**
   * Desbloquea el audio. Debe llamarse DENTRO de una interacción del usuario
   * (click/tap). Reproduce en silencio para habilitar los sonidos posteriores.
   */
  unlock(): void {
    if (typeof window === "undefined" || this.unlocked) return;
    this.unlocked = true;
    this.preload();
    const el = this.audio.get("contar");
    if (el) {
      el.muted = true;
      el.currentTime = 0;
      el.play().catch(() => {});
    }
  }

  async play(nombre: SonidoNombre): Promise<void> {
    if (typeof window === "undefined" || this._muted) return;
    this.preload();
    const el = this.audio.get(nombre);
    if (!el) return;
    try {
      el.muted = false;
      el.currentTime = 0;
      await el.play();
    } catch {
      /* audio aún bloqueado: se desbloquea con el próximo gesto */
    }
  }
}

// Singleton compartido por toda la app.
export const sonido = new SoundManager();

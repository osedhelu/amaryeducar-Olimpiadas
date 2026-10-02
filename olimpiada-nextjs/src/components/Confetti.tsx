"use client";

import confetti from "canvas-confetti";

/** Disparo único desde un costado. */
export function fuegoConfeti() {
  if (typeof document === "undefined") return;
  const colores = ["#bc2229", "#f0b429", "#2f9e44", "#ffffff"];
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors: colores,
    zIndex: 9999,
  });
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: colores,
      zIndex: 9999,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: colores,
      zIndex: 9999,
    });
  }, 250);
}

/** Explosión suave y prolongada (para pódium). */
export function lluviaConfeti() {
  if (typeof document === "undefined") return;
  const colores = ["#bc2229", "#f0b429", "#2f9e44", "#ffffff"];
  const end = Date.now() + 1200;
  (function frame() {
    confetti({
      particleCount: 6,
      angle: 90,
      spread: 90,
      startVelocity: 45,
      origin: { x: Math.random(), y: 0.1 },
      colors: colores,
      zIndex: 9999,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export default confetti;

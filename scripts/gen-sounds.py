#!/usr/bin/env python3
"""Genera los efectos de sonido de la olimpiada como WAV.

Se sintetizan en Python (stdlib) y se escriben en
`olimpiada-nextjs/public/sounds/`. Sin dependencias externas.

Re-ejecutable: puede regenerarse en cualquier momento y los archivos se
pueden reemplazar por grabaciones reales con el mismo nombre.
"""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

RATE = 44100
OUT_DIR = (
    Path(__file__).resolve().parent.parent / "olimpiada-nextjs" / "public" / "sounds"
)

AMPL = 0.32


def sine(freq: float, t: float, harmonics: float = 0.5) -> float:
    """Onda tipo campana: fundamental + armónicos que decaen más rápido."""
    y = math.sin(2.0 * math.pi * freq * t)
    y += harmonics * math.sin(2.0 * 2.0 * math.pi * freq * t)
    y += harmonics * 0.4 * math.sin(3.0 * 2.0 * math.pi * freq * t)
    return y / (1.0 + harmonics * 1.4)


def saw(freq: float, t: float) -> float:
    p = (freq * t) % 1.0
    return 2.0 * p - 1.0


def tone(
    freq: float, dur: float, vol: float = AMPL, wave_fn=sine, decay: float = 6.0
) -> list[float]:
    """Tono con ataque corto y decaimiento exponencial."""
    n = int(RATE * dur)
    out: list[float] = []
    for i in range(n):
        t = i / RATE
        # ataque 8ms + decaimiento exponencial
        attack = min(1.0, t / 0.008)
        env = attack * math.exp(-decay * t)
        out.append(wave_fn(freq, t) * vol * env)
    return out


def note(*freqs: tuple[float, float]) -> list[float]:
    """Notas en secuencia (con gap mínimo)."""
    out: list[float] = []
    for f, d in freqs:
        out += tone(f, d)
        out += [0.0] * int(RATE * 0.02)
    return out


def chord(
    freqs: list[float],
    dur: float,
    vol: float = AMPL,
    *,
    wave_fn: object = sine,
) -> list[float]:
    """Acorde: varias frecuencias sonando juntas."""
    n = int(RATE * dur)
    out: list[float] = []
    for i in range(n):
        t = i / RATE
        attack = min(1.0, t / 0.01)
        env = attack * math.exp(-4.5 * t)
        y = sum(wave_fn(f, t) for f in freqs) / len(freqs)  # type: ignore[operator]
        out.append(y * vol * env)
    return out


def _norm(gain: float) -> float:
    return max(-1.0, min(1.0, gain))


def write_wav(name: str, samples: list[float]) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / name
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = bytearray()
        for s in samples:
            frames += struct.pack("<h", int(_norm(s) * 32767))
        w.writeframes(bytes(frames))
    print(f"✓ {path.relative_to(OUT_DIR.parent.parent.parent)}")
    return path


def build() -> None:
    # Acierto: campanita ascendente E5 -> A5
    write_wav("correcto.wav", note((659.25, 0.18), (880.0, 0.45)))

    # Incorrecto: zumbido grave descendente
    write_wav(
        "incorrecto.wav",
        tone(200, 0.16, wave_fn=saw)
        + tone(150, 0.22, wave_fn=saw)
        + tone(110, 0.34, wave_fn=saw),
    )

    # Al unirse: blip ascendente corto
    write_wav("unir.wav", note((783.99, 0.09), (1174.66, 0.14)))

    # Tick del reloj: clic seco
    write_wav("contar.wav", tone(1200, 0.05, vol=0.22, decay=30.0))

    # Revelar resultado: ta-da suave (C5 -> E5 -> G5)
    write_wav(
        "revelar.wav",
        note((523.25, 0.10), (659.25, 0.10), (783.99, 0.28)),
    )

    # Fanfarria pódium: acorde C5-E5-G5 -> A5
    write_wav(
        "fanfarria.wav", chord([523.25, 659.25, 783.99], 0.55) + tone(880.0, 0.45)
    )

    # Perder una vida: dos notas descendentes suaves
    write_wav("perder-vida.wav", note((392.0, 0.14), (293.66, 0.32)))

    # Eliminado: descendente triste
    write_wav("eliminado.wav", note((329.63, 0.22), (261.63, 0.3), (196.0, 0.5)))


if __name__ == "__main__":
    build()

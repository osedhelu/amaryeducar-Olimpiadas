from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any


class RealtimePublisher(ABC):
    """Contrato que el dominio usa para avisar al mundo del WebSocket.
    La implementación concreta vive en infrastructure.realtime.manager."""

    @abstractmethod
    async def publish(
        self, tipo: str, data: dict[str, Any], sesion_id: str | None = None
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    async def broadcast_sesion(
        self, sesion_id: str, tipo: str, data: dict[str, Any]
    ) -> None:
        raise NotImplementedError

    @abstractmethod
    async def programar_cierre(
        self, sesion_id: str, cronometro_inicio: datetime, segundos: int
    ) -> None:
        """El cronómetro es SOLO VISUAL: no cierra la pregunta por tiempo.

        La pregunta se cierra cuando el último jugador conectado responde
        (auto-cierre) o cuando el docente la cierra manualmente.
        """
        raise NotImplementedError

    @abstractmethod
    async def jugadores_conectados(self, sesion_id: str) -> list[str]:
        """IDs de jugadores de la sesión con el WebSocket abierto ahora mismo.

        Se usa para re-marcar `conectado` al (re)lanzar una pregunta, de modo
        que el auto-cierre siga funcionando si se reabre una sesión finalizada.
        """
        raise NotImplementedError

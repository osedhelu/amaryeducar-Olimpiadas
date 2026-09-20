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
        """Programa (o reprograma) el cierre automático de la pregunta activa."""
        raise NotImplementedError

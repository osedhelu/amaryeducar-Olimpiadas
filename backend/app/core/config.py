from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def normalizar_database_url(url: str) -> str:
    """Fuerza el driver asyncpg en la URL de Postgres.

    Railway inyecta DATABASE_URL sin esquema de driver
    (postgresql://usuario:pass@host/db), y SQLAlchemy asíncrono
    necesita postgresql+asyncpg://.
    """
    if url.startswith("postgresql+asyncpg://") or url.startswith("postgres+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+asyncpg://" + url.removeprefix("postgresql://")
    if url.startswith("postgres://"):
        return "postgresql+asyncpg://" + url.removeprefix("postgres://")
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/railway"
    jwt_secret: str = "cambiar-en-produccion"
    jwt_algorithm: str = "HS256"
    jwt_docente_expires: int = 28800  # 8h
    jwt_estudiante_expires: int = 14400  # 4h
    clave_admin: str = "ADMadm1234"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "https://olimpiadas-web-production.up.railway.app",
    ]
    ws_heartbeat_seconds: int = 30
    cronometro_respaldo_segundos: int = 30

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.database_url = normalizar_database_url(self.database_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()

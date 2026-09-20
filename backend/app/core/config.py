from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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


@lru_cache
def get_settings() -> Settings:
    return Settings()

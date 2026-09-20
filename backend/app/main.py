from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.exceptions import DomainError
from app.infrastructure.realtime.manager import ConnectionManager
from app.interfaces.api.routers import answers, auth, sessions
from app.interfaces.websocket import ws

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.manager = manager
    await manager.start()
    logger.info("Backend Amar y Educar iniciado")
    yield
    await manager.stop()


app = FastAPI(
    title="Amar y Educar - Olimpiadas API", version="1.0.0", lifespan=lifespan
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(answers.router)
app.include_router(ws.router)


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "servicio": "amaryeducar-api"}

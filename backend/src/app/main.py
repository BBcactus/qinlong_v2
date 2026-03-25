from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import check_db
from app.scheduler import setup_scheduler
from app.api import market, watchlist, positions, ai, settings, scheduler as scheduler_api
import logging

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ok = await check_db()
    if not ok:
        logging.warning("DB connection failed on startup")
    scheduler = setup_scheduler()
    app.state.scheduler = scheduler
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(
    title="擒龙量化面板 v2",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router, prefix="/api")
app.include_router(watchlist.router, prefix="/api")
app.include_router(positions.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(scheduler_api.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "qinlong-v2"}

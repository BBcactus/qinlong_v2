from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from app.core.db import get_session

router = APIRouter(prefix="/watchlist", tags=["擒龙标的池"])


class WatchlistAdd(BaseModel):
    code: str
    code6: str
    stock_name: str
    note: str = ""
    tags: str = ""


@router.get("/")
async def list_watchlist(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT id, code, code6, stock_name, add_date, note, status, tags
        FROM watchlist
        WHERE status = 'active'
        ORDER BY add_date DESC
    """))
    return {"data": [dict(r._mapping) for r in rows]}


@router.post("/")
async def add_to_watchlist(
    body: WatchlistAdd,
    session: AsyncSession = Depends(get_session),
):
    await session.execute(text("""
        INSERT INTO watchlist (code, code6, stock_name, note, tags)
        VALUES (:code, :code6, :stock_name, :note, :tags)
        ON CONFLICT (code) DO UPDATE SET
            note = EXCLUDED.note, tags = EXCLUDED.tags, status = 'active'
    """), body.model_dump())
    await session.commit()
    return {"ok": True}


@router.delete("/{code}")
async def remove_from_watchlist(
    code: str,
    session: AsyncSession = Depends(get_session),
):
    await session.execute(
        text("UPDATE watchlist SET status = 'removed' WHERE code = :code"),
        {"code": code},
    )
    await session.commit()
    return {"ok": True}

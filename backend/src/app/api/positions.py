from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from decimal import Decimal
from app.core.db import get_session

router = APIRouter(prefix="/positions", tags=["持仓池"])


class PositionOpen(BaseModel):
    code: str
    code6: str
    stock_name: str
    buy_date: str
    buy_price: Decimal
    quantity: int
    note: str = ""


class PositionClose(BaseModel):
    sell_price: Decimal
    sell_date: str
    quantity: int
    note: str = ""


@router.get("/")
async def list_positions(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT id, code, code6, stock_name, buy_date, buy_price, quantity,
               cost_basis, status, note
        FROM position
        WHERE status = 'open'
        ORDER BY buy_date DESC
    """))
    return {"data": [dict(r._mapping) for r in rows]}


@router.post("/")
async def open_position(
    body: PositionOpen,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(text("""
        INSERT INTO position (code, code6, stock_name, buy_date, buy_price, quantity, cost_basis, note)
        VALUES (:code, :code6, :stock_name, :buy_date, :buy_price, :quantity, :buy_price, :note)
        RETURNING id
    """), body.model_dump())
    await session.commit()
    return {"ok": True, "id": result.scalar()}


@router.post("/{position_id}/close")
async def close_position(
    position_id: int,
    body: PositionClose,
    session: AsyncSession = Depends(get_session),
):
    await session.execute(text("""
        UPDATE position SET status = 'closed' WHERE id = :id
    """), {"id": position_id})
    await session.execute(text("""
        INSERT INTO position_history (position_id, action, price, quantity, trade_date, note)
        VALUES (:position_id, 'sell', :sell_price, :quantity, :sell_date, :note)
    """), {"position_id": position_id, **body.model_dump()})
    await session.commit()
    return {"ok": True}

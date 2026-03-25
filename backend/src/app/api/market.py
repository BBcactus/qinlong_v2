from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_session
from datetime import date
from typing import Optional

router = APIRouter(prefix="/market", tags=["行情"])


@router.get("/indices")
async def get_indices(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT DISTINCT ON (secu_code)
               secu_code, secu_name, snap_date, last_px, change, change_px,
               up_num, down_num, flat_num, snapped_at
        FROM index_daily_snapshot
        ORDER BY secu_code, snap_date DESC
    """))
    return {"data": [dict(r._mapping) for r in rows]}


@router.get("/limit-pool")
async def get_limit_pool(
    pool_type: Optional[str] = Query(None, description="up/down/consec/up_open，不传返回全部"),
    snap_date: Optional[date] = Query(None, description="日期 YYYY-MM-DD，默认今天"),
    session: AsyncSession = Depends(get_session),
):
    if snap_date is None:
        row = await session.execute(text("SELECT MAX(snap_date) FROM limit_stock_snapshot"))
        snap_date = row.scalar() or date.today()

    conditions = "WHERE snap_date = :snap_date"
    params: dict = {"snap_date": snap_date}
    if pool_type:
        conditions += " AND pool_type = :pool_type"
        params["pool_type"] = pool_type

    rows = await session.execute(text(f"""
        SELECT secu_code, secu_name, pool_type, last_px, change,
               limit_time, reason, reason_detail,
               plate_codes, plate_names, is_st, limit_days, snapped_at
        FROM limit_stock_snapshot
        {conditions}
        ORDER BY pool_type, limit_days DESC, last_px DESC
    """), params)
    data = [dict(r._mapping) for r in rows]

    # 汇总各池数量
    summary = {"up": 0, "down": 0, "consec": 0, "up_open": 0}
    for row in data:
        pt = row["pool_type"]
        if pt in summary:
            summary[pt] += 1

    return {"data": data, "summary": summary, "date": snap_date}


@router.get("/breadth")
async def get_market_breadth(session: AsyncSession = Depends(get_session)):
    row = await session.execute(text("""
        SELECT snap_date, up_num, down_num, rise_num, fall_num, flat_num,
               up_2, up_4, up_6, up_8, up_10,
               down_2, down_4, down_6, down_8, down_10
        FROM market_breadth_snapshot
        ORDER BY snap_date DESC
        LIMIT 1
    """))
    r = row.mappings().first()
    return {"data": dict(r) if r else None}


@router.get("/hot-plates")
async def get_hot_plates(
    plate_type: str = "industry",
    session: AsyncSession = Depends(get_session),
):
    rows = await session.execute(text("""
        SELECT DISTINCT ON (m.plate_code)
               m.plate_code, m.plate_name, m.plate_type,
               s.change_rate, s.main_inflow, s.main_inflow_rate,
               s.leading_stock, s.leading_stock_code, s.snapped_at
        FROM plate_master m
        LEFT JOIN plate_snapshot s ON s.plate_code = m.plate_code
        WHERE m.plate_type = :plate_type
        ORDER BY m.plate_code, s.snapped_at DESC
    """), {"plate_type": plate_type})
    return {"data": [dict(r._mapping) for r in rows]}

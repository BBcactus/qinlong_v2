"""写入板块数据"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json


async def upsert_plate_master(session: AsyncSession, rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO plate_master (plate_code, plate_name, plate_type)
        VALUES (:plate_code, :plate_name, :plate_type)
        ON CONFLICT (plate_code) DO UPDATE SET
            plate_name = EXCLUDED.plate_name,
            plate_type = EXCLUDED.plate_type
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)


async def upsert_plate_daily_snapshots(session: AsyncSession, rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO plate_daily_snapshot (plate_code, snap_date, change, main_fund_diff, up_stocks)
        VALUES (:plate_code, :snap_date, :change, :main_fund_diff, :up_stocks)
        ON CONFLICT (plate_code, snap_date) DO UPDATE SET
            change = EXCLUDED.change,
            main_fund_diff = EXCLUDED.main_fund_diff,
            up_stocks = EXCLUDED.up_stocks
    """)
    # 序列化 JSONB 字段
    for r in rows:
        if r.get("up_stocks") is not None and not isinstance(r["up_stocks"], str):
            r["up_stocks"] = json.dumps(r["up_stocks"], ensure_ascii=False)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)


async def upsert_plate_stock_map(session: AsyncSession, rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO plate_stock_map (plate_code, stock_code, stock_name)
        VALUES (:plate_code, :stock_code, :stock_name)
        ON CONFLICT (plate_code, stock_code) DO NOTHING
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)

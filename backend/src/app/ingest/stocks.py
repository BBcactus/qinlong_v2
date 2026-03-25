"""写入股票主数据和日快照"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def upsert_stock_master(session: AsyncSession, rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO stock_master (code, code6, stock_name, market, exchange, updated_at)
        VALUES (:code, :code6, :stock_name, :market, :market, NOW())
        ON CONFLICT (code) DO UPDATE SET
            stock_name = EXCLUDED.stock_name,
            market = EXCLUDED.market,
            updated_at = NOW()
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)


async def upsert_stock_daily_snapshots(session: AsyncSession, rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO stock_daily_snapshot
            (code, snap_date, last_px, change, cmc, tr, main_fund_diff, trade_status, market)
        VALUES
            (:code, :snap_date, :last_px, :change, :cmc, :tr, :main_fund_diff, :trade_status, :market)
        ON CONFLICT (code, snap_date) DO UPDATE SET
            last_px = EXCLUDED.last_px,
            change = EXCLUDED.change,
            cmc = EXCLUDED.cmc,
            tr = EXCLUDED.tr,
            main_fund_diff = EXCLUDED.main_fund_diff,
            trade_status = EXCLUDED.trade_status
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)

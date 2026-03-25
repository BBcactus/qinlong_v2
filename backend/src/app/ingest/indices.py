from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any


async def upsert_index_snapshots(session: AsyncSession, rows: list[dict[str, Any]]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO index_snapshot
            (code, name, last_px, change, change_rate, volume, amount,
             open, high, low, prev_close, snapped_at)
        VALUES
            (:code, :name, :last_px, :change, :change_rate, :volume, :amount,
             :open, :high, :low, :prev_close, NOW())
        ON CONFLICT (code, snapped_at::date) DO UPDATE SET
            name = EXCLUDED.name,
            last_px = EXCLUDED.last_px,
            change = EXCLUDED.change,
            change_rate = EXCLUDED.change_rate,
            volume = EXCLUDED.volume,
            amount = EXCLUDED.amount,
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            prev_close = EXCLUDED.prev_close
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)

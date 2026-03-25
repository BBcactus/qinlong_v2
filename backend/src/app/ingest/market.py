"""写入市场宏观数据"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json


async def upsert_index_snapshots(session: AsyncSession, rows: list[dict]) -> int:
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO index_daily_snapshot
            (secu_code, secu_name, snap_date, last_px, change, change_px, up_num, down_num, flat_num)
        VALUES
            (:secu_code, :secu_name, :snap_date, :last_px, :change, :change_px, :up_num, :down_num, :flat_num)
        ON CONFLICT (secu_code, snap_date) DO UPDATE SET
            last_px = EXCLUDED.last_px,
            change = EXCLUDED.change,
            change_px = EXCLUDED.change_px,
            up_num = EXCLUDED.up_num,
            down_num = EXCLUDED.down_num,
            flat_num = EXCLUDED.flat_num
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)


async def upsert_market_breadth(session: AsyncSession, row: dict) -> None:
    if not row:
        return
    if row.get("raw_json") is not None and not isinstance(row["raw_json"], str):
        row["raw_json"] = json.dumps(row["raw_json"], ensure_ascii=False)
    stmt = text("""
        INSERT INTO market_breadth_snapshot
            (snap_date, up_num, down_num, rise_num, fall_num, flat_num,
             up_2, up_4, up_6, up_8, up_10,
             down_2, down_4, down_6, down_8, down_10, raw_json)
        VALUES
            (:snap_date, :up_num, :down_num, :rise_num, :fall_num, :flat_num,
             :up_2, :up_4, :up_6, :up_8, :up_10,
             :down_2, :down_4, :down_6, :down_8, :down_10, :raw_json)
        ON CONFLICT (snap_date) DO UPDATE SET
            up_num = EXCLUDED.up_num, down_num = EXCLUDED.down_num,
            rise_num = EXCLUDED.rise_num, fall_num = EXCLUDED.fall_num,
            flat_num = EXCLUDED.flat_num,
            up_2 = EXCLUDED.up_2, up_4 = EXCLUDED.up_4, up_6 = EXCLUDED.up_6,
            up_8 = EXCLUDED.up_8, up_10 = EXCLUDED.up_10,
            down_2 = EXCLUDED.down_2, down_4 = EXCLUDED.down_4, down_6 = EXCLUDED.down_6,
            down_8 = EXCLUDED.down_8, down_10 = EXCLUDED.down_10,
            raw_json = EXCLUDED.raw_json
    """)
    await session.execute(stmt, row)
    await session.commit()


async def upsert_limit_stock_snapshot(session: AsyncSession, rows: list[dict]) -> int:
    """写入统一涨跌停/连板/炸板四池表 limit_stock_snapshot"""
    if not rows:
        return 0
    stmt = text("""
        INSERT INTO limit_stock_snapshot
            (snap_date, pool_type, secu_code, secu_name, last_px, change, limit_time,
             reason, reason_detail, plate_codes, plate_names, is_st, limit_days)
        VALUES
            (:snap_date, :pool_type, :secu_code, :secu_name, :last_px, :change, :limit_time,
             :reason, :reason_detail, :plate_codes, :plate_names, :is_st, :limit_days)
        ON CONFLICT (snap_date, pool_type, secu_code) DO UPDATE SET
            last_px       = EXCLUDED.last_px,
            change        = EXCLUDED.change,
            limit_time    = EXCLUDED.limit_time,
            reason        = EXCLUDED.reason,
            reason_detail = EXCLUDED.reason_detail,
            plate_codes   = EXCLUDED.plate_codes,
            plate_names   = EXCLUDED.plate_names,
            is_st         = EXCLUDED.is_st,
            limit_days    = EXCLUDED.limit_days,
            snapped_at    = NOW()
    """)
    await session.execute(stmt, rows)
    await session.commit()
    return len(rows)

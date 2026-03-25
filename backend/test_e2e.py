"""端到端测试：fetch → normalize → ingest → 查询 DB"""
import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo

SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")


async def main():
    import sys
    sys.path.insert(0, "src")
    from app.core.db import AsyncSessionLocal
    from app.fetch.stocks import fetch_bj_stocks, fetch_sh_sz_stocks
    from app.fetch.plates import fetch_all_plates
    from app.fetch.market import fetch_index_home, fetch_limit_up_pool, fetch_limit_down_pool
    from app.normalize.stocks import normalize_bj_stock, normalize_sh_sz_stock
    from app.normalize.plates import normalize_plate_master, normalize_plate_snapshot
    from app.normalize.market import normalize_index_snapshots, normalize_market_breadth, normalize_limit_stocks
    from app.ingest.stocks import upsert_stock_master, upsert_stock_daily_snapshots
    from app.ingest.plates import upsert_plate_master, upsert_plate_daily_snapshots
    from app.ingest.market import upsert_index_snapshots, upsert_market_breadth, upsert_limit_up_stocks, upsert_limit_down_stocks
    from sqlalchemy import text

    snap_date = datetime.now(SHANGHAI_TZ).date()
    print(f"snap_date: {snap_date}\n")

    # 1. 北交所
    print("=== 1. 北交所股票 ===")
    bj_items = await fetch_bj_stocks()
    print(f"  抓取: {len(bj_items)} 条")
    masters, snapshots = [], []
    for item in bj_items:
        m, s = normalize_bj_stock(item, snap_date)
        masters.append(m)
        snapshots.append(s)
    async with AsyncSessionLocal() as session:
        n = await upsert_stock_master(session, masters)
        await upsert_stock_daily_snapshots(session, snapshots)
        result = await session.execute(text("SELECT count(*) FROM stock_master WHERE market='bj'"))
        print(f"  stock_master(bj): {result.scalar()} 条")
        result = await session.execute(text(f"SELECT count(*) FROM stock_daily_snapshot WHERE snap_date='{snap_date}' AND market='bj'"))
        print(f"  stock_daily_snapshot(bj,{snap_date}): {result.scalar()} 条")

    # 2. 沪深全股（需要 sign，暂跳过）
    print("\n=== 2. 沪深全股（暂跳过，需 CLS sign）===")

    # 3. 热门板块
    print("\n=== 3. 热门板块 ===")
    all_plates = await fetch_all_plates()
    p_masters, p_snapshots = [], []
    for pt, items in all_plates.items():
        for item in items:
            p_masters.append(normalize_plate_master(item, pt))
            p_snapshots.append(normalize_plate_snapshot(item, pt, snap_date))
        print(f"  {pt}: {len(items)} 条")
    async with AsyncSessionLocal() as session:
        await upsert_plate_master(session, p_masters)
        await upsert_plate_daily_snapshots(session, p_snapshots)
        result = await session.execute(text("SELECT count(*) FROM plate_master"))
        print(f"  plate_master: {result.scalar()} 条")
        result = await session.execute(text(f"SELECT count(*) FROM plate_daily_snapshot WHERE snap_date='{snap_date}'"))
        print(f"  plate_daily_snapshot({snap_date}): {result.scalar()} 条")

    # 4. 市场宏观
    print("\n=== 4. 市场宏观（指数+涨跌分布+涨跌停）===")
    home_data = await fetch_index_home()
    index_rows = normalize_index_snapshots(home_data, snap_date)
    breadth_row = normalize_market_breadth(home_data, snap_date)
    print(f"  指数: {len(index_rows)} 条")
    print(f"  涨跌分布: {'有' if breadth_row else '无'}")

    limit_up_raw = await fetch_limit_up_pool()
    limit_down_raw = await fetch_limit_down_pool()
    limit_up_rows = normalize_limit_stocks(limit_up_raw, "u", snap_date)
    limit_down_rows = normalize_limit_stocks(limit_down_raw, "d", snap_date)
    print(f"  涨停: {len(limit_up_rows)} 条, 跌停: {len(limit_down_rows)} 条")

    async with AsyncSessionLocal() as session:
        await upsert_index_snapshots(session, index_rows)
        if breadth_row:
            await upsert_market_breadth(session, breadth_row)
        await upsert_limit_up_stocks(session, limit_up_rows)
        await upsert_limit_down_stocks(session, limit_down_rows)
        result = await session.execute(text(f"SELECT count(*) FROM index_daily_snapshot WHERE snap_date='{snap_date}'"))
        print(f"  index_daily_snapshot({snap_date}): {result.scalar()} 条")
        result = await session.execute(text(f"SELECT count(*) FROM limit_up_snapshot WHERE snap_date='{snap_date}'"))
        print(f"  limit_up_snapshot({snap_date}): {result.scalar()} 条")

    print("\n全部完成!")


if __name__ == "__main__":
    asyncio.run(main())

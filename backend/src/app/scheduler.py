from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.db import AsyncSessionLocal as async_session_factory
from datetime import datetime
from zoneinfo import ZoneInfo
import logging

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler(timezone="Asia/Shanghai")
SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")


def _today():
    return datetime.now(SHANGHAI_TZ).date()


async def job_all_stocks():
    """全市场股票主数据 + 日快照（沪深 + 北交所）"""
    try:
        from app.fetch.stocks import fetch_sh_sz_stocks, fetch_bj_stocks
        from app.normalize.stocks import normalize_sh_sz_stock, normalize_bj_stock
        from app.ingest.stocks import upsert_stock_master, upsert_stock_daily_snapshots
        snap_date = _today()
        masters, snapshots = [], []

        sh_sz_items = await fetch_sh_sz_stocks()
        for item in sh_sz_items:
            m, s = normalize_sh_sz_stock(item, snap_date)
            masters.append(m)
            snapshots.append(s)

        bj_items = await fetch_bj_stocks()
        for item in bj_items:
            m, s = normalize_bj_stock(item, snap_date)
            masters.append(m)
            snapshots.append(s)

        async with async_session_factory() as session:
            await upsert_stock_master(session, masters)
            await upsert_stock_daily_snapshots(session, snapshots)
        logger.info(f"全市场股票: 沪深{len(sh_sz_items)}条, 北交所{len(bj_items)}条")
    except Exception as e:
        logger.error(f"job_all_stocks 失败: {e}", exc_info=True)


async def job_hot_plates():
    """板块主数据 + 日快照"""
    try:
        from app.fetch.plates import fetch_all_plates, PLATE_TYPES
        from app.normalize.plates import normalize_plate_master, normalize_plate_snapshot
        from app.ingest.plates import upsert_plate_master, upsert_plate_daily_snapshots
        snap_date = _today()
        all_plates = await fetch_all_plates()
        masters, snapshots = [], []
        for pt, items in all_plates.items():
            for item in items:
                masters.append(normalize_plate_master(item, pt))
                snapshots.append(normalize_plate_snapshot(item, pt, snap_date))
        async with async_session_factory() as session:
            await upsert_plate_master(session, masters)
            await upsert_plate_daily_snapshots(session, snapshots)
        logger.info(f"板块快照: {len(snapshots)} 条")
    except Exception as e:
        logger.error(f"job_hot_plates 失败: {e}", exc_info=True)


async def job_plate_stocks():
    """板块成分股（Playwright，只需偶尔更新）"""
    try:
        from app.fetch.plates import fetch_all_plates, fetch_plate_stocks_playwright
        from app.normalize.plates import normalize_plate_stock_map
        from app.ingest.plates import upsert_plate_stock_map
        # 先获取所有板块 code
        all_plates = await fetch_all_plates()
        all_rows = []
        for pt, items in all_plates.items():
            for plate in items:
                plate_code = plate["secu_code"]
                stocks = await fetch_plate_stocks_playwright(plate_code)
                for s in stocks:
                    all_rows.append(normalize_plate_stock_map(plate_code, s))
                logger.info(f"板块 {plate_code} 成分股: {len(stocks)} 条")
        async with async_session_factory() as session:
            await upsert_plate_stock_map(session, all_rows)
        logger.info(f"板块成分股总计: {len(all_rows)} 条")
    except Exception as e:
        logger.error(f"job_plate_stocks 失败: {e}", exc_info=True)


async def job_market_overview():
    """市场宏观：指数 + 涨跌分布 + 涨跌停/连板/炸板（统一写入 limit_stock_snapshot）"""
    try:
        from app.fetch.market import (
            fetch_index_home, fetch_limit_up_pool, fetch_limit_down_pool,
            fetch_consec_pool, fetch_up_open_pool,
        )
        from app.normalize.market import (
            normalize_index_snapshots, normalize_market_breadth,
            normalize_limit_pool,
        )
        from app.ingest.market import (
            upsert_index_snapshots, upsert_market_breadth,
            upsert_limit_stock_snapshot,
        )
        snap_date = _today()
        home_data = await fetch_index_home()
        index_rows = normalize_index_snapshots(home_data, snap_date)
        breadth_row = normalize_market_breadth(home_data, snap_date)

        limit_up_raw   = await fetch_limit_up_pool()
        limit_down_raw = await fetch_limit_down_pool()
        consec_raw     = await fetch_consec_pool()
        up_open_raw    = await fetch_up_open_pool()

        # 新统一表
        up_rows     = normalize_limit_pool(limit_up_raw,   "up",      snap_date)
        down_rows   = normalize_limit_pool(limit_down_raw, "down",    snap_date)
        consec_rows = normalize_limit_pool(consec_raw,     "consec",  snap_date)
        open_rows   = normalize_limit_pool(up_open_raw,    "up_open", snap_date)
        unified_rows = up_rows + down_rows + consec_rows + open_rows

        async with async_session_factory() as session:
            await upsert_index_snapshots(session, index_rows)
            if breadth_row:
                await upsert_market_breadth(session, breadth_row)
            await upsert_limit_stock_snapshot(session, unified_rows)
        logger.info(
            f"市场概览: 指数{len(index_rows)}条, "
            f"涨停{len(up_rows)}条, 跌停{len(down_rows)}条, "
            f"连板{len(consec_rows)}条, 炸板{len(open_rows)}条"
        )
    except Exception as e:
        logger.error(f"job_market_overview 失败: {e}", exc_info=True)


def setup_scheduler() -> AsyncIOScheduler:
    # 每天 9:31 拉全市场股票（沪深+北交所）
    scheduler.add_job(job_all_stocks, CronTrigger(day_of_week="mon-fri", hour=9, minute=31),
                      id="all_stocks", replace_existing=True)
    # 每天 9:32 市场概览（指数+涨跌停），盘中每30分钟更新
    scheduler.add_job(job_market_overview, CronTrigger(day_of_week="mon-fri", hour="9-15", minute="0,30"),
                      id="market_overview", replace_existing=True)
    # 每天 9:30 拉板块行情
    scheduler.add_job(job_hot_plates, CronTrigger(day_of_week="mon-fri", hour="9-15", minute="0,30"),
                      id="hot_plates", replace_existing=True)
    # 板块成分股每周一更新
    scheduler.add_job(job_plate_stocks, CronTrigger(day_of_week="mon", hour=8, minute=30),
                      id="plate_stocks", replace_existing=True)
    return scheduler

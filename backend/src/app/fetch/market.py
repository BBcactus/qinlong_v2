"""市场宏观数据抓取：指数、涨跌分布、涨跌停"""
from app.fetch.cls_client import CLSClient
from app.core.config import settings
from datetime import datetime
from zoneinfo import ZoneInfo

SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")

INDEX_TARGETS = [
    ("sh000001", "上证指数"),
    ("sz399001", "深证成指"),
    ("sz399006", "创业板指"),
    ("sh000688", "科创50"),
    ("sh000300", "沪深300"),
    ("sh000905", "中证500"),
]


def _auth_params() -> dict:
    """带 token/uid 的认证参数（如已配置）"""
    p = {}
    if settings.CLS_TOKEN:
        p["token"] = settings.CLS_TOKEN
    if settings.CLS_UID:
        p["uid"] = settings.CLS_UID
    return p


async def fetch_index_home() -> dict:
    """获取指数 home 数据：index_quote[] + up_down_dis{}"""
    async with CLSClient() as client:
        # CLSClient 已解包 data 字段，直接返回 {index_quote, up_down_dis}
        data = await client.get("/quote/index/home")
    return data if isinstance(data, dict) else {}


async def fetch_limit_up_pool() -> list[dict]:
    """涨停池：含 up_reason, plate[], is_st, limit_up_days"""
    params = {"type": "up_pool", "way": "last_px", "rever": 1, **_auth_params()}
    async with CLSClient() as client:
        data = await client.get("/quote/index/up_down_analysis", params=params)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("list") or data.get("items") or []
    return []


async def fetch_limit_down_pool() -> list[dict]:
    """跌停池"""
    params = {"type": "down_pool", "way": "last_px", "rever": 1, **_auth_params()}
    async with CLSClient() as client:
        data = await client.get("/quote/index/up_down_analysis", params=params)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("list") or data.get("items") or []
    return []


async def fetch_consec_pool() -> list[dict]:
    """连板池：当日连续涨停股"""
    params = {"type": "limit_up_pool", "way": "last_px", "rever": 1, **_auth_params()}
    async with CLSClient() as client:
        data = await client.get("/quote/index/up_down_analysis", params=params)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("list") or data.get("items") or []
    return []


async def fetch_up_open_pool() -> list[dict]:
    """炸板池：今日开板（涨停后打开）股"""
    params = {"type": "open_pool", "way": "last_px", "rever": 1, **_auth_params()}
    async with CLSClient() as client:
        data = await client.get("/quote/index/up_down_analysis", params=params)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("list") or data.get("items") or []
    return []


async def fetch_index_tline(secu_code: str, trade_date: str | None = None) -> list[dict]:
    """获取指数分时线，trade_date 格式 YYYYMMDD，默认今天"""
    if not trade_date:
        trade_date = datetime.now(SHANGHAI_TZ).strftime("%Y%m%d")
    async with CLSClient() as client:
        data = await client.get("/quote/index/tline", params={
            "secu_code": secu_code,
            "date": trade_date,
        })
    return data if isinstance(data, list) else []

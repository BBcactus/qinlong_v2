from app.fetch.cls_client import CLSClient
from typing import Any


async def fetch_index_home() -> dict[str, Any]:
    """
    GET /quote/index/home
    Returns major index snapshot: Shanghai, Shenzhen, ChiNext, STAR, BJ50, etc.
    """
    async with CLSClient() as client:
        data = await client.get("/quote/index/home")
    return data if isinstance(data, dict) else {}


async def fetch_index_tlines(index_code: str, period: str = "1d") -> list[dict[str, Any]]:
    """
    GET /quote/index/tlines
    Returns intraday or historical tick lines for an index.
    index_code: e.g. '000001' (SH), '399001' (SZ)
    period: '1d' | '5d' | '1m'
    """
    async with CLSClient() as client:
        data = await client.get(
            "/quote/index/tlines",
            params={"code": index_code, "period": period},
        )
    if isinstance(data, list):
        return data
    return data.get("tlines") or data.get("list") or []

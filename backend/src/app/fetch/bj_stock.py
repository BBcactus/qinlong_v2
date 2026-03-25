from app.fetch.cls_client import CLSClient
from typing import Any


async def fetch_bj_stocks() -> list[dict[str, Any]]:
    """
    GET /quote/xsb/bj_stock_info
    Returns list of BJ-market stocks with price/change/turnover/mc fields.
    """
    async with CLSClient() as client:
        data = await client.get(
            "/quote/xsb/bj_stock_info",
            params={
                "market": "bj",
                "deviation_num": 9,
                "types": "last_px,change,tr,business_balance,mc",
            },
        )
    # data is dict with keys: index, total_num, items
    if isinstance(data, list):
        return data
    return data.get("items") or data.get("list") or []

from app.fetch.cls_client import CLSClient
from typing import Any, Literal

PlateType = Literal["industry", "concept", "area"]


async def fetch_hot_plates(plate_type: PlateType = "industry") -> list[dict[str, Any]]:
    """
    GET /web_quote/plate/hot_plate
    Returns hot sector list with fund flow data.
    plate_type: industry | concept | area
    """
    async with CLSClient() as client:
        data = await client.get(
            "/web_quote/plate/hot_plate",
            params={"type": plate_type},
        )
    if isinstance(data, list):
        return data
    return data.get("list") or data.get("plates") or []


async def fetch_plate_info(plate_code: str) -> dict[str, Any]:
    """
    GET /web_quote/plate/plate_info
    Returns sector master info for a given plate_code.
    """
    async with CLSClient() as client:
        data = await client.get(
            "/web_quote/plate/plate_info",
            params={"plate_code": plate_code},
        )
    return data if isinstance(data, dict) else {}


async def fetch_plate_stocks(plate_code: str) -> list[dict[str, Any]]:
    """
    GET /web_quote/plate/plate_stocks
    Returns constituent stocks for a given plate_code.
    """
    async with CLSClient() as client:
        data = await client.get(
            "/web_quote/plate/plate_stocks",
            params={"plate_code": plate_code},
        )
    if isinstance(data, list):
        return data
    return data.get("list") or data.get("stocks") or []

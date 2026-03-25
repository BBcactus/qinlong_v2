"""标准化市场宏观数据"""
from datetime import date
import json


def normalize_index_snapshots(home_data: dict, snap_date: date) -> list[dict]:
    rows = []
    for item in home_data.get("index_quote", []):
        rows.append({
            "secu_code": item["secu_code"],
            "secu_name": item["secu_name"].strip(),
            "snap_date": snap_date,
            "last_px": item.get("last_px"),
            "change": item.get("change"),
            "change_px": item.get("change_px"),
            "up_num": item.get("up_num"),
            "down_num": item.get("down_num"),
            "flat_num": item.get("flat_num"),
        })
    return rows


def normalize_market_breadth(home_data: dict, snap_date: date) -> dict | None:
    dis = home_data.get("up_down_dis")
    if not dis:
        return None
    return {
        "snap_date": snap_date,
        "up_num": dis.get("up_num"),
        "down_num": dis.get("down_num"),
        "rise_num": dis.get("rise_num"),
        "fall_num": dis.get("fall_num"),
        "flat_num": dis.get("flat_num"),
        "up_2": dis.get("up_2"),
        "up_4": dis.get("up_4"),
        "up_6": dis.get("up_6"),
        "up_8": dis.get("up_8"),
        "up_10": dis.get("up_10"),
        "down_2": dis.get("down_2"),
        "down_4": dis.get("down_4"),
        "down_6": dis.get("down_6"),
        "down_8": dis.get("down_8"),
        "down_10": dis.get("down_10"),
        "raw_json": dis,
    }


def normalize_limit_pool(items: list[dict], pool_type: str, snap_date: date) -> list[dict]:
    """统一处理四种池: up / down / consec / up_open

    pool_type:
        up       - 涨停池
        down     - 跌停池
        consec   - 连板池
        up_open  - 炸板池
    """
    rows = []
    for item in items:
        plates = item.get("plate") or []
        raw_reason = item.get("up_reason") or item.get("down_reason") or ""
        reason, reason_detail = "", ""
        if raw_reason and "|" in raw_reason:
            parts = raw_reason.split("|", 1)
            reason = parts[0].strip()
            reason_detail = parts[1].strip()
        else:
            reason = raw_reason.strip()
        row = {
            "snap_date": snap_date,
            "pool_type": pool_type,
            "secu_code": item.get("secu_code", ""),
            "secu_name": item.get("secu_name", ""),
            "last_px": item.get("last_px"),
            "change": item.get("change"),
            "limit_time": str(item.get("time", "")),
            "reason": reason,
            "reason_detail": reason_detail,
            "plate_codes": [p["secu_code"] for p in plates],
            "plate_names": [p["secu_name"] for p in plates],
            "is_st": bool(item.get("is_st", 0)),
            "limit_days": item.get("limit_up_days") or item.get("limit_days") or 1,
        }
        rows.append(row)
    return rows

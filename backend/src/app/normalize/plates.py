"""标准化板块数据"""
from datetime import date


def normalize_plate_master(item: dict, plate_type: str) -> dict:
    return {
        "plate_code": item["secu_code"],
        "plate_name": item["secu_name"],
        "plate_type": plate_type,
    }


def normalize_plate_snapshot(item: dict, plate_type: str, snap_date: date) -> dict:
    return {
        "plate_code": item["secu_code"],
        "snap_date": snap_date,
        "change": item.get("change"),
        "main_fund_diff": item.get("main_fund_diff"),
        "up_stocks": item.get("up_stock"),  # 已是 list[dict]
    }


def normalize_plate_stock_map(plate_code: str, stock_item: dict) -> dict:
    return {
        "plate_code": plate_code,
        "stock_code": stock_item.get("secu_code") or stock_item.get("code", ""),
        "stock_name": stock_item.get("secu_name") or stock_item.get("name", ""),
    }

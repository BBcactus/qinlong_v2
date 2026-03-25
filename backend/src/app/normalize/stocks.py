"""标准化股票数据"""
from datetime import date


def normalize_bj_stock(item: dict, snap_date: date) -> tuple[dict, dict]:
    """返回 (master_row, snapshot_row)"""
    code = item["secu_code"]  # 920028.BJ
    master = {
        "code": code,
        "code6": item["ori_code"],
        "stock_name": item["secu_name"],
        "market": "bj",
    }
    snapshot = {
        "code": code,
        "snap_date": snap_date,
        "last_px": item.get("last_px"),
        "change": item.get("change"),
        "cmc": item.get("mc"),  # 北交所用 mc 字段
        "tr": item.get("tr"),
        "main_fund_diff": item.get("business_balance"),  # 北交所无主力净流入，用成交额替代
        "trade_status": item.get("trade_status"),
        "market": "bj",
    }
    return master, snapshot


def normalize_sh_sz_stock(item: dict, snap_date: date) -> tuple[dict, dict]:
    """沪深个股，secu_code 格式 sz300827 / sh600000"""
    code = item["secu_code"]
    market = code[:2]  # 'sh' or 'sz'
    code_raw = code[2:]  # 纯6位代码
    master = {
        "code": code,
        "code6": code_raw,
        "stock_name": item.get("secu_name", ""),
        "market": market,
    }
    snapshot = {
        "code": code,
        "snap_date": snap_date,
        "last_px": item.get("last_px"),
        "change": item.get("change"),
        "cmc": item.get("cmc"),
        "tr": item.get("tr"),
        "main_fund_diff": item.get("main_fund_diff"),
        "trade_status": item.get("trade_status"),
        "market": market,
    }
    return master, snapshot

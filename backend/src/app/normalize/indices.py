from typing import Any

INDEX_NAME_MAP = {
    "000001": "上证指数",
    "399001": "深证成指",
    "399006": "创业板指",
    "000688": "科创50",
    "899050": "北证50",
}


def normalize_index_snapshot(raw: dict[str, Any]) -> dict[str, Any]:
    code = raw.get("code") or ""
    return {
        "code": code,
        "name": raw.get("name") or INDEX_NAME_MAP.get(code, ""),
        "last_px": _float(raw.get("last_px") or raw.get("price")),
        "change": _float(raw.get("change")),
        "change_rate": _float(raw.get("change_rate") or raw.get("chg_rate")),
        "volume": _float(raw.get("volume") or raw.get("vol")),
        "amount": _float(raw.get("amount") or raw.get("turnover")),
        "open": _float(raw.get("open")),
        "high": _float(raw.get("high")),
        "low": _float(raw.get("low")),
        "prev_close": _float(raw.get("prev_close") or raw.get("pre_close")),
    }


def normalize_index_home(raw: dict[str, Any]) -> list[dict[str, Any]]:
    indices = raw.get("list") or raw.get("indices") or []
    if isinstance(indices, dict):
        indices = list(indices.values())
    return [normalize_index_snapshot(i) for i in indices if i]


def _float(val: Any) -> float | None:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None

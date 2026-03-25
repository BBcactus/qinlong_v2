"""沪深 + 北交所全市场股票抓取"""
import asyncio
from datetime import date
from zoneinfo import ZoneInfo
from app.fetch.cls_client import CLSClient

SHANGHAI_TZ = ZoneInfo("Asia/Shanghai")


def _today_sh() -> date:
    from datetime import datetime
    return datetime.now(SHANGHAI_TZ).date()


async def fetch_bj_stocks() -> list[dict]:
    """北交所股票列表，返回原始 items"""
    async with CLSClient() as client:
        data = await client.get("/quote/xsb/bj_stock_info", params={
            "market": "bj",
            "deviation_num": 9,
            "types": "last_px,change,tr,business_balance,mc",
        })
    items = data.get("items", [])
    return items


async def fetch_sh_sz_stocks_json() -> list[dict] | None:
    """沪深全股 JSON 接口，签名失败时返回 None"""
    try:
        async with CLSClient() as client:
            data = await client.get("/v2/quote/a/web/stocks/basic", params={
                "fields": "secu_name,secu_code,trade_status,change,change_px,last_px,cmc,tr",
            })
        if isinstance(data, dict):
            return list(data.values())
        if isinstance(data, list):
            return data
        return None
    except ValueError:
        return None


async def fetch_sh_sz_stocks_playwright() -> list[dict]:
    """Playwright 抓取 cls.cn/allstocks DOM，含加载更多"""
    from playwright.async_api import async_playwright

    def parse_num(s: str) -> float | None:
        s = s.strip().replace("+", "").replace("%", "")
        if s.endswith("亿"):
            try: return float(s[:-1]) * 1e8
            except: return None
        if s.endswith("万"):
            try: return float(s[:-1]) * 1e4
            except: return None
        try: return float(s)
        except: return None

    results = []
    seen: set[str] = set()
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.cls.cn/allstocks", timeout=30000)
        await page.wait_for_timeout(3000)

        # 持续滚动到底，触发懒加载
        prev_count = 0
        for _ in range(300):  # 最多300次滚动，约5000+支股票
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(500)
            rows = await page.query_selector_all("tr.f-s-14")
            if len(rows) == prev_count:
                # 再等一秒确认没有新内容
                await page.wait_for_timeout(1000)
                rows = await page.query_selector_all("tr.f-s-14")
                if len(rows) == prev_count:
                    break
            prev_count = len(rows)

        # 解析表格行
        rows = await page.query_selector_all("tr.f-s-14")
        for row in rows:
            tds = await row.query_selector_all("td")
            if len(tds) < 7:
                continue
            code_el = await tds[0].query_selector("a")
            if not code_el:
                continue
            code = (await code_el.inner_text()).strip()
            if not code or code in seen:
                continue
            seen.add(code)
            name_el = await tds[1].query_selector("a")
            name = (await name_el.inner_text()).strip() if name_el else ""
            market = code[:2] if code[:2] in ("sh", "sz") else "sh"
            change_raw = parse_num((await tds[3].inner_text()).strip())
            tr_raw = parse_num((await tds[4].inner_text()).strip())
            results.append({
                "secu_code": code,
                "secu_name": name,
                "last_px": parse_num((await tds[2].inner_text()).strip()),
                "change": change_raw / 100 if change_raw is not None else None,
                "tr": tr_raw / 100 if tr_raw is not None else None,
                "cmc": parse_num((await tds[5].inner_text()).strip()),
                "main_fund_diff": parse_num((await tds[6].inner_text()).strip()),
                "trade_status": "TRADING",
                "market": market,
            })
        await browser.close()
    return results


async def fetch_sh_sz_stocks() -> list[dict]:
    """优先 JSON，失败回退 Playwright"""
    data = await fetch_sh_sz_stocks_json()
    if data:
        return list(data.values()) if isinstance(data, dict) else data
    return await fetch_sh_sz_stocks_playwright()

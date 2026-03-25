"""板块抓取：全量板块列表 + 成分股（Playwright）"""
from app.fetch.cls_client import CLSClient
from app.core.config import settings

PLATE_TYPES = ["industry", "concept", "area"]


async def fetch_all_plates_by_type(plate_type: str) -> list[dict]:
    """翻页抓取完整板块列表 /web_quote/plate/plate_list，token 认证无需 sign"""
    import httpx
    results = []
    page = 1
    async with httpx.AsyncClient(headers={"User-Agent": settings.CLS_USER_AGENT}, timeout=15) as client:
        while True:
            r = await client.get(
                f"{settings.CLS_BASE_URL}/web_quote/plate/plate_list",
                params={
                    "app": "CailianpressWeb", "os": "web", "sv": "8.4.6",
                    "token": settings.CLS_TOKEN, "uid": settings.CLS_UID,
                    "type": plate_type, "page": page,
                    "way": "change", "rever": 1,
                }
            )
            d = r.json()
            data = d.get("data") or {}
            items = data.get("plate_data", [])
            results.extend(items)
            if data.get("is_all") == 1 or not items:
                break
            page += 1
    return results


async def fetch_hot_plates(plate_type: str) -> list[dict]:
    """兼容旧调用，委托给新函数"""
    return await fetch_all_plates_by_type(plate_type)


async def fetch_all_plates() -> dict[str, list[dict]]:
    """抓取所有类型板块，返回 {plate_type: [items]}"""
    results = {}
    for pt in PLATE_TYPES:
        results[pt] = await fetch_all_plates_by_type(pt)
    return results


async def fetch_plate_stocks_playwright(plate_code: str) -> list[dict]:
    """Playwright 抓取板块成分股页面 cls.cn/plate?code=xxx"""
    from playwright.async_api import async_playwright
    results = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        captured: list = []

        async def handle_response(response):
            url = response.url
            if "plate" in url and ("stocks" in url or "detail" in url or "member" in url):
                try:
                    body = await response.json()
                    d = body.get("data")
                    if isinstance(d, list) and d:
                        captured.extend(d)
                    elif isinstance(d, dict):
                        for v in d.values():
                            if isinstance(v, list):
                                captured.extend(v)
                except Exception:
                    pass

        page.on("response", handle_response)
        await page.goto(
            f"https://www.cls.cn/plate?code={plate_code}",
            wait_until="networkidle",
            timeout=30000,
        )
        # 加载更多
        for _ in range(30):
            try:
                btn = page.locator("text=加载更多").first
                if await btn.is_visible(timeout=2000):
                    await btn.click()
                    await page.wait_for_timeout(800)
                else:
                    break
            except Exception:
                break
        await browser.close()

        seen = set()
        for item in captured:
            code = item.get("secu_code") or item.get("code", "")
            if code and code not in seen:
                seen.add(code)
                results.append(item)
    return results

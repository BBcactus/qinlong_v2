import httpx
from typing import Any
from app.core.config import settings

DEFAULT_PARAMS = {
    "app": "CailianpressWeb",
    "os": "web",
    "sv": "8.4.6",
}

DEFAULT_HEADERS = {
    "User-Agent": settings.CLS_USER_AGENT,
    "Accept": "application/json, text/plain, */*",
}


class CLSClient:
    def __init__(self):
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "CLSClient":
        self._client = httpx.AsyncClient(
            base_url=settings.CLS_BASE_URL,
            headers=DEFAULT_HEADERS,
            timeout=15.0,
        )
        return self

    async def __aexit__(self, *_):
        if self._client:
            await self._client.aclose()

    async def get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        merged = {**DEFAULT_PARAMS, **(params or {})}
        resp = await self._client.get(path, params=merged)
        resp.raise_for_status()
        data = resp.json()
        # Most CLS endpoints wrap in {code, msg, data}
        if isinstance(data, dict) and "code" in data:
            if data["code"] != 200:
                raise ValueError(f"CLS API error {data['code']}: {data.get('msg')}")
            return data.get("data", data)
        return data

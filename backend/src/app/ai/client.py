"""通用 AI 客户端：支持 Anthropic 原生 API 和任意 OpenAI 兼容接口。"""
import httpx
from typing import Any


async def call_ai(
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    message: str,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    """根据 base_url 自动选择 Anthropic 或 OpenAI 兼容协议。"""
    if "anthropic.com" in base_url:
        return await _call_anthropic(base_url, api_key, model, system_prompt, message, temperature, max_tokens)
    return await _call_openai_compat(base_url, api_key, model, system_prompt, message, temperature, max_tokens)


async def _call_anthropic(
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    message: str,
    temperature: float,
    max_tokens: int,
) -> str:
    url = base_url.rstrip("/") + "/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system_prompt,
        "messages": [{"role": "user", "content": message}],
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]


async def _call_openai_compat(
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    message: str,
    temperature: float,
    max_tokens: int,
) -> str:
    url = base_url.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "content-type": "application/json",
    }
    payload: dict[str, Any] = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

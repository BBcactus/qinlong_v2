"""AI 任务执行器：从 DB 读取提供商配置，支持 skill 或 agent 模式。"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.ai.client import call_ai
import os


DEFAULT_SYSTEM_PROMPT = """你是擒龙量化面板的 AI 助手，专注于 A 股市场分析。
请用简洁、专业的中文回答用户问题。
如果需要引用数据，请明确标注数据来源和时间。"""


async def _resolve_provider(session: AsyncSession, provider_id: int) -> dict:
    """从 DB 读取提供商配置，api_key 优先用 DB 存储值，其次读环境变量。"""
    row = await session.execute(
        text("SELECT * FROM ai_provider WHERE id = :id"),
        {"id": provider_id},
    )
    p = row.mappings().first()
    if not p:
        raise ValueError(f"AI 提供商 {provider_id} 不存在")
    api_key = p["api_key"] or os.environ.get(p["api_key_env"] or "", "")
    if not api_key:
        raise ValueError(f"提供商 '{p['name']}' 未配置 API Key")
    return {
        "base_url": p["base_url"],
        "api_key": api_key,
        "model": p["model_id"],
        "name": p["name"],
    }


async def run_skill(
    session: AsyncSession,
    message: str,
    skill_id: int | None = None,
    agent_id: int | None = None,
    context: dict | None = None,
) -> dict:
    system_prompt = DEFAULT_SYSTEM_PROMPT
    temperature = 0.7
    max_tokens = 4096
    provider_cfg: dict | None = None

    if agent_id:
        row = await session.execute(
            text("""
                SELECT a.system_prompt, a.temperature, a.max_tokens,
                       a.provider_id, p.base_url, p.api_key, p.api_key_env, p.model_id, p.name
                FROM ai_agent a
                JOIN ai_provider p ON p.id = a.provider_id
                WHERE a.id = :id AND a.enabled = true
            """),
            {"id": agent_id},
        )
        agent = row.mappings().first()
        if agent:
            system_prompt = agent["system_prompt"] or DEFAULT_SYSTEM_PROMPT
            temperature = float(agent["temperature"] or 0.7)
            max_tokens = int(agent["max_tokens"] or 4096)
            api_key = agent["api_key"] or os.environ.get(agent["api_key_env"] or "", "")
            provider_cfg = {
                "base_url": agent["base_url"],
                "api_key": api_key,
                "model": agent["model_id"],
                "name": agent["name"],
            }
    elif skill_id:
        row = await session.execute(
            text("""
                SELECT s.system_prompt, s.temperature, s.max_tokens,
                       s.provider_id, p.base_url, p.api_key, p.api_key_env, p.model_id, p.name
                FROM ai_skill s
                JOIN ai_provider p ON p.id = s.provider_id
                WHERE s.id = :id AND s.enabled = true
            """),
            {"id": skill_id},
        )
        skill = row.mappings().first()
        if skill:
            system_prompt = skill["system_prompt"] or DEFAULT_SYSTEM_PROMPT
            temperature = float(skill["temperature"] or 0.7)
            max_tokens = int(skill["max_tokens"] or 4096)
            api_key = skill["api_key"] or os.environ.get(skill["api_key_env"] or "", "")
            provider_cfg = {
                "base_url": skill["base_url"],
                "api_key": api_key,
                "model": skill["model_id"],
                "name": skill["name"],
            }

    if provider_cfg is None:
        # 使用默认提供商
        row = await session.execute(
            text("SELECT * FROM ai_provider WHERE is_default = true LIMIT 1")
        )
        p = row.mappings().first()
        if not p:
            raise ValueError("未配置默认 AI 提供商")
        api_key = p["api_key"] or os.environ.get(p["api_key_env"] or "", "")
        if not api_key:
            raise ValueError("默认提供商未配置 API Key，请在系统设置中配置")
        provider_cfg = {
            "base_url": p["base_url"],
            "api_key": api_key,
            "model": p["model_id"],
            "name": p["name"],
        }

    if context:
        ctx_lines = "\n".join(f"{k}: {v}" for k, v in context.items())
        message = f"[上下文]\n{ctx_lines}\n\n{message}"

    reply = await call_ai(
        base_url=provider_cfg["base_url"],
        api_key=provider_cfg["api_key"],
        model=provider_cfg["model"],
        system_prompt=system_prompt,
        message=message,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return {"reply": reply, "model": provider_cfg["model"], "provider": provider_cfg["name"]}

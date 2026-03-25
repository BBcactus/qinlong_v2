"""系统设置 API：AI 提供商、技能、Agent 的 CRUD。"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from app.core.db import get_session

router = APIRouter(prefix="/settings", tags=["设置"])


# ─── 提供商 ────────────────────────────────────────────────────────────────

class ProviderIn(BaseModel):
    name: str
    base_url: str
    api_key: str
    api_key_env: str = ""
    model_id: str
    is_default: bool = False


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    api_key_env: Optional[str] = None
    model_id: Optional[str] = None
    is_default: Optional[bool] = None


@router.get("/providers")
async def list_providers(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT id, name, base_url, api_key_env, model_id, is_default,
               CASE WHEN api_key IS NOT NULL AND api_key != '' THEN true ELSE false END AS has_key
        FROM ai_provider ORDER BY id
    """))
    return {"data": [dict(r._mapping) for r in rows]}


@router.post("/providers")
async def create_provider(body: ProviderIn, session: AsyncSession = Depends(get_session)):
    if body.is_default:
        await session.execute(text("UPDATE ai_provider SET is_default = false"))
    result = await session.execute(
        text("""
            INSERT INTO ai_provider (name, base_url, api_key, api_key_env, model_id, is_default)
            VALUES (:name, :base_url, :api_key, :api_key_env, :model_id, :is_default)
            RETURNING id
        """),
        body.model_dump(),
    )
    await session.commit()
    return {"id": result.scalar()}


@router.patch("/providers/{pid}")
async def update_provider(pid: int, body: ProviderUpdate, session: AsyncSession = Depends(get_session)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "无更新字段")
    if updates.get("is_default"):
        await session.execute(text("UPDATE ai_provider SET is_default = false"))
    sets = ", ".join(f"{k} = :{k}" for k in updates)
    updates["pid"] = pid
    await session.execute(text(f"UPDATE ai_provider SET {sets} WHERE id = :pid"), updates)
    await session.commit()
    return {"ok": True}


@router.delete("/providers/{pid}")
async def delete_provider(pid: int, session: AsyncSession = Depends(get_session)):
    await session.execute(text("DELETE FROM ai_provider WHERE id = :pid"), {"pid": pid})
    await session.commit()
    return {"ok": True}


# ─── 技能 ──────────────────────────────────────────────────────────────────

class SkillIn(BaseModel):
    name: str
    description: str = ""
    system_prompt: str = ""
    provider_id: int
    temperature: float = 0.7
    max_tokens: int = 4096
    enabled: bool = True


class SkillUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    provider_id: Optional[int] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    enabled: Optional[bool] = None


@router.get("/skills")
async def list_skills(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT s.id, s.name, s.description, s.system_prompt, s.temperature,
               s.max_tokens, s.enabled, s.provider_id,
               p.name as provider_name, p.model_id
        FROM ai_skill s
        JOIN ai_provider p ON p.id = s.provider_id
        ORDER BY s.id
    """))
    return {"data": [dict(r._mapping) for r in rows]}


@router.post("/skills")
async def create_skill(body: SkillIn, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        text("""
            INSERT INTO ai_skill (name, description, system_prompt, provider_id, temperature, max_tokens, enabled)
            VALUES (:name, :description, :system_prompt, :provider_id, :temperature, :max_tokens, :enabled)
            RETURNING id
        """),
        body.model_dump(),
    )
    await session.commit()
    return {"id": result.scalar()}


@router.patch("/skills/{sid}")
async def update_skill(sid: int, body: SkillUpdate, session: AsyncSession = Depends(get_session)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "无更新字段")
    sets = ", ".join(f"{k} = :{k}" for k in updates)
    updates["sid"] = sid
    await session.execute(text(f"UPDATE ai_skill SET {sets} WHERE id = :sid"), updates)
    await session.commit()
    return {"ok": True}


@router.delete("/skills/{sid}")
async def delete_skill(sid: int, session: AsyncSession = Depends(get_session)):
    await session.execute(text("DELETE FROM ai_skill WHERE id = :sid"), {"sid": sid})
    await session.commit()
    return {"ok": True}


# ─── Agent ────────────────────────────────────────────────────────────────

class AgentIn(BaseModel):
    name: str
    description: str = ""
    provider_id: int
    system_prompt: str = ""
    temperature: float = 0.7
    max_tokens: int = 4096
    enabled: bool = True


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    provider_id: Optional[int] = None
    system_prompt: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    enabled: Optional[bool] = None


@router.get("/agents")
async def list_agents(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT a.id, a.name, a.description, a.system_prompt, a.temperature,
               a.max_tokens, a.enabled, a.provider_id, a.created_at,
               p.name as provider_name, p.model_id
        FROM ai_agent a
        LEFT JOIN ai_provider p ON p.id = a.provider_id
        ORDER BY a.id
    """))
    return {"data": [dict(r._mapping) for r in rows]}


@router.post("/agents")
async def create_agent(body: AgentIn, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        text("""
            INSERT INTO ai_agent (name, description, provider_id, system_prompt, temperature, max_tokens, enabled)
            VALUES (:name, :description, :provider_id, :system_prompt, :temperature, :max_tokens, :enabled)
            RETURNING id
        """),
        body.model_dump(),
    )
    await session.commit()
    return {"id": result.scalar()}


@router.patch("/agents/{aid}")
async def update_agent(aid: int, body: AgentUpdate, session: AsyncSession = Depends(get_session)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(400, "无更新字段")
    sets = ", ".join(f"{k} = :{k}" for k in updates)
    updates["aid"] = aid
    await session.execute(text(f"UPDATE ai_agent SET {sets} WHERE id = :aid"), updates)
    await session.commit()
    return {"ok": True}


@router.delete("/agents/{aid}")
async def delete_agent(aid: int, session: AsyncSession = Depends(get_session)):
    await session.execute(text("DELETE FROM ai_agent WHERE id = :aid"), {"aid": aid})
    await session.commit()
    return {"ok": True}

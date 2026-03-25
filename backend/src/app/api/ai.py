from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from app.core.db import get_session
from app.ai.runner import run_skill

router = APIRouter(prefix="/ai", tags=["AI"])


class ChatRequest(BaseModel):
    message: str
    skill_id: int | None = None
    agent_id: int | None = None
    context: dict = {}


@router.post("/chat")
async def ai_chat(
    body: ChatRequest,
    session: AsyncSession = Depends(get_session),
):
    result = await run_skill(
        session=session,
        skill_id=body.skill_id,
        agent_id=body.agent_id,
        message=body.message,
        context=body.context,
    )
    return {"data": result}


@router.get("/skills")
async def list_skills(session: AsyncSession = Depends(get_session)):
    rows = await session.execute(text("""
        SELECT s.id, s.name, s.description, s.temperature, s.enabled,
               p.name as provider_name, p.model_id
        FROM ai_skill s
        JOIN ai_provider p ON p.id = s.provider_id
        WHERE s.enabled = true
        ORDER BY s.name
    """))
    return {"data": [dict(r._mapping) for r in rows]}

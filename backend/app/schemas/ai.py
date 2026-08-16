from pydantic import BaseModel, Field
from typing import List, Literal
from uuid import UUID


SupportedLanguage = Literal["en", "hi", "te", "bn"]


class ChatRequest(BaseModel):
    question: str
    user_id: UUID | None = None
    language: SupportedLanguage = "en"


class ChatResponse(BaseModel):
    question: str
    domain: str
    answer: str
    sources: List[str]
    confidence_score: int
    confidence_status: str
    needs_human: bool
    quality_reason: str
    human_escalation: dict
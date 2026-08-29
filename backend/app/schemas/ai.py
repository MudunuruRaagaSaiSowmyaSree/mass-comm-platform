from pydantic import BaseModel
from typing import List, Literal
from uuid import UUID


SupportedLanguage = Literal["en", "hi", "te", "bn"]


# ============================================================
# EXISTING AI CHAT
# ============================================================

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


# ============================================================
# AI CAMPAIGN CONTENT GENERATION
# ============================================================

class CampaignGenerateRequest(BaseModel):
    topic: str
    campaign_type: Literal[
        "awareness",
        "emergency",
        "educational",
        "announcement",
    ]
    language: SupportedLanguage = "en"
    audience: str | None = None
    tone: str = "clear and informative"


class CampaignGenerateResponse(BaseModel):
    topic: str
    campaign_type: str
    language: str
    audience: str | None
    tone: str
    content: str


# ============================================================
# AI TONE CHECK
# ============================================================

class ToneCheckRequest(BaseModel):
    message: str
    audience: str = "general_public"


class ToneCheckResponse(BaseModel):
    message: str
    audience: str
    appropriate: bool
    tone: str
    issues: List[str]
    suggestion: str
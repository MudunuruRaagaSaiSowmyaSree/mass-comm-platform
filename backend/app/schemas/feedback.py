import uuid
from datetime import datetime
from enum import Enum

from pydantic import (
    BaseModel,
    Field,
)


# ============================================================
# ENUMS
# ============================================================

class FeedbackSource(str, Enum):
    REPLY = "reply"
    FORM = "form"
    SURVEY = "survey"
    COMMENT = "comment"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
    WEB = "web"
    OTHER = "other"


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


# ============================================================
# CREATE FEEDBACK
# ============================================================

class FeedbackCreate(BaseModel):

    campaign_id: uuid.UUID | None = None

    audience_member_id: uuid.UUID | None = None

    source: FeedbackSource = (
        FeedbackSource.OTHER
    )

    channel: str | None = None

    message: str = Field(
        min_length=1,
        max_length=10000,
    )

    language: str | None = None

    geography: str | None = None


# ============================================================
# RESPONSE
# ============================================================

class FeedbackResponse(BaseModel):

    id: uuid.UUID

    campaign_id: uuid.UUID | None

    audience_member_id: uuid.UUID | None

    source: FeedbackSource

    channel: str | None

    message: str

    language: str | None

    geography: str | None

    sentiment: SentimentType

    sentiment_score: float

    analysis_metadata: dict | None

    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

class SentimentSummary(BaseModel):

    total_feedback: int

    positive: int

    neutral: int

    negative: int

    positive_percentage: float

    neutral_percentage: float

    negative_percentage: float


# ============================================================
# TREND ITEM
# ============================================================

class EngagementTrendItem(BaseModel):

    date: str

    feedback_count: int

    positive: int

    neutral: int

    negative: int
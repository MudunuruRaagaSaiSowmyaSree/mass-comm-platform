import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Float,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# ============================================================
# FEEDBACK SOURCE
# ============================================================

class FeedbackSource(str, enum.Enum):
    REPLY = "reply"
    FORM = "form"
    SURVEY = "survey"
    COMMENT = "comment"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    EMAIL = "email"
    WEB = "web"
    OTHER = "other"


# ============================================================
# SENTIMENT
# ============================================================

class SentimentType(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


# ============================================================
# FEEDBACK
# ============================================================

class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # --------------------------------------------------------
    # CAMPAIGN
    # --------------------------------------------------------

    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("campaigns.id"),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # AUDIENCE MEMBER
    # --------------------------------------------------------

    audience_member_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("audience_members.id"),
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # SOURCE
    # --------------------------------------------------------

    source: Mapped[FeedbackSource] = mapped_column(
        Enum(
            FeedbackSource,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="feedbacksource",
        ),
        default=FeedbackSource.OTHER,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # CHANNEL
    # --------------------------------------------------------

    channel: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # FEEDBACK CONTENT
    # --------------------------------------------------------

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # --------------------------------------------------------
    # LANGUAGE
    # --------------------------------------------------------

    language: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # GEOGRAPHY
    # --------------------------------------------------------

    geography: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    # --------------------------------------------------------
    # SENTIMENT
    # --------------------------------------------------------

    sentiment: Mapped[SentimentType] = mapped_column(
        Enum(
            SentimentType,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="sentimenttype",
        ),
        default=SentimentType.NEUTRAL,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # SENTIMENT SCORE
    # --------------------------------------------------------

    sentiment_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    # --------------------------------------------------------
    # AI/NLP INFORMATION
    # --------------------------------------------------------

    analysis_metadata: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # --------------------------------------------------------
    # CREATED
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )
import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    String,
    ForeignKey,
    Enum,
    DateTime,
    JSON,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CampaignType(str, enum.Enum):
    AWARENESS = "awareness"
    EMERGENCY = "emergency"
    EDUCATIONAL = "educational"
    ANNOUNCEMENT = "announcement"


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    READY = "ready"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    COMPLETED = "completed"
    FAILED = "failed"


class RecipientStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    type: Mapped[CampaignType] = mapped_column(
        Enum(
            CampaignType,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="campaigntype",
        ),
        nullable=False,
    )

    status: Mapped[CampaignStatus] = mapped_column(
        Enum(
            CampaignStatus,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="campaignstatus",
        ),
        default=CampaignStatus.DRAFT,
        index=True,
        nullable=False,
    )

    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    target_filters: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    template_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("templates.id"),
        nullable=True,
    )

    channels: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=lambda: ["email"],
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )


class CampaignRecipient(Base):
    __tablename__ = "campaign_recipients"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("campaigns.id"),
        nullable=False,
    )

    audience_member_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audience_members.id"),
        nullable=False,
    )

    status: Mapped[RecipientStatus] = mapped_column(
        Enum(
            RecipientStatus,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="recipientstatus",
        ),
        default=RecipientStatus.PENDING,
        nullable=False,
        index=True,
    )

    contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
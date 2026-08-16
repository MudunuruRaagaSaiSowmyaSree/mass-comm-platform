import uuid
import enum
from datetime import datetime

from sqlalchemy import ForeignKey, Enum, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RecipientStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"


class CampaignRecipient(Base):
    __tablename__ = "campaign_recipients"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("campaigns.id"),
        index=True
    )

    audience_member_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("audience_members.id"),
        index=True
    )

    status: Mapped[RecipientStatus] = mapped_column(
        Enum(RecipientStatus),
        default=RecipientStatus.PENDING,
        index=True
    )

    contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    error_message: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )
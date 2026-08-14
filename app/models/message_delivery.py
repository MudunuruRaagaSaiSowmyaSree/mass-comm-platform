import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Enum, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.campaign_recipient import RecipientStatus


class MessageDelivery(Base):
    __tablename__ = "message_deliveries"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("campaign_recipients.id"),
        index=True,
    )

    channel: Mapped[str] = mapped_column(
        String,
        default="sms",
    )

    status: Mapped[RecipientStatus] = mapped_column(
        Enum(RecipientStatus),
        default=RecipientStatus.PENDING,
        index=True,
    )

    provider_message_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
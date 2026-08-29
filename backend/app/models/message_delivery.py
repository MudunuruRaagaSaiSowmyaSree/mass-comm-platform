import uuid

from datetime import datetime

from sqlalchemy import (
    ForeignKey,
    Enum,
    DateTime,
    String,
    Integer,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base

from app.models.campaign_recipient import (
    RecipientStatus,
)


# ============================================================
# MESSAGE DELIVERY
# ============================================================

class MessageDelivery(Base):

    __tablename__ = "message_deliveries"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ========================================================
    # CAMPAIGN RECIPIENT
    # ========================================================

    recipient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "campaign_recipients.id"
        ),
        index=True,
        nullable=False,
    )

    # ========================================================
    # CHANNEL
    # ========================================================

    channel: Mapped[str] = mapped_column(
        String,
        nullable=False,
        index=True,
    )

    # ========================================================
    # DELIVERY STATUS
    # ========================================================

    status: Mapped[RecipientStatus] = mapped_column(
        Enum(
            RecipientStatus,
            values_callable=lambda enum_cls: [
                item.value
                for item in enum_cls
            ],
            name="recipientstatus",
            native_enum=True,
            validate_strings=True,
        ),
        default=RecipientStatus.PENDING,
        index=True,
        nullable=False,
    )

    # ========================================================
    # PROVIDER
    # ========================================================

    provider_message_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
        index=True,
    )

    provider: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    # ========================================================
    # DELIVERY TIMESTAMPS
    # ========================================================

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    failed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_attempt_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ========================================================
    # RETRY
    # ========================================================

    retry_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    max_retries: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False,
    )

    # ========================================================
    # ERROR
    # ========================================================

    error_message: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
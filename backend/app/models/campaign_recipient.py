import enum
import uuid

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


# ============================================================
# RECIPIENT STATUS
# ============================================================

class RecipientStatus(str, enum.Enum):

    PENDING = "pending"

    SENT = "sent"

    DELIVERED = "delivered"

    FAILED = "failed"

    RETRYING = "retrying"


# ============================================================
# CAMPAIGN RECIPIENT
# ============================================================

class CampaignRecipient(Base):

    __tablename__ = "campaign_recipients"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ========================================================
    # CAMPAIGN
    # ========================================================

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "campaigns.id"
        ),
        index=True,
        nullable=False,
    )

    # ========================================================
    # AUDIENCE MEMBER
    # ========================================================

    audience_member_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "audience_members.id"
        ),
        index=True,
        nullable=False,
    )

    # ========================================================
    # STATUS
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
    # CONTACTED
    # ========================================================

    contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ========================================================
    # ERROR
    # ========================================================

    error_message: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )
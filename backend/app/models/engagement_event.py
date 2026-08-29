import enum
import uuid

from datetime import datetime

from sqlalchemy import (
    ForeignKey,
    Enum,
    DateTime,
    JSON,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database import Base


# ============================================================
# ENGAGEMENT TYPE
# ============================================================

class EngagementType(str, enum.Enum):

    OPEN = "open"

    CLICK = "click"

    RESPONSE = "response"

    PARTICIPATION = "participation"


# ============================================================
# ENGAGEMENT EVENT
# ============================================================

class EngagementEvent(Base):

    __tablename__ = "engagement_events"

    # ========================================================
    # PRIMARY KEY
    # ========================================================

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ========================================================
    # DELIVERY
    # ========================================================

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "message_deliveries.id"
        ),
        index=True,
        nullable=False,
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
    # EVENT TYPE
    # ========================================================

    event_type: Mapped[EngagementType] = mapped_column(
        Enum(
            EngagementType,
            values_callable=lambda enum_cls: [
                item.value
                for item in enum_cls
            ],
            name="engagementtype",
        ),
        index=True,
        nullable=False,
    )

    # ========================================================
    # EVENT TIME
    # ========================================================

    event_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True,
        nullable=False,
    )

    # ========================================================
    # OPTIONAL EVENT INFORMATION
    # ========================================================

    event_metadata: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    # ========================================================
    # IP ADDRESS
    # ========================================================

    ip_address: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    # ========================================================
    # USER AGENT
    # ========================================================

    user_agent: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
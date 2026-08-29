import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# ============================================================
# SCHEDULE FREQUENCY
# ============================================================

class ScheduleFrequency(str, enum.Enum):
    ONE_TIME = "one_time"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


# ============================================================
# SCHEDULE STATUS
# ============================================================

class ScheduleStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


# ============================================================
# CAMPAIGN SCHEDULE
# ============================================================

class CampaignSchedule(Base):
    """
    Stores scheduling information for a campaign.

    Supports:

        - One-time campaigns
        - Hourly recurring campaigns
        - Daily recurring campaigns
        - Weekly recurring campaigns
        - Monthly recurring campaigns
        - Timezone
        - Priority
        - Active/paused/cancelled state
        - Next execution time
    """

    __tablename__ = "campaign_schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # --------------------------------------------------------
    # CAMPAIGN
    # --------------------------------------------------------

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("campaigns.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # SCHEDULE
    # --------------------------------------------------------

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        default="UTC",
        nullable=False,
    )

    frequency: Mapped[ScheduleFrequency] = mapped_column(
        Enum(
            ScheduleFrequency,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="schedulefrequency",
        ),
        default=ScheduleFrequency.ONE_TIME,
        nullable=False,
    )

    # --------------------------------------------------------
    # RECURRING SETTINGS
    # --------------------------------------------------------

    interval: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    max_occurrences: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    occurrence_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    status: Mapped[ScheduleStatus] = mapped_column(
        Enum(
            ScheduleStatus,
            values_callable=lambda enum_cls: [
                item.value for item in enum_cls
            ],
            name="schedulestatus",
        ),
        default=ScheduleStatus.ACTIVE,
        nullable=False,
        index=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # PRIORITY
    # --------------------------------------------------------

    priority: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # EXECUTION TRACKING
    # --------------------------------------------------------

    last_run_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    next_run_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        index=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    # --------------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.campaign_schedule import (
    ScheduleFrequency,
    ScheduleStatus,
)


# ============================================================
# CREATE SCHEDULE
# ============================================================

class CampaignScheduleCreate(BaseModel):
    campaign_id: UUID

    scheduled_at: datetime

    timezone: str = Field(
        default="UTC",
        min_length=1,
        max_length=100,
    )

    frequency: ScheduleFrequency = (
        ScheduleFrequency.ONE_TIME
    )

    interval: int = Field(
        default=1,
        ge=1,
    )

    max_occurrences: int | None = Field(
        default=None,
        ge=1,
    )

    priority: int = Field(
        default=5,
        ge=1,
        le=10,
    )

    enabled: bool = True

    @field_validator("timezone")
    @classmethod
    def validate_timezone(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Timezone is required."
            )

        return value


# ============================================================
# UPDATE SCHEDULE
# ============================================================

class CampaignScheduleUpdate(BaseModel):
    scheduled_at: datetime | None = None

    timezone: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    frequency: ScheduleFrequency | None = None

    interval: int | None = Field(
        default=None,
        ge=1,
    )

    max_occurrences: int | None = Field(
        default=None,
        ge=1,
    )

    priority: int | None = Field(
        default=None,
        ge=1,
        le=10,
    )

    enabled: bool | None = None

    status: ScheduleStatus | None = None


# ============================================================
# RESPONSE
# ============================================================

class CampaignScheduleResponse(BaseModel):
    id: UUID

    campaign_id: UUID

    scheduled_at: datetime

    timezone: str

    frequency: ScheduleFrequency

    interval: int

    max_occurrences: int | None

    occurrence_count: int

    status: ScheduleStatus

    enabled: bool

    priority: int

    last_run_at: datetime | None

    next_run_at: datetime | None

    error_message: str | None

    created_at: datetime

    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }
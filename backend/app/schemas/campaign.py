import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.campaign import (
    CampaignType,
    CampaignStatus,
)


class CampaignCreate(BaseModel):
    title: str
    content: str
    type: str

    target_filters: dict = Field(
        default_factory=dict
    )

    scheduled_at: datetime | None = None

    template_id: uuid.UUID | None = None

    # ============================================================
    # MULTI-CHANNEL
    # ============================================================

    channels: list[str] = Field(
        default_factory=lambda: ["email"]
    )


class CampaignOut(BaseModel):
    id: uuid.UUID

    title: str

    content: str | None

    type: CampaignType

    status: CampaignStatus

    created_by: uuid.UUID

    target_filters: dict | None

    template_id: uuid.UUID | None

    channels: list[str]

    created_at: datetime

    scheduled_at: datetime | None

    started_at: datetime | None

    completed_at: datetime | None

    class Config:
        from_attributes = True
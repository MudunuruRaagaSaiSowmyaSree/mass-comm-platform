import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.campaign import CampaignType, CampaignStatus


class CampaignCreate(BaseModel):
    title: str
    content: str
    type: str
    target_filters: dict = {}
    scheduled_at: datetime | None = None


class CampaignOut(BaseModel):
    id: uuid.UUID
    title: str
    type: CampaignType
    status: CampaignStatus
    created_by: uuid.UUID
    target_filters: dict | None
    template_id: uuid.UUID | None
    created_at: datetime
    scheduled_at: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    content: str | None = None

    class Config:
        from_attributes = True
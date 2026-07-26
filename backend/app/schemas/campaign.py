import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.campaign import CampaignType, CampaignStatus

class CampaignCreate(BaseModel):
    title: str
    type: CampaignType
    target_filters: dict | None = None
    template_id: uuid.UUID | None = None

class CampaignOut(BaseModel):
    id: uuid.UUID
    title: str
    type: CampaignType
    status: CampaignStatus
    created_by: uuid.UUID
    target_filters: dict | None
    template_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True
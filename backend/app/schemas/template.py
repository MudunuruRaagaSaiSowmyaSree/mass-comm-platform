import uuid
from datetime import datetime
from pydantic import BaseModel

from app.models.campaign import CampaignType


class TemplateCreate(BaseModel):
    name: str
    campaign_type: CampaignType
    body: str
    language: str = "en"


class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    campaign_type: CampaignType
    body: str
    language: str
    created_by: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
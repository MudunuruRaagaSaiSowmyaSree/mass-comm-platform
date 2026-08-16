import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.campaign_recipient import RecipientStatus


class CampaignRecipientOut(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    audience_member_id: uuid.UUID
    status: RecipientStatus
    contacted_at: datetime | None
    error_message: str | None

    class Config:
        from_attributes = True
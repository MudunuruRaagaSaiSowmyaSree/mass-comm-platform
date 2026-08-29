import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.campaign_recipient import RecipientStatus


class MessageDeliveryOut(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    channel: str
    status: RecipientStatus
    provider_message_id: str | None
    sent_at: datetime | None
    error_message: str | None

    class Config:
        from_attributes = True
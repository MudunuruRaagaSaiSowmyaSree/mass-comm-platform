import uuid
from datetime import datetime
from pydantic import BaseModel

class AudienceMemberCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    language: str
    geography: str | None = None
    occupation: str | None = None
    org_id: uuid.UUID | None = None

class AudienceMemberOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str | None
    language: str
    geography: str | None
    occupation: str | None
    org_id: uuid.UUID | None
    engagement_score: float
    last_contacted_at: datetime | None

    class Config:
        from_attributes = True
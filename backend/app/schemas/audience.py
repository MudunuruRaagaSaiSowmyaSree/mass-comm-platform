import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AudienceMemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: str | None = None
    phone: str | None = None

    language: str = Field(min_length=2, max_length=50)
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

    model_config = ConfigDict(from_attributes=True)
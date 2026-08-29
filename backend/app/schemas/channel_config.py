from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


SUPPORTED_CHANNELS = {
    "email",
    "sms",
    "whatsapp",
    "push",
    "web_broadcast",
}


class ChannelConfigCreate(BaseModel):
    channel: str
    enabled: bool = False
    config: dict[str, Any] = Field(default_factory=dict)


class ChannelConfigUpdate(BaseModel):
    enabled: bool | None = None
    config: dict[str, Any] | None = None


class ChannelConfigResponse(BaseModel):
    id: str
    channel: str
    enabled: bool
    config: dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )
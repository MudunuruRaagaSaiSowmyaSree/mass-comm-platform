import uuid

from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)

from app.models.engagement_event import EngagementType


# ============================================================
# CREATE ENGAGEMENT EVENT
# ============================================================

class EngagementEventCreate(BaseModel):

    event_type: EngagementType

    metadata: dict[str, Any] | None = None


# ============================================================
# ENGAGEMENT EVENT RESPONSE
# ============================================================

class EngagementEventResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

    id: uuid.UUID

    delivery_id: uuid.UUID

    campaign_id: uuid.UUID

    audience_member_id: uuid.UUID

    event_type: EngagementType

    event_at: datetime

    # --------------------------------------------------------
    # Database field:
    #     event_metadata
    #
    # API field:
    #     metadata
    # --------------------------------------------------------

    metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias="event_metadata",
        serialization_alias="metadata",
    )

    ip_address: str | None = None

    user_agent: str | None = None


# ============================================================
# DELIVERY STATUS UPDATE
# ============================================================

class DeliveryStatusUpdate(BaseModel):

    status: str = Field(
        ...,
        description=(
            "Delivery status: "
            "pending, sent, delivered, failed"
        ),
    )

    error_message: str | None = None


# ============================================================
# ENGAGEMENT SUMMARY RESPONSE
# ============================================================

class EngagementSummaryResponse(BaseModel):

    campaign_id: uuid.UUID

    total_deliveries: int

    pending: int

    sent: int

    delivered: int

    failed: int

    retrying: int

    opens: int

    clicks: int

    responses: int

    participation: int

    open_rate: float

    click_through_rate: float

    response_rate: float

    participation_rate: float
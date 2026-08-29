from datetime import datetime

from pydantic import BaseModel


class DeliveryAnalytics(BaseModel):
    total_recipients: int
    total_deliveries: int

    pending: int
    sent: int
    delivered: int
    failed: int

    delivery_rate: float
    failure_rate: float


class ChannelAnalytics(BaseModel):
    channel: str

    total: int
    pending: int
    sent: int
    delivered: int
    failed: int

    delivery_rate: float


class CampaignAnalytics(BaseModel):
    campaign_id: str
    campaign_status: str

    total_recipients: int
    total_deliveries: int

    pending: int
    sent: int
    delivered: int
    failed: int

    delivery_rate: float
    failure_rate: float

    opens: int
    clicks: int
    responses: int
    participation: int

    open_rate: float
    click_through_rate: float
    response_rate: float
    participation_rate: float

    started_at: datetime | None
    completed_at: datetime | None

    channels: list[ChannelAnalytics]


class AnalyticsSummary(BaseModel):
    total_campaigns: int
    total_recipients: int
    total_deliveries: int

    pending: int
    sent: int
    delivered: int
    failed: int

    delivery_rate: float
    failure_rate: float

    opens: int
    clicks: int
    responses: int
    participation: int

    open_rate: float
    click_through_rate: float
    response_rate: float
    participation_rate: float
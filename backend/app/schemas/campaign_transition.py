from pydantic import BaseModel
from app.models.campaign import CampaignStatus


class CampaignTransitionRequest(BaseModel):
    new_status: CampaignStatus
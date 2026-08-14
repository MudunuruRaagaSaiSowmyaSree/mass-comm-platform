from app.models.campaign import CampaignStatus
from pydantic import BaseModel

class CampaignTransitionRequest(BaseModel):
    new_status: CampaignStatus
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.campaign import Campaign, CampaignStatus
from app.models.user import User, Role
from app.schemas.campaign import CampaignCreate, CampaignOut
from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.schemas.campaign_transition import CampaignTransitionRequest

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

@router.post("/", response_model=CampaignOut)
async def create_campaign(
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    campaign = Campaign(
        title=data.title,
        type=data.type,
        target_filters=data.target_filters,
        template_id=data.template_id,
        created_by=current_user.id,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return campaign

@router.get("/", response_model=list[CampaignOut])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: CampaignStatus | None = None,
    type_filter: str | None = None,
):
    stmt = select(Campaign)
    if status_filter:
        stmt = stmt.where(Campaign.status == status_filter)
    if type_filter:
        stmt = stmt.where(Campaign.type == type_filter)
    stmt = stmt.order_by(Campaign.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign

@router.put("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Only draft campaigns can be edited")
    campaign.title = data.title
    campaign.type = data.type
    campaign.target_filters = data.target_filters
    campaign.template_id = data.template_id
    await db.commit()
    await db.refresh(campaign)
    return campaign

ALLOWED_TRANSITIONS: dict[CampaignStatus, set[CampaignStatus]] = {
    CampaignStatus.DRAFT: {CampaignStatus.REVIEW},
    CampaignStatus.REVIEW: {CampaignStatus.SCHEDULED, CampaignStatus.DRAFT},
    CampaignStatus.SCHEDULED: {CampaignStatus.SENDING},
    CampaignStatus.SENDING: {CampaignStatus.COMPLETED, CampaignStatus.FAILED},
    CampaignStatus.COMPLETED: set(),
    CampaignStatus.FAILED: set(),
}

@router.post("/{campaign_id}/transition", response_model=CampaignOut)
async def transition_campaign(
    campaign_id: uuid.UUID,
    data: CampaignTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    campaign = await db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    allowed_next = ALLOWED_TRANSITIONS.get(campaign.status, set())
    if data.new_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move campaign from '{campaign.status.value}' to '{data.new_status.value}'",
        )

    campaign.status = data.new_status
    await db.commit()
    await db.refresh(campaign)
    return campaign
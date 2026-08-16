import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.campaign import Campaign, CampaignType, CampaignStatus
from app.models.user import User, Role
from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.schemas.campaign import CampaignCreate
from app.schemas.campaign_transition import CampaignTransitionRequest


router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
)


# ============================================================
# CREATE CAMPAIGN
# ============================================================

@router.post("/")
async def create_campaign(
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER
        )
    ),
):
    # Validate campaign type
    try:
        campaign_type = CampaignType(data.type.lower())
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid campaign type. "
                "Allowed values: awareness, emergency, "
                "educational, announcement."
            ),
        )

    # Convert timezone-aware datetime to naive datetime
    scheduled_at = data.scheduled_at

    if scheduled_at is not None and scheduled_at.tzinfo is not None:
        scheduled_at = scheduled_at.replace(tzinfo=None)

    campaign = Campaign(
        title=data.title.strip(),
        content=data.content.strip(),
        type=campaign_type,
        status=CampaignStatus.DRAFT,
        created_by=current_user.id,
        target_filters=data.target_filters or {},
        template_id=None,
        scheduled_at=scheduled_at,
    )

    db.add(campaign)

    try:
        await db.commit()
        await db.refresh(campaign)

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to create campaign: {str(exc)}",
        )

    return campaign


# ============================================================
# LIST CAMPAIGNS
# ============================================================

@router.get("/")
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: CampaignStatus | None = None,
    type_filter: CampaignType | None = None,
):
    stmt = select(Campaign)

    if status_filter is not None:
        stmt = stmt.where(
            Campaign.status == status_filter
        )

    if type_filter is not None:
        stmt = stmt.where(
            Campaign.type == type_filter
        )

    stmt = stmt.order_by(
        Campaign.created_at.desc()
    )

    result = await db.execute(stmt)

    return result.scalars().all()


# ============================================================
# GET SINGLE CAMPAIGN
# ============================================================

@router.get("/{campaign_id}")
async def get_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = await db.get(
        Campaign,
        campaign_id
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    return campaign


# ============================================================
# UPDATE CAMPAIGN
# ============================================================

@router.put("/{campaign_id}")
async def update_campaign(
    campaign_id: uuid.UUID,
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER
        )
    ),
):
    campaign = await db.get(
        Campaign,
        campaign_id
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    if campaign.status != CampaignStatus.DRAFT:
        raise HTTPException(
            status_code=400,
            detail="Only draft campaigns can be edited",
        )

    try:
        campaign_type = CampaignType(data.type.lower())
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid campaign type. "
                "Allowed values: awareness, emergency, "
                "educational, announcement."
            ),
        )

    scheduled_at = data.scheduled_at

    if scheduled_at is not None and scheduled_at.tzinfo is not None:
        scheduled_at = scheduled_at.replace(tzinfo=None)

    campaign.title = data.title.strip()
    campaign.content = data.content.strip()
    campaign.type = campaign_type
    campaign.target_filters = data.target_filters or {}
    campaign.scheduled_at = scheduled_at

    await db.commit()
    await db.refresh(campaign)

    return campaign


# ============================================================
# ALLOWED STATUS TRANSITIONS
# ============================================================

ALLOWED_TRANSITIONS = {
    CampaignStatus.DRAFT: {
        CampaignStatus.REVIEW,
    },

    CampaignStatus.REVIEW: {
        CampaignStatus.READY,
        CampaignStatus.DRAFT,
    },

    CampaignStatus.READY: {
        CampaignStatus.SCHEDULED,
    },

    CampaignStatus.SCHEDULED: {
        CampaignStatus.SENDING,
    },

    CampaignStatus.SENDING: {
        CampaignStatus.COMPLETED,
        CampaignStatus.FAILED,
    },

    CampaignStatus.COMPLETED: set(),

    CampaignStatus.FAILED: set(),
}


# ============================================================
# CHANGE CAMPAIGN STATUS
# ============================================================

@router.post(
    "/{campaign_id}/transition",
)
async def transition_campaign(
    campaign_id: uuid.UUID,
    data: CampaignTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER
        )
    ),
):
    campaign = await db.get(
        Campaign,
        campaign_id
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    allowed_next = ALLOWED_TRANSITIONS.get(
        campaign.status,
        set(),
    )

    if data.new_status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot move campaign from "
                f"'{campaign.status.value}' to "
                f"'{data.new_status.value}'"
            ),
        )

    # Scheduled campaigns must have scheduled_at
    if (
        data.new_status == CampaignStatus.SCHEDULED
        and campaign.scheduled_at is None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "scheduled_at is required "
                "before scheduling a campaign"
            ),
        )

    campaign.status = data.new_status

    if data.new_status == CampaignStatus.SENDING:
        campaign.started_at = datetime.utcnow()

    if data.new_status == CampaignStatus.COMPLETED:
        campaign.completed_at = datetime.utcnow()

    if data.new_status == CampaignStatus.FAILED:
        campaign.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(campaign)

    return campaign
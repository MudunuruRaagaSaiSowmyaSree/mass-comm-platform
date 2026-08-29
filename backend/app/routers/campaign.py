import uuid
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.models.campaign import (
    Campaign,
    CampaignType,
    CampaignStatus,
)

from app.models.user import (
    User,
    Role,
)

from app.core.deps import get_current_user
from app.core.rbac import require_role

from app.schemas.campaign import CampaignCreate

from app.schemas.campaign_transition import (
    CampaignTransitionRequest,
)


router = APIRouter(
    prefix="/campaigns",
    tags=["campaigns"],
)


# ============================================================
# SUPPORTED CHANNELS
# ============================================================

SUPPORTED_CHANNELS = {
    "email",
    "sms",
    "whatsapp",
    "push",
    "web",
}


# ============================================================
# VALIDATE CHANNELS
# ============================================================

def validate_channels(
    channels: list[str],
) -> list[str]:

    if not channels:
        raise HTTPException(
            status_code=422,
            detail="At least one channel is required",
        )

    cleaned = [
        channel.lower().strip()
        for channel in channels
        if channel and channel.strip()
    ]

    if not cleaned:
        raise HTTPException(
            status_code=422,
            detail="At least one channel is required",
        )

    invalid = [
        channel
        for channel in cleaned
        if channel not in SUPPORTED_CHANNELS
    ]

    if invalid:
        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid channel(s): "
                + ", ".join(invalid)
                + ". Allowed channels: "
                + ", ".join(
                    sorted(SUPPORTED_CHANNELS)
                )
            ),
        )

    # Remove duplicates while preserving order.
    return list(dict.fromkeys(cleaned))


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
            Role.CAMPAIGN_MANAGER,
        )
    ),
):

    try:
        campaign_type = CampaignType(
            data.type.lower().strip()
        )

    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid campaign type. "
                "Allowed values: awareness, emergency, "
                "educational, announcement."
            ),
        )

    channels = validate_channels(
        data.channels
    )

    scheduled_at = data.scheduled_at

    if (
        scheduled_at is not None
        and scheduled_at.tzinfo is not None
    ):
        scheduled_at = scheduled_at.replace(
            tzinfo=None
        )

    campaign = Campaign(
        title=data.title.strip(),
        content=data.content.strip(),
        type=campaign_type,
        status=CampaignStatus.DRAFT,
        created_by=current_user.id,
        target_filters=data.target_filters or {},
        template_id=data.template_id,
        scheduled_at=scheduled_at,
        channels=channels,
    )

    db.add(campaign)

    try:
        await db.commit()
        await db.refresh(campaign)

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to create campaign: {str(exc)}"
            ),
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

    # ========================================================
    # OWNERSHIP
    # ========================================================

    if current_user.role != Role.ADMIN:
        stmt = stmt.where(
            Campaign.created_by == current_user.id
        )

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
        campaign_id,
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # ========================================================
    # OWNERSHIP
    # ========================================================

    if (
        current_user.role != Role.ADMIN
        and campaign.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this campaign",
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
            Role.CAMPAIGN_MANAGER,
        )
    ),
):

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # ========================================================
    # OWNERSHIP
    # ========================================================

    if (
        current_user.role != Role.ADMIN
        and campaign.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this campaign",
        )

    if campaign.status not in {
        CampaignStatus.DRAFT,
        CampaignStatus.READY,
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only draft or ready campaigns "
                "can be edited"
            ),
        )

    try:
        campaign_type = CampaignType(
            data.type.lower().strip()
        )

    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid campaign type. "
                "Allowed values: awareness, emergency, "
                "educational, announcement."
            ),
        )

    channels = validate_channels(
        data.channels
    )

    scheduled_at = data.scheduled_at

    if (
        scheduled_at is not None
        and scheduled_at.tzinfo is not None
    ):
        scheduled_at = scheduled_at.replace(
            tzinfo=None
        )

    campaign.title = data.title.strip()

    campaign.content = data.content.strip()

    campaign.type = campaign_type

    campaign.target_filters = (
        data.target_filters or {}
    )

    campaign.template_id = data.template_id

    campaign.scheduled_at = scheduled_at

    campaign.channels = channels

    try:
        await db.commit()
        await db.refresh(campaign)

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to update campaign: {str(exc)}"
            ),
        )

    return campaign


# ============================================================
# SET CAMPAIGN SCHEDULE
# ============================================================

@router.put("/{campaign_id}/schedule")
async def schedule_campaign(
    campaign_id: uuid.UUID,
    scheduled_at: datetime,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER,
        )
    ),
):

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    if (
        current_user.role != Role.ADMIN
        and campaign.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this campaign",
        )

    if campaign.status != CampaignStatus.READY:
        raise HTTPException(
            status_code=400,
            detail="Only ready campaigns can be scheduled",
        )

    if scheduled_at.tzinfo is not None:
        scheduled_at = scheduled_at.replace(
            tzinfo=None
        )

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
            Role.CAMPAIGN_MANAGER,
        )
    ),
):

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # ========================================================
    # OWNERSHIP
    # ========================================================

    if (
        current_user.role != Role.ADMIN
        and campaign.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this campaign",
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

    # ========================================================
    # SCHEDULED VALIDATION
    # ========================================================

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

    # ========================================================
    # CHANNEL VALIDATION
    # ========================================================

    if data.new_status in {
        CampaignStatus.READY,
        CampaignStatus.SCHEDULED,
        CampaignStatus.SENDING,
    }:
        channels = validate_channels(
            campaign.channels or []
        )

        campaign.channels = channels

    # ========================================================
    # UPDATE STATUS
    # ========================================================

    campaign.status = data.new_status

    if data.new_status == CampaignStatus.SENDING:
        campaign.started_at = datetime.utcnow()

    if data.new_status in {
        CampaignStatus.COMPLETED,
        CampaignStatus.FAILED,
    }:
        campaign.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(campaign)

    return campaign
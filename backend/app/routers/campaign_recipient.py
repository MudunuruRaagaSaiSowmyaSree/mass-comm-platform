import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db

from app.models.user import User
from app.models.campaign import Campaign
from app.models.audience import AudienceMember
from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.schemas.campaign_recipient import CampaignRecipientOut

from app.core.deps import get_current_user


router = APIRouter(
    prefix="/campaigns",
    tags=["campaign recipients"],
)


@router.post(
    "/{campaign_id}/recipients/{audience_member_id}",
    response_model=CampaignRecipientOut,
)
async def add_recipient(
    campaign_id: uuid.UUID,
    audience_member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check campaign
    campaign = await db.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # Check audience member
    audience_member = await db.get(
        AudienceMember,
        audience_member_id,
    )

    if not audience_member:
        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    # Check if already added
    result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.audience_member_id
            == audience_member_id,
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Audience member is already a recipient",
        )

    recipient = CampaignRecipient(
        campaign_id=campaign_id,
        audience_member_id=audience_member_id,
        status=RecipientStatus.PENDING,
    )

    db.add(recipient)

    await db.commit()
    await db.refresh(recipient)

    return recipient


@router.get(
    "/{campaign_id}/recipients",
    response_model=list[CampaignRecipientOut],
)
async def list_recipients(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = await db.get(Campaign, campaign_id)

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.campaign_id == campaign_id
        )
    )

    return result.scalars().all()
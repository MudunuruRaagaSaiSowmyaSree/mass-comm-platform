from datetime import datetime
from uuid import UUID

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
)

from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.models.message_delivery import (
    MessageDelivery,
)

from app.services.campaign_delivery import (
    deliver_campaign,
)


router = APIRouter(
    prefix="/campaign-delivery",
    tags=["Campaign Delivery"],
)


# ============================================================
# SEND CAMPAIGN MANUALLY
# ============================================================

@router.post("/{campaign_id}/send")
async def send_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    try:

        result = await deliver_campaign(
            campaign_id=campaign_id,
            db=db,
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Campaign delivery failed: "
                f"{exc}"
            ),
        )


# ============================================================
# DELIVERY STATUS
# ============================================================

@router.get("/{campaign_id}/status")
async def get_campaign_delivery_status(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    campaign_result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id
        )
    )

    campaign = (
        campaign_result.scalar_one_or_none()
    )

    if campaign is None:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    recipient_result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    recipients = list(
        recipient_result.scalars().all()
    )

    recipient_ids = [
        item.id
        for item in recipients
    ]

    deliveries = []

    if recipient_ids:

        delivery_result = await db.execute(
            select(MessageDelivery).where(
                MessageDelivery.recipient_id.in_(
                    recipient_ids
                )
            )
        )

        deliveries = list(
            delivery_result.scalars().all()
        )

    pending = 0
    sent = 0
    delivered = 0
    failed = 0

    for delivery in deliveries:

        if delivery.status == (
            RecipientStatus.PENDING
        ):

            pending += 1

        elif delivery.status == (
            RecipientStatus.SENT
        ):

            sent += 1

        elif delivery.status == (
            RecipientStatus.DELIVERED
        ):

            delivered += 1

        elif delivery.status == (
            RecipientStatus.FAILED
        ):

            failed += 1

    return {
        "campaign_id": str(
            campaign.id
        ),
        "campaign_status": (
            campaign.status.value
        ),
        "total_recipients": len(
            recipients
        ),
        "total_deliveries": len(
            deliveries
        ),
        "pending": pending,
        "sent": sent,
        "delivered": delivered,
        "failed": failed,
        "started_at": (
            campaign.started_at
        ),
        "completed_at": (
            campaign.completed_at
        ),
    }
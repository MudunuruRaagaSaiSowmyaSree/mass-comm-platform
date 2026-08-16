from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.campaign import Campaign, CampaignStatus
from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)
from app.models.message_delivery import MessageDelivery


router = APIRouter(
    prefix="/reports",
    tags=["reports"],
)


# ============================================================
# OVERALL REPORT
# ============================================================

@router.get("/summary")
async def report_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # CAMPAIGNS
    # --------------------------------------------------------

    total_campaigns_result = await db.execute(
        select(func.count(Campaign.id))
    )

    total_campaigns = (
        total_campaigns_result.scalar_one() or 0
    )

    completed_campaigns_result = await db.execute(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.COMPLETED
        )
    )

    completed_campaigns = (
        completed_campaigns_result.scalar_one() or 0
    )

    scheduled_campaigns_result = await db.execute(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.SCHEDULED
        )
    )

    scheduled_campaigns = (
        scheduled_campaigns_result.scalar_one() or 0
    )

    sending_campaigns_result = await db.execute(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.SENDING
        )
    )

    sending_campaigns = (
        sending_campaigns_result.scalar_one() or 0
    )

    failed_campaigns_result = await db.execute(
        select(func.count(Campaign.id)).where(
            Campaign.status == CampaignStatus.FAILED
        )
    )

    failed_campaigns = (
        failed_campaigns_result.scalar_one() or 0
    )

    # --------------------------------------------------------
    # RECIPIENTS
    # --------------------------------------------------------

    total_recipients_result = await db.execute(
        select(func.count(CampaignRecipient.id))
    )

    total_recipients = (
        total_recipients_result.scalar_one() or 0
    )

    pending_recipients_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.status == RecipientStatus.PENDING
        )
    )

    pending_recipients = (
        pending_recipients_result.scalar_one() or 0
    )

    sent_recipients_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.status == RecipientStatus.SENT
        )
    )

    sent_recipients = (
        sent_recipients_result.scalar_one() or 0
    )

    delivered_recipients_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.status
            == RecipientStatus.DELIVERED
        )
    )

    delivered_recipients = (
        delivered_recipients_result.scalar_one() or 0
    )

    failed_recipients_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.status == RecipientStatus.FAILED
        )
    )

    failed_recipients = (
        failed_recipients_result.scalar_one() or 0
    )

    # --------------------------------------------------------
    # MESSAGE DELIVERIES
    # --------------------------------------------------------

    total_messages_result = await db.execute(
        select(func.count(MessageDelivery.id))
    )

    total_messages = (
        total_messages_result.scalar_one() or 0
    )

    delivered_messages_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status
            == RecipientStatus.DELIVERED
        )
    )

    delivered_messages = (
        delivered_messages_result.scalar_one() or 0
    )

    failed_messages_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status
            == RecipientStatus.FAILED
        )
    )

    failed_messages = (
        failed_messages_result.scalar_one() or 0
    )

    pending_messages_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status.in_(
                [
                    RecipientStatus.PENDING,
                    RecipientStatus.SENT,
                ]
            )
        )
    )

    pending_messages = (
        pending_messages_result.scalar_one() or 0
    )

    # --------------------------------------------------------
    # DELIVERY RATE
    # --------------------------------------------------------

    if total_messages > 0:
        delivery_rate = round(
            (delivered_messages / total_messages) * 100,
            2,
        )
    else:
        delivery_rate = 0.0

    # --------------------------------------------------------
    # FAILURE RATE
    # --------------------------------------------------------

    if total_messages > 0:
        failure_rate = round(
            (failed_messages / total_messages) * 100,
            2,
        )
    else:
        failure_rate = 0.0

    # --------------------------------------------------------
    # RETURN REPORT
    # --------------------------------------------------------

    return {
        "campaigns": {
            "total": total_campaigns,
            "completed": completed_campaigns,
            "scheduled": scheduled_campaigns,
            "sending": sending_campaigns,
            "failed": failed_campaigns,
        },

        "recipients": {
            "total": total_recipients,
            "pending": pending_recipients,
            "sent": sent_recipients,
            "delivered": delivered_recipients,
            "failed": failed_recipients,
        },

        "messages": {
            "total": total_messages,
            "delivered": delivered_messages,
            "pending": pending_messages,
            "failed": failed_messages,
        },

        "delivery_rate": delivery_rate,
        "failure_rate": failure_rate,
    }
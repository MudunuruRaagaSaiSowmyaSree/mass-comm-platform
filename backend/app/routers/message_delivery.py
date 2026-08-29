import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.models.user import User
from app.models.campaign import Campaign
from app.models.audience import AudienceMember
from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)
from app.models.message_delivery import MessageDelivery

from app.schemas.message_delivery import MessageDeliveryOut

from app.core.deps import get_current_user
from app.services.email import send_email


router = APIRouter(
    prefix="/message-delivery",
    tags=["message deliveries"],
)


# ============================================================
# DELIVERY SUMMARY
# GET /message-delivery/summary
# ============================================================

@router.get("/summary")
async def delivery_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_result = await db.execute(
        select(func.count(MessageDelivery.id))
    )

    total = total_result.scalar_one() or 0

    delivered_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status == RecipientStatus.DELIVERED
        )
    )

    delivered = delivered_result.scalar_one() or 0

    failed_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status == RecipientStatus.FAILED
        )
    )

    failed = failed_result.scalar_one() or 0

    pending_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status.in_(
                [
                    RecipientStatus.PENDING,
                    RecipientStatus.SENT,
                ]
            )
        )
    )

    pending = pending_result.scalar_one() or 0

    return {
        "total": total,
        "delivered": delivered,
        "pending": pending,
        "failed": failed,
    }


# ============================================================
# LIST ALL DELIVERY RECORDS
#
# GET /message-delivery/all?page=1&page_size=20
#
# IMPORTANT:
# Keep this before /{recipient_id}
# ============================================================

@router.get("/all")
async def list_all_deliveries(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Validate pagination
    # --------------------------------------------------------

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="page must be greater than or equal to 1",
        )

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=400,
            detail="page_size must be between 1 and 100",
        )

    # --------------------------------------------------------
    # Count total records
    # --------------------------------------------------------

    total_result = await db.execute(
        select(func.count(MessageDelivery.id))
    )

    total = total_result.scalar_one() or 0

    # --------------------------------------------------------
    # Calculate offset
    # --------------------------------------------------------

    offset = (page - 1) * page_size

    # --------------------------------------------------------
    # Get records
    # --------------------------------------------------------

    result = await db.execute(
        select(MessageDelivery)
        .order_by(
            MessageDelivery.sent_at.desc()
        )
        .offset(offset)
        .limit(page_size)
    )

    records = result.scalars().all()

    # --------------------------------------------------------
    # Return paginated response
    # --------------------------------------------------------

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": records,
    }


# ============================================================
# CAMPAIGN DELIVERY SUMMARY
#
# GET /message-delivery/campaign/{campaign_id}/summary
#
# IMPORTANT:
# Keep this before /{recipient_id}
# ============================================================

@router.get(
    "/campaign/{campaign_id}/summary"
)
async def campaign_delivery_summary(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Check campaign exists
    # --------------------------------------------------------

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # --------------------------------------------------------
    # Total recipients
    # --------------------------------------------------------

    total_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.campaign_id == campaign_id
        )
    )

    total = total_result.scalar_one() or 0

    # --------------------------------------------------------
    # Sent recipients
    # --------------------------------------------------------

    sent_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status == RecipientStatus.SENT,
        )
    )

    sent = sent_result.scalar_one() or 0

    # --------------------------------------------------------
    # Delivered recipients
    # --------------------------------------------------------

    delivered_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status == RecipientStatus.DELIVERED,
        )
    )

    delivered = delivered_result.scalar_one() or 0

    # --------------------------------------------------------
    # Pending recipients
    # --------------------------------------------------------

    pending_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status == RecipientStatus.PENDING,
        )
    )

    pending = pending_result.scalar_one() or 0

    # --------------------------------------------------------
    # Failed recipients
    # --------------------------------------------------------

    failed_result = await db.execute(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.campaign_id == campaign_id,
            CampaignRecipient.status == RecipientStatus.FAILED,
        )
    )

    failed = failed_result.scalar_one() or 0

    # --------------------------------------------------------
    # Return campaign delivery summary
    # --------------------------------------------------------

    return {
        "campaign_id": str(campaign_id),
        "campaign_title": campaign.title,
        "total": total,
        "sent": sent,
        "delivered": delivered,
        "pending": pending,
        "failed": failed,
    }


# ============================================================
# LIST ALL DELIVERIES FOR A CAMPAIGN
#
# GET /message-delivery/campaign/{campaign_id}
#
# Example:
# /message-delivery/campaign/
# 9454eb0a-35b0-46d3-8de6-3ce15b42dfc8
# ?page=1&page_size=20
# ============================================================

@router.get(
    "/campaign/{campaign_id}"
)
async def list_campaign_deliveries(
    campaign_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Validate pagination
    # --------------------------------------------------------

    if page < 1:
        raise HTTPException(
            status_code=400,
            detail="page must be greater than or equal to 1",
        )

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=400,
            detail="page_size must be between 1 and 100",
        )

    # --------------------------------------------------------
    # Check campaign exists
    # --------------------------------------------------------

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # --------------------------------------------------------
    # Count campaign delivery records
    # --------------------------------------------------------

    total_result = await db.execute(
        select(func.count(MessageDelivery.id))
        .join(
            CampaignRecipient,
            MessageDelivery.recipient_id
            == CampaignRecipient.id,
        )
        .where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    total = total_result.scalar_one() or 0

    # --------------------------------------------------------
    # Calculate offset
    # --------------------------------------------------------

    offset = (page - 1) * page_size

    # --------------------------------------------------------
    # Get campaign delivery records
    # --------------------------------------------------------

    result = await db.execute(
        select(MessageDelivery)
        .join(
            CampaignRecipient,
            MessageDelivery.recipient_id
            == CampaignRecipient.id,
        )
        .where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
        .order_by(
            MessageDelivery.sent_at.desc()
        )
        .offset(offset)
        .limit(page_size)
    )

    records = result.scalars().all()

    # --------------------------------------------------------
    # Return paginated response
    # --------------------------------------------------------

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "records": records,
    }


# ============================================================
# SEND MESSAGE
# ============================================================

@router.post(
    "/{recipient_id}/send",
    response_model=MessageDeliveryOut,
)
async def send_message(
    recipient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # Get campaign recipient
    # --------------------------------------------------------

    recipient = await db.get(
        CampaignRecipient,
        recipient_id,
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Campaign recipient not found",
        )

    # --------------------------------------------------------
    # Check recipient status
    # --------------------------------------------------------

    if recipient.status != RecipientStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Recipient is not pending",
        )

    # --------------------------------------------------------
    # Get audience member
    # --------------------------------------------------------

    audience_member = await db.get(
        AudienceMember,
        recipient.audience_member_id,
    )

    if not audience_member:
        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    # --------------------------------------------------------
    # Get campaign
    # --------------------------------------------------------

    campaign = await db.get(
        Campaign,
        recipient.campaign_id,
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    # --------------------------------------------------------
    # Check email address
    # --------------------------------------------------------

    if not audience_member.email:
        raise HTTPException(
            status_code=400,
            detail=(
                "Audience member does not have "
                "an email address"
            ),
        )

    # --------------------------------------------------------
    # Send real email
    # --------------------------------------------------------

    now = datetime.utcnow()

    try:
        await send_email(
            to_email=audience_member.email,
            subject=campaign.title,
            body=campaign.content,
        )

        # ----------------------------------------------------
        # Create successful delivery record
        # ----------------------------------------------------

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.SENT,
            provider_message_id=f"smtp-{uuid.uuid4()}",
            sent_at=now,
        )

        recipient.status = RecipientStatus.SENT
        recipient.contacted_at = now

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        return delivery

    except Exception as exc:
        # ----------------------------------------------------
        # Create failed delivery record
        # ----------------------------------------------------

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.FAILED,
            provider_message_id=None,
            sent_at=now,
            error_message=str(exc),
        )

        recipient.status = RecipientStatus.FAILED

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        return delivery


# ============================================================
# MARK MESSAGE AS DELIVERED
# ============================================================

@router.post(
    "/{recipient_id}/deliver",
    response_model=MessageDeliveryOut,
)
async def mark_delivered(
    recipient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipient = await db.get(
        CampaignRecipient,
        recipient_id,
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Campaign recipient not found",
        )

    if recipient.status != RecipientStatus.SENT:
        raise HTTPException(
            status_code=400,
            detail="Recipient must be in sent status",
        )

    result = await db.execute(
        select(MessageDelivery)
        .where(
            MessageDelivery.recipient_id == recipient_id
        )
        .order_by(
            MessageDelivery.sent_at.desc()
        )
    )

    delivery = result.scalars().first()

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Message delivery not found",
        )

    delivery.status = RecipientStatus.DELIVERED
    recipient.status = RecipientStatus.DELIVERED

    await db.commit()
    await db.refresh(delivery)

    return delivery


# ============================================================
# MARK MESSAGE AS FAILED
# ============================================================

@router.post(
    "/{recipient_id}/fail",
    response_model=MessageDeliveryOut,
)
async def mark_failed(
    recipient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipient = await db.get(
        CampaignRecipient,
        recipient_id,
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Campaign recipient not found",
        )

    if recipient.status != RecipientStatus.SENT:
        raise HTTPException(
            status_code=400,
            detail="Recipient must be in sent status",
        )

    result = await db.execute(
        select(MessageDelivery)
        .where(
            MessageDelivery.recipient_id == recipient_id
        )
        .order_by(
            MessageDelivery.sent_at.desc()
        )
    )

    delivery = result.scalars().first()

    if not delivery:
        raise HTTPException(
            status_code=404,
            detail="Message delivery not found",
        )

    delivery.status = RecipientStatus.FAILED
    delivery.error_message = "Message delivery failed"

    recipient.status = RecipientStatus.FAILED

    await db.commit()
    await db.refresh(delivery)

    return delivery


# ============================================================
# LIST DELIVERIES FOR A RECIPIENT
#
# GET /message-delivery/{recipient_id}
# ============================================================

@router.get(
    "/{recipient_id}",
    response_model=list[MessageDeliveryOut],
)
async def list_deliveries(
    recipient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(MessageDelivery)
        .where(
            MessageDelivery.recipient_id == recipient_id
        )
        .order_by(
            MessageDelivery.sent_at.desc()
        )
    )

    return result.scalars().all()
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)
from app.models.message_delivery import MessageDelivery
from app.schemas.message_delivery import MessageDeliveryOut
from app.core.deps import get_current_user


router = APIRouter(
    prefix="/message-delivery",
    tags=["message deliveries"],
)


# ============================================================
# DELIVERY SUMMARY
# IMPORTANT: Keep this BEFORE /{recipient_id}
# ============================================================

@router.get("/summary")
async def delivery_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Total messages
    total_result = await db.execute(
        select(func.count(MessageDelivery.id))
    )

    total = total_result.scalar_one() or 0

    # Delivered messages
    delivered_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status == RecipientStatus.DELIVERED
        )
    )

    delivered = delivered_result.scalar_one() or 0

    # Failed messages
    failed_result = await db.execute(
        select(func.count(MessageDelivery.id)).where(
            MessageDelivery.status == RecipientStatus.FAILED
        )
    )

    failed = failed_result.scalar_one() or 0

    # Pending messages
    #
    # SENT means the message has been sent but is not
    # confirmed as delivered yet.
    #
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
    recipient = await db.get(
        CampaignRecipient,
        recipient_id,
    )

    if not recipient:
        raise HTTPException(
            status_code=404,
            detail="Campaign recipient not found",
        )

    if recipient.status != RecipientStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Recipient is not pending",
        )

    now = datetime.utcnow()

    delivery = MessageDelivery(
        recipient_id=recipient.id,
        channel="sms",
        status=RecipientStatus.SENT,
        provider_message_id=f"demo-{uuid.uuid4()}",
        sent_at=now,
    )

    recipient.status = RecipientStatus.SENT
    recipient.contacted_at = now

    db.add(delivery)

    await db.commit()
    await db.refresh(delivery)

    return delivery


# ============================================================
# LIST DELIVERIES FOR A RECIPIENT
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
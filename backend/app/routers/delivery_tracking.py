from datetime import datetime
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
)
from fastapi.responses import Response, RedirectResponse

from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.models.campaign import Campaign

from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.models.audience import (
    AudienceMember,
)

from app.models.message_delivery import (
    MessageDelivery,
)

from app.models.channel_config import (
    ChannelConfig,
)

from app.models.engagement_event import (
    EngagementEvent,
    EngagementType,
)

from app.schemas.engagement import (
    EngagementEventCreate,
    DeliveryStatusUpdate,
)

from app.services.delivery_tracking import (
    update_delivery_status,
    record_engagement_event,
    can_retry_delivery,
    prepare_delivery_retry,
)

from app.services.channel_dispatcher import (
    send_channel_message,
)


router = APIRouter(
    prefix="/delivery-tracking",
    tags=["Delivery Tracking"],
)


# ============================================================
# LOAD DELIVERY
# ============================================================

async def load_delivery(
    delivery_id: UUID,
    db: AsyncSession,
) -> MessageDelivery:

    result = await db.execute(
        select(MessageDelivery).where(
            MessageDelivery.id == delivery_id
        )
    )

    delivery = result.scalar_one_or_none()

    if delivery is None:

        raise HTTPException(
            status_code=404,
            detail="Message delivery not found.",
        )

    return delivery


# ============================================================
# LOAD CAMPAIGN RECIPIENT
# ============================================================

async def load_campaign_recipient(
    delivery: MessageDelivery,
    db: AsyncSession,
) -> CampaignRecipient:

    result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.id
            == delivery.recipient_id
        )
    )

    recipient = result.scalar_one_or_none()

    if recipient is None:

        raise HTTPException(
            status_code=404,
            detail="Campaign recipient not found.",
        )

    return recipient


# ============================================================
# LOAD AUDIENCE MEMBER
# ============================================================

async def load_audience_member(
    recipient: CampaignRecipient,
    db: AsyncSession,
) -> AudienceMember:

    result = await db.execute(
        select(AudienceMember).where(
            AudienceMember.id
            == recipient.audience_member_id
        )
    )

    audience_member = (
        result.scalar_one_or_none()
    )

    if audience_member is None:

        raise HTTPException(
            status_code=404,
            detail="Audience member not found.",
        )

    return audience_member


# ============================================================
# LOAD CAMPAIGN
# ============================================================

async def load_campaign(
    campaign_id: UUID,
    db: AsyncSession,
) -> Campaign:

    result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id
        )
    )

    campaign = result.scalar_one_or_none()

    if campaign is None:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    return campaign


# ============================================================
# UPDATE DELIVERY STATUS
# ============================================================

@router.post(
    "/{delivery_id}/status"
)
async def change_delivery_status(
    delivery_id: UUID,
    payload: DeliveryStatusUpdate,
    db: AsyncSession = Depends(get_db),
):

    delivery = await load_delivery(
        delivery_id,
        db,
    )

    status_value = (
        payload.status
        .strip()
        .lower()
    )

    valid_statuses = {
        "pending": RecipientStatus.PENDING,
        "sent": RecipientStatus.SENT,
        "delivered": RecipientStatus.DELIVERED,
        "failed": RecipientStatus.FAILED,
    }

    if status_value not in valid_statuses:

        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid delivery status.",
                "allowed_statuses": list(
                    valid_statuses.keys()
                ),
            },
        )

    status = valid_statuses[
        status_value
    ]

    await update_delivery_status(
        db=db,
        delivery=delivery,
        status=status,
        error_message=payload.error_message,
    )

    await db.commit()

    await db.refresh(
        delivery
    )

    return {
        "success": True,
        "delivery_id": str(
            delivery.id
        ),
        "channel": delivery.channel,
        "status": delivery.status.value,
        "sent_at": delivery.sent_at,
        "delivered_at": delivery.delivered_at,
        "failed_at": delivery.failed_at,
        "retry_count": delivery.retry_count,
        "error_message": delivery.error_message,
    }


# ============================================================
# RECORD ENGAGEMENT
# ============================================================

@router.post(
    "/{delivery_id}/engagement"
)
async def create_engagement_event(
    delivery_id: UUID,
    payload: EngagementEventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):

    delivery = await load_delivery(
        delivery_id,
        db,
    )

    campaign_recipient = (
        await load_campaign_recipient(
            delivery,
            db,
        )
    )

    event = await record_engagement_event(
        db=db,
        delivery=delivery,
        campaign_id=campaign_recipient.campaign_id,
        audience_member_id=(
            campaign_recipient.audience_member_id
        ),
        event_type=payload.event_type,
        metadata=payload.metadata,
        ip_address=(
            request.client.host
            if request.client
            else None
        ),
        user_agent=request.headers.get(
            "user-agent"
        ),
    )

    await db.commit()

    await db.refresh(
        event
    )

    return {
        "success": True,
        "event_id": str(
            event.id
        ),
        "delivery_id": str(
            delivery.id
        ),
        "event_type": (
            event.event_type.value
        ),
        "event_at": event.event_at,
    }


# ============================================================
# OPEN TRACKING PIXEL
# ============================================================

@router.get(
    "/{delivery_id}/open"
)
async def track_open(
    delivery_id: UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):

    delivery = await load_delivery(
        delivery_id,
        db,
    )

    campaign_recipient = (
        await load_campaign_recipient(
            delivery,
            db,
        )
    )

    await record_engagement_event(
        db=db,
        delivery=delivery,
        campaign_id=campaign_recipient.campaign_id,
        audience_member_id=(
            campaign_recipient.audience_member_id
        ),
        event_type=EngagementType.OPEN,
        metadata={
            "tracking": "email_open",
        },
        ip_address=(
            request.client.host
            if request.client
            else None
        ),
        user_agent=request.headers.get(
            "user-agent"
        ),
    )

    await db.commit()

    # 1x1 transparent GIF
    pixel = bytes(
        [
            71, 73, 70, 56, 57, 97,
            1, 0, 1, 0, 128, 0, 0,
            0, 0, 0, 255, 255, 255,
            33, 249, 4, 1, 0, 0, 0, 0,
            44, 0, 0, 0, 0, 1, 0,
            1, 0, 0, 2, 2, 68, 1,
            0, 59,
        ]
    )

    return Response(
        content=pixel,
        media_type="image/gif",
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    )


# ============================================================
# CLICK TRACKING
# ============================================================

@router.get(
    "/{delivery_id}/click"
)
async def track_click(
    delivery_id: UUID,
    url: str = Query(
        ...,
        description="Destination URL",
    ),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
):

    if not (
        url.startswith("http://")
        or url.startswith("https://")
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only HTTP and HTTPS "
                "destination URLs are allowed."
            ),
        )

    delivery = await load_delivery(
        delivery_id,
        db,
    )

    campaign_recipient = (
        await load_campaign_recipient(
            delivery,
            db,
        )
    )

    await record_engagement_event(
        db=db,
        delivery=delivery,
        campaign_id=campaign_recipient.campaign_id,
        audience_member_id=(
            campaign_recipient.audience_member_id
        ),
        event_type=EngagementType.CLICK,
        metadata={
            "destination_url": url,
        },
        ip_address=(
            request.client.host
            if request and request.client
            else None
        ),
        user_agent=(
            request.headers.get("user-agent")
            if request
            else None
        ),
    )

    await db.commit()

    return RedirectResponse(
        url=url,
        status_code=307,
    )


# ============================================================
# RETRY FAILED DELIVERY
# ============================================================

@router.post(
    "/{delivery_id}/retry"
)
async def retry_delivery(
    delivery_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    delivery = await load_delivery(
        delivery_id,
        db,
    )

    if not can_retry_delivery(
        delivery
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "This delivery cannot be retried. "
                "It must be failed and have "
                "retry attempts remaining."
            ),
        )

    campaign_recipient = (
        await load_campaign_recipient(
            delivery,
            db,
        )
    )

    audience_member = (
        await load_audience_member(
            campaign_recipient,
            db,
        )
    )

    campaign = await load_campaign(
        campaign_recipient.campaign_id,
        db,
    )

    if not campaign.content:

        raise HTTPException(
            status_code=400,
            detail=(
                "Campaign has no content "
                "to retry."
            ),
        )

    # ========================================================
    # FIND RECIPIENT VALUE
    # ========================================================

    if delivery.channel == "email":

        recipient_value = (
            audience_member.email
        )

    elif delivery.channel in {
        "sms",
        "whatsapp",
    }:

        recipient_value = (
            audience_member.phone
        )

    else:

        recipient_value = str(
            audience_member.id
        )

    if not recipient_value:

        raise HTTPException(
            status_code=400,
            detail=(
                "Recipient does not have "
                "a valid destination for "
                f"channel '{delivery.channel}'."
            ),
        )

    # ========================================================
    # LOAD CHANNEL CONFIG
    # ========================================================

    config_result = await db.execute(
        select(ChannelConfig).where(
            ChannelConfig.channel
            == delivery.channel,
            ChannelConfig.enabled == True,
        )
    )

    channel_config = (
        config_result.scalar_one_or_none()
    )

    config = (
        channel_config.config
        if channel_config
        else {}
    )

    # ========================================================
    # PREPARE RETRY
    # ========================================================

    prepare_delivery_retry(
        delivery
    )

    delivery.status = (
        RecipientStatus.PENDING
    )

    await db.flush()

    # ========================================================
    # SEND AGAIN
    # ========================================================

    result = await send_channel_message(
        channel=delivery.channel,
        recipient=recipient_value,
        message=campaign.content,
        config=config,
    )

    now = datetime.utcnow()

    if result.success:

        delivery.status = (
            RecipientStatus.SENT
        )

        delivery.sent_at = now

        delivery.failed_at = None

        delivery.error_message = None

        delivery.provider_message_id = (
            result.message_id
        )

        delivery.provider = (
            result.provider
        )

    else:

        delivery.status = (
            RecipientStatus.FAILED
        )

        delivery.failed_at = now

        delivery.error_message = (
            result.error
        )

    delivery.last_attempt_at = now

    await db.commit()

    await db.refresh(
        delivery
    )

    return {
        "success": result.success,
        "delivery_id": str(
            delivery.id
        ),
        "channel": delivery.channel,
        "status": delivery.status.value,
        "retry_count": delivery.retry_count,
        "max_retries": delivery.max_retries,
        "message_id": result.message_id,
        "error": result.error,
    }


# ============================================================
# CAMPAIGN DASHBOARD
# ============================================================

@router.get(
    "/campaign/{campaign_id}/dashboard"
)
async def campaign_dashboard(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    await load_campaign(
        campaign_id,
        db,
    )

    # ========================================================
    # LOAD RECIPIENTS
    # ========================================================

    recipient_result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    recipients = (
        recipient_result.scalars().all()
    )

    recipient_ids = [
        item.id
        for item in recipients
    ]

    # ========================================================
    # LOAD DELIVERIES
    # ========================================================

    deliveries = []

    if recipient_ids:

        delivery_result = await db.execute(
            select(MessageDelivery).where(
                MessageDelivery.recipient_id.in_(
                    recipient_ids
                )
            )
        )

        deliveries = (
            delivery_result.scalars().all()
        )

    # ========================================================
    # LOAD ENGAGEMENT EVENTS
    # ========================================================

    engagement_result = await db.execute(
        select(EngagementEvent).where(
            EngagementEvent.campaign_id
            == campaign_id
        )
    )

    events = (
        engagement_result.scalars().all()
    )

    # ========================================================
    # DELIVERY COUNTS
    # ========================================================

    pending = 0
    sent = 0
    delivered = 0
    failed = 0
    retrying = 0

    for delivery in deliveries:

        status = delivery.status.value

        if status == "pending":
            pending += 1

        elif status == "sent":
            sent += 1

        elif status == "delivered":
            delivered += 1

        elif status == "failed":
            failed += 1

    # ========================================================
    # RETRY COUNT
    # ========================================================

    retrying = sum(
        1
        for delivery in deliveries
        if delivery.retry_count > 0
        and delivery.status.value
        == "failed"
        and delivery.retry_count
        < delivery.max_retries
    )

    # ========================================================
    # ENGAGEMENT COUNTS
    # ========================================================

    opens = sum(
        1
        for event in events
        if event.event_type
        == EngagementType.OPEN
    )

    clicks = sum(
        1
        for event in events
        if event.event_type
        == EngagementType.CLICK
    )

    responses = sum(
        1
        for event in events
        if event.event_type
        == EngagementType.RESPONSE
    )

    participation = sum(
        1
        for event in events
        if event.event_type
        == EngagementType.PARTICIPATION
    )

    # ========================================================
    # RATE CALCULATIONS
    # ========================================================

    total_deliveries = len(
        deliveries
    )

    delivered_count = delivered

    if delivered_count > 0:

        open_rate = (
            opens
            / delivered_count
            * 100
        )

        click_through_rate = (
            clicks
            / delivered_count
            * 100
        )

        response_rate = (
            responses
            / delivered_count
            * 100
        )

        participation_rate = (
            participation
            / delivered_count
            * 100
        )

    else:

        open_rate = 0.0
        click_through_rate = 0.0
        response_rate = 0.0
        participation_rate = 0.0

    return {
        "campaign_id": str(
            campaign_id
        ),

        "total_recipients": len(
            recipients
        ),

        "total_deliveries": total_deliveries,

        "delivery_status": {
            "pending": pending,
            "sent": sent,
            "delivered": delivered,
            "failed": failed,
            "retrying": retrying,
        },

        "engagement": {
            "opens": opens,
            "clicks": clicks,
            "responses": responses,
            "participation": participation,
        },

        "rates": {
            "open_rate": round(
                open_rate,
                2,
            ),
            "click_through_rate": round(
                click_through_rate,
                2,
            ),
            "response_rate": round(
                response_rate,
                2,
            ),
            "participation_rate": round(
                participation_rate,
                2,
            ),
        },
    }


# ============================================================
# CAMPAIGN DELIVERY LOGS
# ============================================================

@router.get(
    "/campaign/{campaign_id}/logs"
)
async def campaign_delivery_logs(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    await load_campaign(
        campaign_id,
        db,
    )

    recipient_result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    recipients = (
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

        deliveries = (
            delivery_result.scalars().all()
        )

    logs = []

    for delivery in deliveries:

        engagement_result = await db.execute(
            select(EngagementEvent).where(
                EngagementEvent.delivery_id
                == delivery.id
            )
            .order_by(
                EngagementEvent.event_at.asc()
            )
        )

        events = (
            engagement_result.scalars().all()
        )

        logs.append(
            {
                "delivery_id": str(
                    delivery.id
                ),
                "recipient_id": str(
                    delivery.recipient_id
                ),
                "channel": delivery.channel,
                "status": delivery.status.value,
                "provider": delivery.provider,
                "provider_message_id": (
                    delivery.provider_message_id
                ),
                "retry_count": (
                    delivery.retry_count
                ),
                "max_retries": (
                    delivery.max_retries
                ),
                "sent_at": delivery.sent_at,
                "delivered_at": (
                    delivery.delivered_at
                ),
                "failed_at": delivery.failed_at,
                "last_attempt_at": (
                    delivery.last_attempt_at
                ),
                "error_message": (
                    delivery.error_message
                ),
                "engagement_events": [
                    {
                        "id": str(
                            event.id
                        ),
                        "type": (
                            event.event_type.value
                        ),
                        "event_at": (
                            event.event_at
                        ),
                        "metadata": (
                            event.metadata
                        ),
                    }
                    for event in events
                ],
            }
        )

    return {
        "campaign_id": str(
            campaign_id
        ),
        "total_logs": len(
            logs
        ),
        "logs": logs,
    }


# ============================================================
# DELIVERY ENGAGEMENT HISTORY
# ============================================================

@router.get(
    "/{delivery_id}/engagement"
)
async def get_delivery_engagement(
    delivery_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    delivery = await load_delivery(
        delivery_id,
        db,
    )

    result = await db.execute(
        select(EngagementEvent)
        .where(
            EngagementEvent.delivery_id
            == delivery.id
        )
        .order_by(
            EngagementEvent.event_at.asc()
        )
    )

    events = (
        result.scalars().all()
    )

    return {
        "delivery_id": str(
            delivery.id
        ),
        "channel": delivery.channel,
        "events": [
            {
                "id": str(
                    event.id
                ),
                "type": (
                    event.event_type.value
                ),
                "event_at": (
                    event.event_at
                ),
                "metadata": (
                    event.metadata
                ),
            }
            for event in events
        ],
    }
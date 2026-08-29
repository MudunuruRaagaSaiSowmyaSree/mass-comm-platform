from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import Campaign
from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)
from app.models.engagement_event import (
    EngagementEvent,
    EngagementType,
)
from app.models.message_delivery import (
    MessageDelivery,
)


# ============================================================
# HELPERS
# ============================================================

def calculate_percentage(
    value: int,
    total: int,
) -> float:
    """
    Calculate percentage safely.
    """

    if total <= 0:
        return 0.0

    return round(
        (value / total) * 100,
        2,
    )


# ============================================================
# CAMPAIGN ANALYTICS
# ============================================================

async def get_campaign_analytics(
    campaign_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Return delivery and engagement analytics
    for one campaign.
    """

    # --------------------------------------------------------
    # LOAD CAMPAIGN
    # --------------------------------------------------------

    campaign_result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id
        )
    )

    campaign = (
        campaign_result.scalar_one_or_none()
    )

    if campaign is None:
        raise ValueError(
            "Campaign not found."
        )

    # --------------------------------------------------------
    # LOAD RECIPIENTS
    # --------------------------------------------------------

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
        recipient.id
        for recipient in recipients
    ]

    # --------------------------------------------------------
    # LOAD DELIVERIES
    # --------------------------------------------------------

    deliveries = []

    if recipient_ids:

        delivery_result = await db.execute(
            select(MessageDelivery)
            .where(
                MessageDelivery.recipient_id.in_(
                    recipient_ids
                )
            )
            .order_by(
                MessageDelivery.sent_at.desc(),
                MessageDelivery.id.desc(),
            )
        )

        all_deliveries = (
            delivery_result.scalars().all()
        )

        # Keep only the latest delivery attempt for each
        # recipient + channel combination.
        seen_delivery_keys = set()

        for delivery in all_deliveries:

            delivery_key = (
                delivery.recipient_id,
                delivery.channel,
            )

            if delivery_key in seen_delivery_keys:
                continue

            seen_delivery_keys.add(
                delivery_key
            )

            deliveries.append(
                delivery
            )

    # --------------------------------------------------------
    # DELIVERY COUNTERS
    # --------------------------------------------------------

    pending = 0
    sent = 0
    delivered = 0
    failed = 0

    for delivery in deliveries:

        if delivery.status == RecipientStatus.PENDING:

            pending += 1

        elif delivery.status == RecipientStatus.SENT:

            sent += 1

        elif delivery.status == RecipientStatus.DELIVERED:

            delivered += 1

        elif delivery.status == RecipientStatus.FAILED:

            failed += 1

    total_deliveries = len(
        deliveries
    )

    successful = (
        sent + delivered
    )

    delivery_rate = calculate_percentage(
        successful,
        total_deliveries,
    )

    failure_rate = calculate_percentage(
        failed,
        total_deliveries,
    )

    # ========================================================
    # ENGAGEMENT EVENTS
    # ========================================================

    engagement_result = await db.execute(
        select(EngagementEvent).where(
            EngagementEvent.campaign_id
            == campaign_id
        )
    )

    engagement_events = (
        engagement_result.scalars().all()
    )

    opens = 0
    clicks = 0
    responses = 0
    participation = 0

    for event in engagement_events:

        if event.event_type == EngagementType.OPEN:

            opens += 1

        elif event.event_type == EngagementType.CLICK:

            clicks += 1

        elif event.event_type == EngagementType.RESPONSE:

            responses += 1

        elif (
            event.event_type
            == EngagementType.PARTICIPATION
        ):

            participation += 1

    # --------------------------------------------------------
    # ENGAGEMENT RATES
    # --------------------------------------------------------

    open_rate = calculate_percentage(
        opens,
        total_deliveries,
    )

    click_through_rate = calculate_percentage(
        clicks,
        total_deliveries,
    )

    response_rate = calculate_percentage(
        responses,
        total_deliveries,
    )

    participation_rate = calculate_percentage(
        participation,
        total_deliveries,
    )

    # ========================================================
    # CHANNEL ANALYTICS
    # ========================================================

    channel_data = {}

    for delivery in deliveries:

        channel = (
            delivery.channel
            or "unknown"
        )

        if channel not in channel_data:

            channel_data[channel] = {
                "channel": channel,
                "total": 0,
                "pending": 0,
                "sent": 0,
                "delivered": 0,
                "failed": 0,
            }

        item = channel_data[channel]

        item["total"] += 1

        if delivery.status == RecipientStatus.PENDING:

            item["pending"] += 1

        elif delivery.status == RecipientStatus.SENT:

            item["sent"] += 1

        elif delivery.status == RecipientStatus.DELIVERED:

            item["delivered"] += 1

        elif delivery.status == RecipientStatus.FAILED:

            item["failed"] += 1

    channels = []

    for item in channel_data.values():

        successful_channel = (
            item["sent"]
            + item["delivered"]
        )

        item["delivery_rate"] = (
            calculate_percentage(
                successful_channel,
                item["total"],
            )
        )

        channels.append(
            item
        )

    channels.sort(
        key=lambda item: item["channel"]
    )

    # ========================================================
    # RESPONSE
    # ========================================================

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

        "total_deliveries": (
            total_deliveries
        ),

        "pending": pending,
        "sent": sent,
        "delivered": delivered,
        "failed": failed,

        "delivery_rate": delivery_rate,

        "failure_rate": failure_rate,

        "opens": opens,
        "clicks": clicks,
        "responses": responses,
        "participation": participation,

        "open_rate": open_rate,
        "click_through_rate": (
            click_through_rate
        ),
        "response_rate": response_rate,
        "participation_rate": (
            participation_rate
        ),

        "started_at": (
            campaign.started_at
        ),

        "completed_at": (
            campaign.completed_at
        ),

        "channels": channels,
    }


# ============================================================
# GLOBAL ANALYTICS
# ============================================================

async def get_global_analytics(
    db: AsyncSession,
) -> dict:
    """
    Return overall delivery and engagement analytics
    across all campaigns.
    """

    # --------------------------------------------------------
    # CAMPAIGNS
    # --------------------------------------------------------

    campaign_result = await db.execute(
        select(Campaign)
    )

    campaigns = (
        campaign_result.scalars().all()
    )

    # --------------------------------------------------------
    # RECIPIENTS
    # --------------------------------------------------------

    recipient_result = await db.execute(
        select(CampaignRecipient)
    )

    recipients = (
        recipient_result.scalars().all()
    )

    # --------------------------------------------------------
    # DELIVERIES
    # --------------------------------------------------------

    delivery_result = await db.execute(
        select(MessageDelivery)
    )

    deliveries = (
        delivery_result.scalars().all()
    )

    # --------------------------------------------------------
    # DELIVERY COUNTERS
    # --------------------------------------------------------

    pending = 0
    sent = 0
    delivered = 0
    failed = 0

    for delivery in deliveries:

        if delivery.status == RecipientStatus.PENDING:

            pending += 1

        elif delivery.status == RecipientStatus.SENT:

            sent += 1

        elif delivery.status == RecipientStatus.DELIVERED:

            delivered += 1

        elif delivery.status == RecipientStatus.FAILED:

            failed += 1

    total_deliveries = len(
        deliveries
    )

    successful = (
        sent + delivered
    )

    # ========================================================
    # GLOBAL ENGAGEMENT
    # ========================================================

    engagement_result = await db.execute(
        select(EngagementEvent)
    )

    engagement_events = (
        engagement_result.scalars().all()
    )

    opens = 0
    clicks = 0
    responses = 0
    participation = 0

    for event in engagement_events:

        if event.event_type == EngagementType.OPEN:

            opens += 1

        elif event.event_type == EngagementType.CLICK:

            clicks += 1

        elif event.event_type == EngagementType.RESPONSE:

            responses += 1

        elif (
            event.event_type
            == EngagementType.PARTICIPATION
        ):

            participation += 1

    # --------------------------------------------------------
    # GLOBAL ENGAGEMENT RATES
    # --------------------------------------------------------

    open_rate = calculate_percentage(
        opens,
        total_deliveries,
    )

    click_through_rate = calculate_percentage(
        clicks,
        total_deliveries,
    )

    response_rate = calculate_percentage(
        responses,
        total_deliveries,
    )

    participation_rate = calculate_percentage(
        participation,
        total_deliveries,
    )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "total_campaigns": len(
            campaigns
        ),

        "total_recipients": len(
            recipients
        ),

        "total_deliveries": (
            total_deliveries
        ),

        "pending": pending,
        "sent": sent,
        "delivered": delivered,
        "failed": failed,

        "delivery_rate": calculate_percentage(
            successful,
            total_deliveries,
        ),

        "failure_rate": calculate_percentage(
            failed,
            total_deliveries,
        ),

        "opens": opens,
        "clicks": clicks,
        "responses": responses,
        "participation": participation,

        "open_rate": open_rate,
        "click_through_rate": (
            click_through_rate
        ),
        "response_rate": response_rate,
        "participation_rate": (
            participation_rate
        ),
    }
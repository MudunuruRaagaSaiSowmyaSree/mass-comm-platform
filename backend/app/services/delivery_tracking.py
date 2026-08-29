from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
# UPDATE DELIVERY STATUS
# ============================================================

async def update_delivery_status(
    db: AsyncSession,
    delivery: MessageDelivery,
    status: RecipientStatus,
    error_message: str | None = None,
):
    """
    Update the status of a message delivery.

    Handles:

        pending
        sent
        delivered
        failed
        retrying

    Also updates the related CampaignRecipient status.
    """

    now = datetime.utcnow()

    # --------------------------------------------------------
    # UPDATE DELIVERY STATUS
    # --------------------------------------------------------

    delivery.status = status
    delivery.last_attempt_at = now

    # --------------------------------------------------------
    # SENT
    # --------------------------------------------------------

    if status == RecipientStatus.SENT:

        if delivery.sent_at is None:
            delivery.sent_at = now

        delivery.error_message = None

    # --------------------------------------------------------
    # DELIVERED
    # --------------------------------------------------------

    elif status == RecipientStatus.DELIVERED:

        if delivery.sent_at is None:
            delivery.sent_at = now

        if delivery.delivered_at is None:
            delivery.delivered_at = now

        delivery.error_message = None

    # --------------------------------------------------------
    # FAILED
    # --------------------------------------------------------

    elif status == RecipientStatus.FAILED:

        delivery.failed_at = now

        delivery.error_message = error_message

    # --------------------------------------------------------
    # RETRYING
    # --------------------------------------------------------

    elif status == RecipientStatus.RETRYING:

        delivery.error_message = error_message

    # --------------------------------------------------------
    # PENDING
    # --------------------------------------------------------

    elif status == RecipientStatus.PENDING:

        delivery.error_message = error_message

    # --------------------------------------------------------
    # UPDATE CAMPAIGN RECIPIENT
    # --------------------------------------------------------

    if delivery.recipient_id:

        result = await db.execute(
            select(CampaignRecipient)
            .where(
                CampaignRecipient.id
                == delivery.recipient_id
            )
            .limit(1)
        )

        campaign_recipient = (
            result.scalars().first()
        )

        if campaign_recipient:

            current_status = (
                campaign_recipient.status
            )

            should_update = True

            # ------------------------------------------------
            # Do not downgrade DELIVERED -> SENT
            # ------------------------------------------------

            if (
                current_status
                == RecipientStatus.DELIVERED
                and status
                == RecipientStatus.SENT
            ):
                should_update = False

            # ------------------------------------------------
            # Do not downgrade DELIVERED -> PENDING
            # ------------------------------------------------

            if (
                current_status
                == RecipientStatus.DELIVERED
                and status
                == RecipientStatus.PENDING
            ):
                should_update = False

            # ------------------------------------------------
            # Do not downgrade FAILED -> SENT
            # ------------------------------------------------

            if (
                current_status
                == RecipientStatus.FAILED
                and status
                == RecipientStatus.SENT
            ):
                should_update = False

            if should_update:

                campaign_recipient.status = status

                # --------------------------------------------
                # Contacted timestamp
                # --------------------------------------------

                if status in (
                    RecipientStatus.SENT,
                    RecipientStatus.DELIVERED,
                ):

                    if (
                        campaign_recipient.contacted_at
                        is None
                    ):

                        campaign_recipient.contacted_at = now

                # --------------------------------------------
                # Error
                # --------------------------------------------

                if status == RecipientStatus.FAILED:

                    campaign_recipient.error_message = (
                        error_message
                    )

                elif status != RecipientStatus.FAILED:

                    campaign_recipient.error_message = None

    # --------------------------------------------------------
    # FLUSH
    # --------------------------------------------------------

    await db.flush()

    return delivery


# ============================================================
# RECORD ENGAGEMENT
# ============================================================

async def record_engagement_event(
    db: AsyncSession,
    delivery: MessageDelivery,
    campaign_id: UUID,
    audience_member_id: UUID,
    event_type: EngagementType,
    metadata: dict | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
):
    """
    Save an engagement event.

    Supported event types:

        open
        click
        response
        participation
    """

    event = EngagementEvent(
        delivery_id=delivery.id,
        campaign_id=campaign_id,
        audience_member_id=audience_member_id,
        event_type=event_type,
        event_at=datetime.utcnow(),
        event_metadata=metadata,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    db.add(event)

    await db.flush()

    return event


# ============================================================
# RETRY ELIGIBILITY
# ============================================================

def can_retry_delivery(
    delivery: MessageDelivery,
) -> bool:
    """
    Return True when a failed delivery can be retried.
    """

    # --------------------------------------------------------
    # Must be failed
    # --------------------------------------------------------

    if delivery.status != RecipientStatus.FAILED:
        return False

    # --------------------------------------------------------
    # Check retry count
    # --------------------------------------------------------

    retry_count = (
        delivery.retry_count
        if delivery.retry_count is not None
        else 0
    )

    max_retries = (
        delivery.max_retries
        if delivery.max_retries is not None
        else 3
    )

    return retry_count < max_retries


# ============================================================
# PREPARE DELIVERY RETRY
# ============================================================

async def prepare_delivery_retry(
    db: AsyncSession,
    delivery: MessageDelivery,
):
    """
    Prepare a failed delivery for another attempt.

    Increments retry_count and changes the delivery
    status to RETRYING.
    """

    if not can_retry_delivery(
        delivery
    ):
        return None

    # --------------------------------------------------------
    # Increment retry count
    # --------------------------------------------------------

    delivery.retry_count = (
        (delivery.retry_count or 0) + 1
    )

    # --------------------------------------------------------
    # Update status
    # --------------------------------------------------------

    delivery.status = (
        RecipientStatus.RETRYING
    )

    delivery.last_attempt_at = (
        datetime.utcnow()
    )

    delivery.error_message = None

    # --------------------------------------------------------
    # Update CampaignRecipient
    # --------------------------------------------------------

    if delivery.recipient_id:

        result = await db.execute(
            select(CampaignRecipient)
            .where(
                CampaignRecipient.id
                == delivery.recipient_id
            )
            .limit(1)
        )

        campaign_recipient = (
            result.scalars().first()
        )

        if campaign_recipient:

            campaign_recipient.status = (
                RecipientStatus.RETRYING
            )

            campaign_recipient.error_message = None

    # --------------------------------------------------------
    # Flush
    # --------------------------------------------------------

    await db.flush()

    return delivery
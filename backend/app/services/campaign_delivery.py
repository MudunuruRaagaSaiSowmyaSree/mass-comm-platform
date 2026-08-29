"""
Core campaign delivery service.

This contains the actual campaign delivery logic.

It is intentionally separated from the FastAPI router so that:

    - manual campaign sending
    - scheduled campaign sending

can use exactly the same delivery implementation.

Existing channel services and WhatsApp/RAG are not modified.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import (
    Campaign,
    CampaignStatus,
)

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

from app.services.channel_dispatcher import (
    send_multi_channel_message,
)


# ============================================================
# HELPERS
# ============================================================


async def load_campaign(
    campaign_id: UUID,
    db: AsyncSession,
) -> Campaign:
    """
    Load a campaign by ID.
    """

    query_result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id
        )
    )

    campaign = query_result.scalar_one_or_none()

    if campaign is None:
        raise ValueError(
            "Campaign not found."
        )

    return campaign


async def load_channel_configs(
    db: AsyncSession,
) -> dict[str, dict]:
    """
    Load all enabled channel configurations.

    Returns:

        {
            "email": {
                "provider": "smtp",
                ...
            }
        }
    """

    query_result = await db.execute(
        select(ChannelConfig).where(
            ChannelConfig.enabled.is_(True)
        )
    )

    configs = query_result.scalars().all()

    return {
        str(item.channel).strip().lower(): (
            item.config or {}
        )
        for item in configs
    }


def get_recipient_value(
    audience_member: AudienceMember,
    channel: str,
) -> str | None:
    """
    Get the actual destination value for a channel.
    """

    if channel == "email":
        return audience_member.email

    if channel in {
        "sms",
        "whatsapp",
    }:
        return audience_member.phone

    if channel in {
        "push",
        "web_broadcast",
    }:
        return str(audience_member.id)

    return None


# ============================================================
# DELIVERY
# ============================================================


async def deliver_campaign(
    campaign_id: UUID,
    db: AsyncSession,
) -> dict:
    """
    Deliver a campaign to all campaign recipients.

    Important:

    - Uses the enabled ChannelConfig for each channel.
    - Sends through the central channel dispatcher.
    - Stores the actual provider name.
    - Stores the actual provider message ID.
    - Never stores the complete ChannelDeliveryResult
      object inside provider_message_id.
    - Prevents duplicate successful deliveries.
    - Historical FAILED deliveries do not prevent retry.
    - A FAILED campaign can be retried.
    """

    # ========================================================
    # LOAD CAMPAIGN
    # ========================================================

    campaign = await load_campaign(
        campaign_id=campaign_id,
        db=db,
    )

    # ========================================================
    # VALIDATE CAMPAIGN STATUS
    # ========================================================

    allowed_statuses = {
        CampaignStatus.READY,
        CampaignStatus.SCHEDULED,
        CampaignStatus.COMPLETED,
        CampaignStatus.FAILED,
    }

    if campaign.status not in allowed_statuses:
        raise ValueError(
            "Campaign cannot be delivered "
            f"while status is "
            f"'{campaign.status.value}'."
        )

    # ========================================================
    # VALIDATE CONTENT
    # ========================================================

    if not campaign.content:
        raise ValueError(
            "Campaign does not contain content."
        )

    # ========================================================
    # CHANNELS
    # ========================================================

    channels = campaign.channels or []

    if not channels:
        raise ValueError(
            "Campaign has no channels configured."
        )

    normalized_channels = [
        str(channel).strip().lower()
        for channel in channels
        if str(channel).strip()
    ]

    if not normalized_channels:
        raise ValueError(
            "Campaign has no valid channels configured."
        )

    # Remove duplicate channels while preserving order.
    normalized_channels = list(
        dict.fromkeys(
            normalized_channels
        )
    )

    # ========================================================
    # LOAD CHANNEL CONFIGURATIONS
    # ========================================================

    channel_configs = await load_channel_configs(
        db
    )

    missing_configs = []

    for channel in normalized_channels:

        if channel not in channel_configs:
            missing_configs.append(channel)

    if missing_configs:
        raise ValueError(
            "Channels are not enabled/configured: "
            + ", ".join(missing_configs)
        )

    # ========================================================
    # LOAD CAMPAIGN RECIPIENTS
    # ========================================================

    recipient_query_result = await db.execute(
        select(CampaignRecipient).where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    recipients = list(
        recipient_query_result.scalars().all()
    )

    if not recipients:
        raise ValueError(
            "Campaign has no recipients."
        )

    # ========================================================
    # MARK CAMPAIGN AS SENDING
    # ========================================================

    campaign.status = CampaignStatus.SENDING

    campaign.started_at = datetime.utcnow()

    campaign.completed_at = None

    await db.commit()

    # ========================================================
    # COUNTERS
    # ========================================================

    total_attempts = 0
    successful_deliveries = 0
    failed_deliveries = 0

    delivery_results = []

    # ========================================================
    # PROCESS RECIPIENTS
    # ========================================================

    for campaign_recipient in recipients:

        # ----------------------------------------------------
        # LOAD AUDIENCE MEMBER
        # ----------------------------------------------------

        audience_query_result = await db.execute(
            select(AudienceMember).where(
                AudienceMember.id
                == campaign_recipient.audience_member_id
            )
        )

        audience_member = (
            audience_query_result.scalar_one_or_none()
        )

        # ----------------------------------------------------
        # AUDIENCE MEMBER MISSING
        # ----------------------------------------------------

        if audience_member is None:

            campaign_recipient.status = (
                RecipientStatus.FAILED
            )

            campaign_recipient.error_message = (
                "Audience member not found."
            )

            failed_deliveries += len(
                normalized_channels
            )

            continue

        recipient_success = False
        recipient_failure = False

        # ====================================================
        # PROCESS EACH CHANNEL
        # ====================================================

        for channel in normalized_channels:

            # ------------------------------------------------
            # GET RECIPIENT DESTINATION
            # ------------------------------------------------

            recipient_value = get_recipient_value(
                audience_member=audience_member,
                channel=channel,
            )

            # =================================================
            # PREVENT DUPLICATE SUCCESSFUL DELIVERY
            #
            # Existing SENT/DELIVERED records mean this
            # recipient/channel has already succeeded.
            #
            # FAILED records are ignored so the campaign
            # can retry them.
            # =================================================

            existing_delivery_result = await db.execute(
                select(MessageDelivery)
                .where(
                    MessageDelivery.recipient_id
                    == campaign_recipient.id,
                    MessageDelivery.channel
                    == channel,
                    MessageDelivery.status.in_(
                        [
                            RecipientStatus.SENT,
                            RecipientStatus.DELIVERED,
                        ]
                    ),
                )
                .order_by(
                    MessageDelivery.sent_at.desc()
                )
                .limit(1)
            )

            existing_delivery = (
                existing_delivery_result.scalar_one_or_none()
            )

            # ------------------------------------------------
            # EXISTING SUCCESSFUL DELIVERY
            # ------------------------------------------------

            if existing_delivery is not None:

                successful_deliveries += 1
                recipient_success = True

                delivery_results.append(
                    {
                        "recipient_id": str(
                            campaign_recipient.id
                        ),
                        "audience_member_id": str(
                            audience_member.id
                        ),
                        "channel": channel,
                        "success": True,
                        "provider": (
                            existing_delivery.provider
                        ),
                        "message_id": (
                            existing_delivery.provider_message_id
                        ),
                        "error": None,
                        "duplicate_prevented": True,
                    }
                )

                continue

            # =================================================
            # REAL NEW DELIVERY ATTEMPT
            # =================================================

            total_attempts += 1

            # ------------------------------------------------
            # NO DESTINATION AVAILABLE
            # ------------------------------------------------

            if not recipient_value:

                error_message = (
                    "No recipient contact available "
                    f"for '{channel}'."
                )

                delivery = MessageDelivery(
                    recipient_id=campaign_recipient.id,
                    channel=channel,
                    status=RecipientStatus.FAILED,
                    provider=None,
                    provider_message_id=None,
                    sent_at=None,
                    delivered_at=None,
                    failed_at=datetime.utcnow(),
                    error_message=error_message,
                )

                db.add(delivery)

                failed_deliveries += 1
                recipient_failure = True

                delivery_results.append(
                    {
                        "recipient_id": str(
                            campaign_recipient.id
                        ),
                        "audience_member_id": str(
                            audience_member.id
                        ),
                        "channel": channel,
                        "success": False,
                        "provider": None,
                        "message_id": None,
                        "error": error_message,
                        "duplicate_prevented": False,
                    }
                )

                continue

            # ------------------------------------------------
            # CHANNEL CONFIGURATION
            # ------------------------------------------------

            channel_config = channel_configs.get(
                channel,
                {},
            )

            # ------------------------------------------------
            # CONFIGURED PROVIDER
            # ------------------------------------------------

            configured_provider = (
                channel_config.get(
                    "provider"
                )
            )

            if configured_provider:

                configured_provider = str(
                    configured_provider
                ).strip().lower()

            # =================================================
            # SEND MESSAGE
            # =================================================

            try:

                channel_results = (
                    await send_multi_channel_message(
                        channels=[channel],
                        recipient=recipient_value,
                        message=campaign.content,
                        channel_configs={
                            channel: channel_config
                        },
                    )
                )

            except Exception as exc:

                error_message = str(exc)

                delivery = MessageDelivery(
                    recipient_id=campaign_recipient.id,
                    channel=channel,
                    status=RecipientStatus.FAILED,
                    provider=configured_provider,
                    provider_message_id=None,
                    sent_at=None,
                    delivered_at=None,
                    failed_at=datetime.utcnow(),
                    error_message=error_message,
                )

                db.add(delivery)

                failed_deliveries += 1
                recipient_failure = True

                delivery_results.append(
                    {
                        "recipient_id": str(
                            campaign_recipient.id
                        ),
                        "audience_member_id": str(
                            audience_member.id
                        ),
                        "channel": channel,
                        "success": False,
                        "provider": configured_provider,
                        "message_id": None,
                        "error": error_message,
                        "duplicate_prevented": False,
                    }
                )

                continue

            # =================================================
            # VALIDATE DISPATCHER RESULT
            # =================================================

            if not channel_results:

                error_message = (
                    "Channel dispatcher returned "
                    "no delivery result."
                )

                delivery = MessageDelivery(
                    recipient_id=campaign_recipient.id,
                    channel=channel,
                    status=RecipientStatus.FAILED,
                    provider=configured_provider,
                    provider_message_id=None,
                    sent_at=None,
                    delivered_at=None,
                    failed_at=datetime.utcnow(),
                    error_message=error_message,
                )

                db.add(delivery)

                failed_deliveries += 1
                recipient_failure = True

                delivery_results.append(
                    {
                        "recipient_id": str(
                            campaign_recipient.id
                        ),
                        "audience_member_id": str(
                            audience_member.id
                        ),
                        "channel": channel,
                        "success": False,
                        "provider": configured_provider,
                        "message_id": None,
                        "error": error_message,
                        "duplicate_prevented": False,
                    }
                )

                continue

            # =================================================
            # EXTRACT DISPATCHER RESULT
            # =================================================

            channel_result = channel_results[0]

            result_success = bool(
                channel_result.success
            )

            result_provider = (
                channel_result.provider
                or configured_provider
            )

            result_message_id = (
                channel_result.message_id
            )

            result_error = (
                channel_result.error
            )

            # =================================================
            # DETERMINE DELIVERY STATE
            # =================================================

            if result_success:

                status = RecipientStatus.SENT

                successful_deliveries += 1
                recipient_success = True

                sent_at = datetime.utcnow()
                failed_at = None

            else:

                status = RecipientStatus.FAILED

                failed_deliveries += 1
                recipient_failure = True

                sent_at = None
                failed_at = datetime.utcnow()

            # =================================================
            # CREATE MESSAGE DELIVERY
            # =================================================

            delivery = MessageDelivery(
                recipient_id=campaign_recipient.id,
                channel=channel,
                status=status,
                provider=result_provider,
                provider_message_id=(
                    str(result_message_id)
                    if result_message_id
                    else None
                ),
                sent_at=sent_at,
                delivered_at=None,
                failed_at=failed_at,
                error_message=result_error,
            )

            db.add(delivery)

            # =================================================
            # API RESULT
            # =================================================

            delivery_results.append(
                {
                    "recipient_id": str(
                        campaign_recipient.id
                    ),
                    "audience_member_id": str(
                        audience_member.id
                    ),
                    "channel": channel,
                    "success": result_success,
                    "provider": result_provider,
                    "message_id": (
                        str(result_message_id)
                        if result_message_id
                        else None
                    ),
                    "error": result_error,
                    "duplicate_prevented": False,
                }
            )

        # ====================================================
        # UPDATE CAMPAIGN RECIPIENT STATUS
        # ====================================================

        if recipient_success:

            campaign_recipient.status = (
                RecipientStatus.SENT
            )

            campaign_recipient.contacted_at = (
                datetime.utcnow()
            )

            campaign_recipient.error_message = None

        elif recipient_failure:

            campaign_recipient.status = (
                RecipientStatus.FAILED
            )

            campaign_recipient.error_message = (
                "All channel deliveries failed."
            )

    # ========================================================
    # FINAL CAMPAIGN STATUS
    # ========================================================

    campaign.completed_at = datetime.utcnow()

    if successful_deliveries > 0:

        campaign.status = (
            CampaignStatus.COMPLETED
        )

    else:

        campaign.status = (
            CampaignStatus.FAILED
        )

    # ========================================================
    # FINAL DATABASE COMMIT
    # ========================================================

    await db.commit()

    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {
        "success": (
            successful_deliveries > 0
        ),

        "campaign_id": str(
            campaign.id
        ),

        "campaign_status": (
            campaign.status.value
        ),

        "total_recipients": len(
            recipients
        ),

        # Primary API key expected by callers/tests.
        "total_attempts": (
            total_attempts
        ),

        # Backward-compatible descriptive key.
        "total_delivery_attempts": (
            total_attempts
        ),

        "successful_deliveries": (
            successful_deliveries
        ),

        "failed_deliveries": (
            failed_deliveries
        ),

        "channels": normalized_channels,

        "deliveries": delivery_results,
    }
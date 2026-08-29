"""
Central communication-channel dispatcher.

Supported channels:

    email
    sms
    whatsapp
    push
    web_broadcast

IMPORTANT:

The existing WhatsApp implementation is reused through:

    app.services.whatsapp.send_whatsapp_message

The existing WhatsApp/RAG implementation is NOT replaced.
"""

from app.services.channel_utils import (
    normalize_channel,
    is_supported_channel,
)

from app.services.channels.base import (
    ChannelDeliveryResult,
)

from app.services.email import (
    send_email_message,
)

from app.services.sms import (
    send_sms_message,
)

from app.services.push import (
    send_push_message,
)

from app.services.web_broadcast import (
    send_web_broadcast_message,
)

from app.services.whatsapp import (
    send_whatsapp_message,
)


# ============================================================
# WHATSAPP ADAPTER
# ============================================================

async def send_whatsapp_channel_message(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:
    """
    Adapter around the existing WhatsApp service.

    DO NOT modify the existing WhatsApp service here.
    """

    config = config or {}

    provider = config.get(
        "provider",
        "meta",
    )

    if not recipient:

        return ChannelDeliveryResult(
            success=False,
            channel="whatsapp",
            recipient=recipient,
            message=message,
            provider=provider,
            error=(
                "WhatsApp recipient is required."
            ),
        )

    if not message:

        return ChannelDeliveryResult(
            success=False,
            channel="whatsapp",
            recipient=recipient,
            message=message,
            provider=provider,
            error=(
                "WhatsApp message is required."
            ),
        )

    try:

        response = await send_whatsapp_message(
            to=recipient,
            message=message,
        )

        message_id = None

        if isinstance(
            response,
            dict,
        ):

            messages = response.get(
                "messages",
                [],
            )

            if messages:

                message_id = messages[0].get(
                    "id"
                )

        return ChannelDeliveryResult(
            success=True,
            channel="whatsapp",
            recipient=recipient,
            message=message,
            provider=provider,
            message_id=message_id,
            metadata={
                "mode": (
                    "existing_whatsapp_service"
                ),
                "response": response,
            },
        )

    except Exception as exc:

        print(
            "WhatsApp channel delivery error:",
            exc,
        )

        return ChannelDeliveryResult(
            success=False,
            channel="whatsapp",
            recipient=recipient,
            message=message,
            provider=provider,
            error=str(exc),
        )


# ============================================================
# MAIN DISPATCHER
# ============================================================

async def send_channel_message(
    channel: str,
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:
    """
    Send a message through one communication channel.
    """

    normalized_channel = normalize_channel(
        channel
    )

    config = config or {}

    # --------------------------------------------------------
    # Validate channel
    # --------------------------------------------------------

    if not is_supported_channel(
        normalized_channel
    ):

        return ChannelDeliveryResult(
            success=False,
            channel=normalized_channel,
            recipient=recipient,
            message=message,
            error=(
                f"Unsupported channel: "
                f"{normalized_channel}"
            ),
        )

    # --------------------------------------------------------
    # Validate recipient
    # --------------------------------------------------------

    if not recipient:

        return ChannelDeliveryResult(
            success=False,
            channel=normalized_channel,
            recipient=recipient,
            message=message,
            error="Recipient is required.",
        )

    # --------------------------------------------------------
    # Validate message
    # --------------------------------------------------------

    if not message:

        return ChannelDeliveryResult(
            success=False,
            channel=normalized_channel,
            recipient=recipient,
            message=message,
            error="Message is required.",
        )

    # ========================================================
    # EMAIL
    # ========================================================

    if normalized_channel == "email":

        return await send_email_message(
            recipient=recipient,
            message=message,
            config=config,
        )

    # ========================================================
    # SMS
    # ========================================================

    if normalized_channel == "sms":

        return await send_sms_message(
            recipient=recipient,
            message=message,
            config=config,
        )

    # ========================================================
    # WHATSAPP
    # ========================================================

    if normalized_channel == "whatsapp":

        return await send_whatsapp_channel_message(
            recipient=recipient,
            message=message,
            config=config,
        )

    # ========================================================
    # PUSH
    # ========================================================

    if normalized_channel == "push":

        return await send_push_message(
            recipient=recipient,
            message=message,
            config=config,
        )

    # ========================================================
    # WEB BROADCAST
    # ========================================================

    if normalized_channel == "web_broadcast":

        return await send_web_broadcast_message(
            recipient=recipient,
            message=message,
            config=config,
        )

    # ========================================================
    # SAFETY FALLBACK
    # ========================================================

    return ChannelDeliveryResult(
        success=False,
        channel=normalized_channel,
        recipient=recipient,
        message=message,
        error=(
            "Channel dispatcher could not "
            "route the message."
        ),
    )


# ============================================================
# MULTI-CHANNEL DISPATCH
# ============================================================

async def send_multi_channel_message(
    channels: list[str],
    recipient: str,
    message: str,
    channel_configs: dict[str, dict] | None = None,
) -> list[ChannelDeliveryResult]:
    """
    Send one message through multiple channels.
    """

    channel_configs = (
        channel_configs or {}
    )

    results = []

    for channel in channels:

        normalized_channel = normalize_channel(
            channel
        )

        config = channel_configs.get(
            normalized_channel,
            {},
        )

        result = await send_channel_message(
            channel=normalized_channel,
            recipient=recipient,
            message=message,
            config=config,
        )

        results.append(
            result
        )

    return results

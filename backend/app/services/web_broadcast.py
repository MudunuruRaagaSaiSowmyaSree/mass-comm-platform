"""
Web Broadcast channel service.

Supported providers:

    dummy
    webhook

The webhook provider allows the platform to publish a
broadcast to an external web-broadcast endpoint.

Configuration example:

{
    "provider": "webhook",
    "url": "https://example.com/api/broadcast",
    "api_key": "YOUR_API_KEY"
}

The dummy provider remains available for development.
"""

import httpx

from app.services.channels.base import (
    BaseChannel,
    ChannelDeliveryResult,
)


class WebBroadcastService(BaseChannel):
    """
    Web broadcast communication service.
    """

    channel_name = "web_broadcast"

    # ========================================================
    # WEBHOOK DELIVERY
    # ========================================================

    async def _send_webhook(
        self,
        recipient: str,
        message: str,
        config: dict,
    ) -> tuple[str | None, dict]:

        url = config.get(
            "url"
        )

        if not url:

            raise ValueError(
                "Web broadcast webhook URL "
                "is required."
            )

        headers = {
            "Content-Type": (
                "application/json"
            )
        }

        api_key = config.get(
            "api_key"
        )

        if api_key:

            headers["Authorization"] = (
                f"Bearer {api_key}"
            )

        payload = {
            "recipient": recipient,
            "message": message,
            "channel": "web_broadcast",
        }

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )

        if response.status_code >= 400:

            raise RuntimeError(
                "Web broadcast API error: "
                f"{response.status_code} "
                f"{response.text}"
            )

        try:
            response_data = (
                response.json()
            )
        except Exception:
            response_data = {
                "status_code": (
                    response.status_code
                ),
                "text": response.text,
            }

        message_id = (
            response_data.get(
                "message_id"
            )
            if isinstance(
                response_data,
                dict,
            )
            else None
        )

        return (
            message_id,
            response_data,
        )

    # ========================================================
    # SEND
    # ========================================================

    async def send(
        self,
        recipient: str,
        message: str,
        config: dict | None = None,
    ) -> ChannelDeliveryResult:

        config = config or {}

        provider = str(
            config.get(
                "provider",
                "dummy",
            )
        ).strip().lower()

        # ----------------------------------------------------
        # Message validation
        # ----------------------------------------------------

        if not message:

            return ChannelDeliveryResult(
                success=False,
                channel=self.channel_name,
                recipient=recipient,
                message=message,
                provider=provider,
                error=(
                    "Web broadcast message "
                    "is required."
                ),
            )

        # ====================================================
        # DUMMY
        # ====================================================

        if provider == "dummy":

            print()
            print("=" * 60)
            print("DUMMY WEB BROADCAST")
            print("=" * 60)
            print(
                f"Target: {recipient}"
            )
            print(
                f"Message: {message}"
            )
            print("=" * 60)
            print()

            return ChannelDeliveryResult(
                success=True,
                channel=self.channel_name,
                recipient=recipient,
                message=message,
                provider=provider,
                message_id=None,
                metadata={
                    "mode": "dummy",
                    "sent": False,
                },
            )

        # ====================================================
        # WEBHOOK
        # ====================================================

        if provider == "webhook":

            try:

                message_id, response = (
                    await self._send_webhook(
                        recipient,
                        message,
                        config,
                    )
                )

                return ChannelDeliveryResult(
                    success=True,
                    channel=self.channel_name,
                    recipient=recipient,
                    message=message,
                    provider=provider,
                    message_id=message_id,
                    metadata={
                        "mode": "webhook",
                        "sent": True,
                        "response": response,
                    },
                )

            except Exception as exc:

                return ChannelDeliveryResult(
                    success=False,
                    channel=self.channel_name,
                    recipient=recipient,
                    message=message,
                    provider=provider,
                    error=str(exc),
                    metadata={
                        "mode": "webhook",
                        "sent": False,
                    },
                )

        # ====================================================
        # UNSUPPORTED PROVIDER
        # ====================================================

        return ChannelDeliveryResult(
            success=False,
            channel=self.channel_name,
            recipient=recipient,
            message=message,
            provider=provider,
            error=(
                f"Unsupported web broadcast "
                f"provider '{provider}'. "
                f"Supported providers: "
                f"dummy, webhook."
            ),
        )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

async def send_web_broadcast_message(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:

    service = WebBroadcastService()

    return await service.send(
        recipient=recipient,
        message=message,
        config=config,
    )

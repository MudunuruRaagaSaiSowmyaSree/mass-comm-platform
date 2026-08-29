"""
Push Notification channel service.

Supported providers:

    dummy
    fcm

Firebase Cloud Messaging configuration example:

{
    "provider": "fcm",
    "server_key": "YOUR_FIREBASE_SERVER_KEY"
}

The dummy provider is retained so development does not
send real notifications accidentally.
"""

import httpx

from app.services.channels.base import (
    BaseChannel,
    ChannelDeliveryResult,
)


class PushService(BaseChannel):
    """
    Push notification communication service.
    """

    channel_name = "push"

    # ========================================================
    # FIREBASE CLOUD MESSAGING
    # ========================================================

    async def _send_fcm(
        self,
        recipient: str,
        message: str,
        config: dict,
    ) -> tuple[str | None, dict]:

        server_key = config.get(
            "server_key"
        )

        if not server_key:

            raise ValueError(
                "FCM server_key is required."
            )

        url = (
            "https://fcm.googleapis.com/fcm/send"
        )

        headers = {
            "Authorization": (
                f"key={server_key}"
            ),
            "Content-Type": (
                "application/json"
            ),
        }

        payload = {
            "to": recipient,
            "notification": {
                "title": config.get(
                    "title",
                    "Mass Communication",
                ),
                "body": message,
            },
            "data": {
                "message": message,
            },
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
                "FCM API error: "
                f"{response.status_code} "
                f"{response.text}"
            )

        response_data = response.json()

        message_id = (
            response_data.get(
                "message_id"
            )
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
        # Validate recipient
        # ----------------------------------------------------

        if not recipient:

            return ChannelDeliveryResult(
                success=False,
                channel=self.channel_name,
                recipient=recipient,
                message=message,
                provider=provider,
                error=(
                    "Push notification recipient "
                    "is required."
                ),
            )

        # ----------------------------------------------------
        # Validate message
        # ----------------------------------------------------

        if not message:

            return ChannelDeliveryResult(
                success=False,
                channel=self.channel_name,
                recipient=recipient,
                message=message,
                provider=provider,
                error=(
                    "Push notification message "
                    "is required."
                ),
            )

        # ====================================================
        # DUMMY
        # ====================================================

        if provider == "dummy":

            print()
            print("=" * 60)
            print("DUMMY PUSH NOTIFICATION")
            print("=" * 60)
            print(
                f"Recipient: {recipient}"
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
        # FCM
        # ====================================================

        if provider == "fcm":

            try:

                message_id, response = (
                    await self._send_fcm(
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
                        "mode": "fcm",
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
                        "mode": "fcm",
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
                f"Unsupported push provider "
                f"'{provider}'. "
                f"Supported providers: "
                f"dummy, fcm."
            ),
        )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

async def send_push_message(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:

    service = PushService()

    return await service.send(
        recipient=recipient,
        message=message,
        config=config,
    )

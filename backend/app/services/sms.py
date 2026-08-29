"""
SMS channel service.

Supports:

    dummy
    twilio

Twilio configuration example:

{
    "provider": "twilio",
    "account_sid": "...",
    "auth_token": "...",
    "from_number": "+1234567890"
}

The implementation uses the Twilio REST API through httpx.

No WhatsApp functionality is modified.
"""

from urllib.parse import quote

import httpx

from app.services.channels.base import (
    BaseChannel,
    ChannelDeliveryResult,
)


# ============================================================
# SMS SERVICE
# ============================================================


class SMSService(BaseChannel):
    """
    SMS communication service.
    """

    channel_name = "sms"

    # ========================================================
    # TWILIO DELIVERY
    # ========================================================

    async def _send_twilio(
        self,
        recipient: str,
        message: str,
        config: dict,
    ) -> tuple[str | None, dict]:
        """
        Send SMS through Twilio REST API.
        """

        account_sid = config.get(
            "account_sid"
        )

        auth_token = config.get(
            "auth_token"
        )

        from_number = config.get(
            "from_number"
        )

        if not account_sid:
            raise ValueError(
                "Twilio account_sid is required."
            )

        if not auth_token:
            raise ValueError(
                "Twilio auth_token is required."
            )

        if not from_number:
            raise ValueError(
                "Twilio from_number is required."
            )

        url = (
            "https://api.twilio.com/2010-04-01/"
            f"Accounts/{quote(account_sid, safe='')}/"
            "Messages.json"
        )

        data = {
            "To": recipient,
            "From": from_number,
            "Body": message,
        }

        async with httpx.AsyncClient(
            timeout=30
        ) as client:

            response = await client.post(
                url,
                data=data,
                auth=(
                    account_sid,
                    auth_token,
                ),
            )

        if response.status_code >= 400:

            raise RuntimeError(
                "Twilio API error: "
                f"{response.status_code} "
                f"{response.text}"
            )

        response_data = response.json()

        return (
            response_data.get("sid"),
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
                    "SMS recipient is required."
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
                    "SMS message is required."
                ),
            )

        # ====================================================
        # DUMMY
        # ====================================================

        if provider == "dummy":

            print()
            print("=" * 60)
            print("DUMMY SMS DELIVERY")
            print("=" * 60)
            print(
                f"To: {recipient}"
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
        # TWILIO
        # ====================================================

        if provider == "twilio":

            try:

                message_id, response = (
                    await self._send_twilio(
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
                        "mode": "twilio",
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
                        "mode": "twilio",
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
                f"Unsupported SMS provider "
                f"'{provider}'. "
                f"Supported providers: "
                f"dummy, twilio."
            ),
        )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================


async def send_sms_message(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:

    service = SMSService()

    return await service.send(
        recipient=recipient,
        message=message,
        config=config,
    )

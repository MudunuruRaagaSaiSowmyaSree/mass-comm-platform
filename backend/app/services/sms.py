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

Twilio trial-account restrictions are handled explicitly so that
the rest of the platform receives a clean ChannelDeliveryResult
instead of an unhandled provider error.

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
        Send SMS through the Twilio REST API.

        Raises:
            ValueError:
                When Twilio configuration is incomplete.

            RuntimeError:
                When Twilio rejects the request.
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

        # ----------------------------------------------------
        # Validate Twilio configuration
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Twilio API URL
        # ----------------------------------------------------

        url = (
            "https://api.twilio.com/2010-04-01/"
            f"Accounts/{quote(account_sid, safe='')}/"
            "Messages.json"
        )

        # ----------------------------------------------------
        # Request data
        # ----------------------------------------------------

        data = {
            "To": recipient,
            "From": from_number,
            "Body": message,
        }

        # ----------------------------------------------------
        # Send request
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Parse response
        # ----------------------------------------------------

        try:

            response_data = response.json()

        except Exception:

            response_data = {
                "raw_response": response.text
            }

        # ----------------------------------------------------
        # Twilio error
        # ----------------------------------------------------

        if response.status_code >= 400:

            error_code = response_data.get(
                "code"
            )

            error_message = response_data.get(
                "message"
            )

            more_info = response_data.get(
                "more_info"
            )

            # ------------------------------------------------
            # Preserve Twilio's structured error information
            # ------------------------------------------------

            raise RuntimeError(
                f"Twilio API error: "
                f"{response.status_code}; "
                f"code={error_code}; "
                f"message={error_message}; "
                f"more_info={more_info}"
            )

        # ----------------------------------------------------
        # Successful response
        # ----------------------------------------------------

        return (
            response_data.get("sid"),
            response_data,
        )

    # ========================================================
    # TWILIO TRIAL ERROR DETECTION
    # ========================================================

    @staticmethod
    def _is_twilio_trial_restriction(
        exc: Exception,
    ) -> bool:
        """
        Determine whether a Twilio error is caused by a
        trial-account restriction.

        Twilio can return different error codes/messages
        depending on the type of trial restriction.

        The currently observed error is:

            572006

        with the message:

            Invalid template name. Trial accounts can only
            use predefined SMS templates.
        """

        error_text = str(
            exc
        ).lower()

        # ----------------------------------------------------
        # Known Twilio trial restriction from this account
        # ----------------------------------------------------

        if "572006" in error_text:

            return True

        # ----------------------------------------------------
        # Generic trial-account indicators
        # ----------------------------------------------------

        trial_indicators = [
            "trial account",
            "trial-account",
            "trial environment",
            "trial restriction",
            "trial restrictions",
            "only use predefined sms templates",
        ]

        return any(
            indicator in error_text
            for indicator in trial_indicators
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
        """
        Send an SMS.

        Supported providers:

            dummy
            twilio

        Twilio trial restrictions are returned as a normal
        failed ChannelDeliveryResult.
        """

        config = config or {}

        provider = str(
            config.get(
                "provider",
                "dummy",
            )
        ).strip().lower()

        # ====================================================
        # VALIDATE RECIPIENT
        # ====================================================

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

        # ====================================================
        # VALIDATE MESSAGE
        # ====================================================

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
        # DUMMY PROVIDER
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
        # TWILIO PROVIDER
        # ====================================================

        if provider == "twilio":

            try:

                message_id, response = (
                    await self._send_twilio(
                        recipient=recipient,
                        message=message,
                        config=config,
                    )
                )

                # --------------------------------------------
                # SUCCESS
                # --------------------------------------------

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

                # --------------------------------------------
                # TWILIO TRIAL RESTRICTION
                # --------------------------------------------

                if self._is_twilio_trial_restriction(
                    exc
                ):

                    trial_error = (
                        "Twilio trial-account restriction: "
                        "this SMS cannot be sent under the "
                        "current Twilio trial account "
                        "restrictions. "
                        "Verify the destination in Twilio's "
                        "trial environment and use a permitted "
                        "recipient, or upgrade the Twilio "
                        "account for unrestricted SMS "
                        "sending."
                    )

                    return ChannelDeliveryResult(
                        success=False,
                        channel=self.channel_name,
                        recipient=recipient,
                        message=message,
                        provider=provider,
                        message_id=None,
                        error=trial_error,
                        metadata={
                            "mode": "twilio",
                            "sent": False,
                            "trial_restriction": True,
                            "original_error": str(
                                exc
                            ),
                        },
                    )

                # --------------------------------------------
                # OTHER TWILIO ERROR
                # --------------------------------------------

                return ChannelDeliveryResult(
                    success=False,
                    channel=self.channel_name,
                    recipient=recipient,
                    message=message,
                    provider=provider,
                    message_id=None,
                    error=str(exc),
                    metadata={
                        "mode": "twilio",
                        "sent": False,
                        "trial_restriction": False,
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
            metadata={
                "mode": "unsupported_provider",
                "sent": False,
            },
        )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================


async def send_sms_message(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:
    """
    Convenience function for sending SMS.
    """

    service = SMSService()

    return await service.send(
        recipient=recipient,
        message=message,
        config=config,
    )
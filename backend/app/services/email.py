"""
Email channel service.

Supports:

    dummy
    smtp

The dummy provider is retained for safe development.

SMTP configuration example:

{
    "provider": "smtp",
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "your-email@example.com",
    "password": "your-password",
    "from_email": "your-email@example.com",
    "use_tls": true
}

No existing WhatsApp functionality is changed.
"""

import asyncio
import smtplib
from email.message import EmailMessage

from app.services.channels.base import (
    BaseChannel,
    ChannelDeliveryResult,
)


# ============================================================
# EMAIL SERVICE
# ============================================================


class EmailService(BaseChannel):
    """
    Email communication service.

    Supported providers:

        dummy
        smtp
    """

    channel_name = "email"

    # ========================================================
    # SMTP DELIVERY
    # ========================================================

    def _send_smtp(
        self,
        recipient: str,
        message: str,
        config: dict,
    ) -> None:
        """
        Send an email through SMTP.

        This is synchronous because smtplib is synchronous.
        The async send() method runs it in a worker thread.
        """

        host = config.get("host")

        if not host:
            raise ValueError(
                "SMTP host is required."
            )

        port = int(
            config.get(
                "port",
                587,
            )
        )

        username = config.get(
            "username"
        )

        password = config.get(
            "password"
        )

        from_email = config.get(
            "from_email",
            username,
        )

        if not from_email:
            raise ValueError(
                "SMTP from_email is required."
            )

        use_tls = bool(
            config.get(
                "use_tls",
                True,
            )
        )

        subject = config.get(
            "subject",
            "Campaign Message",
        )

        email = EmailMessage()

        email["From"] = from_email
        email["To"] = recipient
        email["Subject"] = subject

        email.set_content(
            message
        )

        with smtplib.SMTP(
            host,
            port,
            timeout=30,
        ) as server:

            if use_tls:
                server.starttls()

            if username:
                server.login(
                    username,
                    password or "",
                )

            server.send_message(
                email
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
                    "Email recipient is required."
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
                    "Email message is required."
                ),
            )

        # ====================================================
        # DUMMY PROVIDER
        # ====================================================

        if provider == "dummy":

            print()
            print("=" * 60)
            print("DUMMY EMAIL DELIVERY")
            print("=" * 60)
            print(
                f"To: {recipient}"
            )
            print(
                f"Provider: {provider}"
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
                    "note": (
                        "No real email was sent."
                    ),
                },
            )

        # ====================================================
        # SMTP PROVIDER
        # ====================================================

        if provider == "smtp":

            required_fields = [
                "host",
                "from_email",
            ]

            missing_fields = [
                field
                for field in required_fields
                if not config.get(field)
            ]

            if missing_fields:

                return ChannelDeliveryResult(
                    success=False,
                    channel=self.channel_name,
                    recipient=recipient,
                    message=message,
                    provider=provider,
                    error=(
                        "SMTP configuration is incomplete."
                    ),
                    metadata={
                        "missing_fields": (
                            missing_fields
                        )
                    },
                )

            try:

                await asyncio.to_thread(
                    self._send_smtp,
                    recipient,
                    message,
                    config,
                )

                return ChannelDeliveryResult(
                    success=True,
                    channel=self.channel_name,
                    recipient=recipient,
                    message=message,
                    provider=provider,
                    message_id=None,
                    metadata={
                        "mode": "smtp",
                        "sent": True,
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
                        "mode": "smtp",
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
                f"Unsupported email provider "
                f"'{provider}'. "
                f"Supported providers: "
                f"dummy, smtp."
            ),
        )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================


async def send_email_message(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:
    """
    Send an email using EmailService.
    """

    service = EmailService()

    return await service.send(
        recipient=recipient,
        message=message,
        config=config,
    )
async def send_email(
    recipient: str,
    message: str,
    config: dict | None = None,
) -> ChannelDeliveryResult:
    """
    Backward-compatible wrapper for existing code.

    Existing routers/services may call send_email().
    Internally it uses EmailService through
    send_email_message().
    """

    return await send_email_message(
        recipient=recipient,
        message=message,
        config=config,
    )

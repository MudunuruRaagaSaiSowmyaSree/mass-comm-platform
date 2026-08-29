"""
Common channel definitions and helper functions.

This file contains channel constants and utility functions only.

IMPORTANT:
The SQLAlchemy ChannelConfig model belongs in:

    app/models/channel_config.py

The Pydantic request/response schemas belong in:

    app/schemas/channel_config.py
"""

# ============================================================
# SUPPORTED CHANNELS
# ============================================================

SUPPORTED_CHANNELS = {
    "email",
    "sms",
    "whatsapp",
    "push",
    "web_broadcast",
}


# ============================================================
# DISPLAY NAMES
# ============================================================

CHANNEL_DISPLAY_NAMES = {
    "email": "Email",
    "sms": "SMS",
    "whatsapp": "WhatsApp",
    "push": "Push Notification",
    "web_broadcast": "Web Broadcast",
}


# ============================================================
# NORMALIZE CHANNEL
# ============================================================

def normalize_channel(
    channel: str,
) -> str:
    """
    Normalize a channel name.

    Examples:

        WhatsApp -> whatsapp
        EMAIL    -> email
        web-broadcast -> web-broadcast
    """

    if not channel:
        return ""

    return channel.strip().lower()


# ============================================================
# CHECK SUPPORTED CHANNEL
# ============================================================

def is_supported_channel(
    channel: str,
) -> bool:
    """
    Return True when the channel is supported.
    """

    normalized = normalize_channel(
        channel
    )

    return normalized in SUPPORTED_CHANNELS


# ============================================================
# GET DISPLAY NAME
# ============================================================

def get_channel_display_name(
    channel: str,
) -> str:
    """
    Return a human-readable channel name.
    """

    normalized = normalize_channel(
        channel
    )

    return CHANNEL_DISPLAY_NAMES.get(
        normalized,
        normalized.replace(
            "_",
            " ",
        ).title(),
    )


# ============================================================
# GET SUPPORTED CHANNELS
# ============================================================

def get_supported_channels() -> list[str]:
    """
    Return all supported channels.
    """

    return sorted(
        SUPPORTED_CHANNELS
    )


# ============================================================
# VALIDATE CHANNEL
# ============================================================

def validate_channel(
    channel: str,
) -> str:
    """
    Normalize and validate a channel.

    Raises:
        ValueError
        if the channel is unsupported.
    """

    normalized = normalize_channel(
        channel
    )

    if not normalized:

        raise ValueError(
            "Channel is required."
        )

    if normalized not in SUPPORTED_CHANNELS:

        raise ValueError(
            f"Unsupported channel "
            f"'{normalized}'. "
            f"Supported channels are: "
            f"{', '.join(
                get_supported_channels()
            )}"
        )

    return normalized

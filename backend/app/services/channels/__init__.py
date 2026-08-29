"""
Common channel definitions and helper functions.
"""

SUPPORTED_CHANNELS = {
    "email",
    "sms",
    "whatsapp",
    "push",
    "web_broadcast",
}


CHANNEL_DISPLAY_NAMES = {
    "email": "Email",
    "sms": "SMS",
    "whatsapp": "WhatsApp",
    "push": "Push Notification",
    "web_broadcast": "Web Broadcast",
}


def normalize_channel(
    channel: str,
) -> str:
    """
    Normalize a channel name.
    """

    if not channel:
        return ""

    return channel.strip().lower()


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


def get_supported_channels() -> list[str]:
    """
    Return all supported channels.
    """

    return sorted(
        SUPPORTED_CHANNELS
    )


def validate_channel(
    channel: str,
) -> str:
    """
    Normalize and validate a channel.
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
            f"{', '.join(get_supported_channels())}"
        )

    return normalized
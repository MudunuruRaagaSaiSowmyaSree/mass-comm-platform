from dataclasses import dataclass
from typing import Any


@dataclass
class ChannelDeliveryResult:
    """
    Standard result returned by every channel service.
    """

    success: bool
    channel: str
    recipient: str
    message: str

    provider: str | None = None
    message_id: str | None = None
    error: str | None = None

    metadata: dict[str, Any] | None = None

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "channel": self.channel,
            "recipient": self.recipient,
            "message": self.message,
            "provider": self.provider,
            "message_id": self.message_id,
            "error": self.error,
            "metadata": self.metadata or {},
        }


class BaseChannel:
    """
    Base interface for all communication channels.
    """

    channel_name = "unknown"

    async def send(
        self,
        recipient: str,
        message: str,
        config: dict | None = None,
    ) -> ChannelDeliveryResult:

        raise NotImplementedError(
            "Channel services must implement send()."
        )
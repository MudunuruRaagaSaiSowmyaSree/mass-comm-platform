# app/models/channel_config.py

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ChannelConfig(Base):
    """
    Stores configuration for communication channels.

    Supported channels:

        email
        sms
        whatsapp
        push
        web_broadcast
    """

    __tablename__ = "channel_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    channel: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Channel-specific configuration.
    #
    # Example:
    #
    # {
    #     "provider": "smtp",
    #     "host": "smtp.example.com",
    #     "port": 587,
    #     "username": "example",
    #     "password": "secret"
    # }
    #
    # For WhatsApp this can contain:
    #
    # {
    #     "provider": "meta",
    #     "phone_number_id": "...",
    #     "access_token": "..."
    # }
    #
    # Credentials are masked when returned by the API.
    config: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
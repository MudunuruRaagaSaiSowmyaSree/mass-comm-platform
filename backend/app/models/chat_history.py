import uuid

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ChatHistory(Base):
    __tablename__ = "chat_history"

    # ============================================================
    # PRIMARY KEY
    # ============================================================

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    # ============================================================
    # APPLICATION USER
    # ============================================================

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey(
            "users.id"
        ),
        nullable=True,
        index=True,
    )

    # ============================================================
    # SESSION
    #
    # For WhatsApp conversations this stores the WhatsApp
    # phone number because WhatsApp sender IDs are not UUIDs.
    # ============================================================

    session_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    # ============================================================
    # USER MESSAGE
    # ============================================================

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # ============================================================
    # ASSISTANT RESPONSE
    # ============================================================

    response: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # ============================================================
    # LANGUAGE
    # ============================================================

    language: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    # ============================================================
    # CREATED
    # ============================================================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )
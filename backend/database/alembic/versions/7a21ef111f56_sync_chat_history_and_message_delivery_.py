"""sync chat history and message delivery indexes

Revision ID: 7a21ef111f56
Revises: a69e3f6c91a7
Create Date: 2026-08-29

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7a21ef111f56"
down_revision: Union[str, Sequence[str], None] = "a69e3f6c91a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Synchronize database schema with current SQLAlchemy models."""

    # ============================================================
    # CHAT HISTORY
    # ============================================================

    # Change language from VARCHAR(10) to VARCHAR(20).
    op.alter_column(
        "chat_history",
        "language",
        existing_type=sa.String(length=10),
        type_=sa.String(length=20),
        existing_nullable=True,
    )

    # Add index declared by ChatHistory.session_id.
    op.create_index(
        "ix_chat_history_session_id",
        "chat_history",
        ["session_id"],
        unique=False,
    )

    # Add index declared by ChatHistory.created_at.
    op.create_index(
        "ix_chat_history_created_at",
        "chat_history",
        ["created_at"],
        unique=False,
    )

    # ============================================================
    # MESSAGE DELIVERIES
    # ============================================================

    # provider no longer has index=True in the model.
    op.drop_index(
        "ix_message_deliveries_provider",
        table_name="message_deliveries",
    )

    # channel has index=True in the model.
    op.create_index(
        "ix_message_deliveries_channel",
        "message_deliveries",
        ["channel"],
        unique=False,
    )

    # provider_message_id has index=True in the model.
    op.create_index(
        "ix_message_deliveries_provider_message_id",
        "message_deliveries",
        ["provider_message_id"],
        unique=False,
    )


def downgrade() -> None:
    """Reverse the schema synchronization."""

    # ============================================================
    # MESSAGE DELIVERIES
    # ============================================================

    op.drop_index(
        "ix_message_deliveries_provider_message_id",
        table_name="message_deliveries",
    )

    op.drop_index(
        "ix_message_deliveries_channel",
        table_name="message_deliveries",
    )

    op.create_index(
        "ix_message_deliveries_provider",
        "message_deliveries",
        ["provider"],
        unique=False,
    )

    # ============================================================
    # CHAT HISTORY
    # ============================================================

    op.drop_index(
        "ix_chat_history_created_at",
        table_name="chat_history",
    )

    op.drop_index(
        "ix_chat_history_session_id",
        table_name="chat_history",
    )

    op.alter_column(
        "chat_history",
        "language",
        existing_type=sa.String(length=20),
        type_=sa.String(length=10),
        existing_nullable=True,
    )

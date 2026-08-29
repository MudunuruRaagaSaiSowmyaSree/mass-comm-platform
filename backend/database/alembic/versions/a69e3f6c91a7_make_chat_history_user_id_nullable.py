"""make chat history user id nullable

Revision ID: a69e3f6c91a7
Revises: 31ba053f2749
Create Date: 2026-08-25 08:30:04.788878

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a69e3f6c91a7"
down_revision: Union[str, Sequence[str], None] = "31ba053f2749"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Make chat_history.user_id nullable."""

    op.alter_column(
        "chat_history",
        "user_id",
        existing_type=sa.UUID(),
        nullable=True,
    )


def downgrade() -> None:
    """Restore chat_history.user_id as NOT NULL."""

    op.alter_column(
        "chat_history",
        "user_id",
        existing_type=sa.UUID(),
        nullable=False,
    )
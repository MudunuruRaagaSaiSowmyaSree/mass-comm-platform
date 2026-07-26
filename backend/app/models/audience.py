import uuid
from sqlalchemy import String, ForeignKey, Index, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from datetime import datetime

class AudienceMember(Base):
    __tablename__ = "audience_members"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)

    language: Mapped[str] = mapped_column(String, index=True)
    geography: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    occupation: Mapped[str | None] = mapped_column(String, nullable=True)

    org_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("organizations.id"), nullable=True, index=True
    )

    engagement_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_contacted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_audience_lang_geo", "language", "geography"),
    )
    
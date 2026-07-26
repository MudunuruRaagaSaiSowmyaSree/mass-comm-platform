import uuid
import enum
from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class CampaignType(str, enum.Enum):
    AWARENESS = "awareness"
    EMERGENCY = "emergency"
    EDUCATIONAL = "educational"
    ANNOUNCEMENT = "announcement"

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    COMPLETED = "completed"
    FAILED = "failed"

class Campaign(Base):
    __tablename__ = "campaigns"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String)
    type: Mapped[CampaignType] = mapped_column(Enum(CampaignType))
    status: Mapped[CampaignStatus] = mapped_column(
        Enum(CampaignStatus), default=CampaignStatus.DRAFT, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    target_filters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
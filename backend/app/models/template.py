import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.campaign import CampaignType

class Template(Base):
    __tablename__ = "templates"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String)
    campaign_type: Mapped[CampaignType] = mapped_column(Enum(CampaignType), index=True)
    body: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String, default="en", index=True)
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
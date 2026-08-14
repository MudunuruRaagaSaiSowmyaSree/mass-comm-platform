import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Role(str, enum.Enum):
    ADMIN = "admin"
    CAMPAIGN_MANAGER = "campaign_manager"
    COMMS_TEAM = "comms_team"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # Common fields (all roles)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str]
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.COMMS_TEAM)
    is_active: Mapped[bool] = mapped_column(default=True)
    registration_date: Mapped[datetime | None] = mapped_column(DateTime, default=datetime.utcnow, nullable=True)

    # Admin-only fields
    admin_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    department: Mapped[str | None] = mapped_column(String, nullable=True)
    access_level: Mapped[str | None] = mapped_column(String, nullable=True)

    # Campaign Manager-only fields
    manager_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    assigned_region: Mapped[str | None] = mapped_column(String, nullable=True)
    shift_timing: Mapped[str | None] = mapped_column(String, nullable=True)
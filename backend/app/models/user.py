import uuid
import enum
from sqlalchemy import String, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Role(str, enum.Enum):
    ADMIN = "admin"
    CAMPAIGN_MANAGER = "campaign_manager"
    COMMS_TEAM = "comms_team"

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    hashed_password: Mapped[str]
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.COMMS_TEAM)
    is_active: Mapped[bool] = mapped_column(default=True)
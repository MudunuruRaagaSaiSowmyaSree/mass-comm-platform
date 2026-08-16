from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str | None = None

    role: str = "comms_team"

    # Admin fields
    admin_id: str | None = None
    department: str | None = None
    access_level: str | None = None

    # Campaign Manager fields
    manager_id: str | None = None
    assigned_region: str | None = None
    shift_timing: str | None = None
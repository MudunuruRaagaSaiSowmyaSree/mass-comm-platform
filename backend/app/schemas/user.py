import uuid
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.models.user import Role

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: Role

    # Admin-only fields (required if role == admin)
    admin_id: Optional[str] = None
    department: Optional[str] = None
    access_level: Optional[str] = None

    # Campaign Manager-only fields (required if role == campaign_manager)
    manager_id: Optional[str] = None
    assigned_region: Optional[str] = None
    shift_timing: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = v.replace(" ", "").replace("-", "")
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Phone must be a valid number with at least 10 digits")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @model_validator(mode="after")
    def validate_role_specific_fields(self) -> "UserRegister":
        if self.role == Role.ADMIN:
            missing = [
                f for f in ["admin_id", "department", "access_level"]
                if not getattr(self, f)
            ]
            if missing:
                raise ValueError(f"Admin role requires: {', '.join(missing)}")

        elif self.role == Role.CAMPAIGN_MANAGER:
            missing = [
                f for f in ["manager_id", "assigned_region", "shift_timing"]
                if not getattr(self, f)
            ]
            if missing:
                raise ValueError(f"Campaign Manager role requires: {', '.join(missing)}")

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    phone: str | None
    role: Role
    is_active: bool
    admin_id: str | None = None
    department: str | None = None
    access_level: str | None = None
    manager_id: str | None = None
    assigned_region: str | None = None
    shift_timing: str | None = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
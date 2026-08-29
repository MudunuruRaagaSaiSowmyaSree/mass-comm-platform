from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, Role
from app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
)
from app.core.deps import get_current_user
from app.schemas.register import RegisterRequest


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# UPDATE CURRENT USER REQUEST
# ============================================================

class UpdateCurrentUserRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    department: str | None = None
    access_level: str | None = None
    assigned_region: str | None = None
    shift_timing: str | None = None


# ============================================================
# REGISTER
# ============================================================

@router.post("/register")
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        role = Role(data.role.lower())
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=(
                "Invalid role. Allowed values: "
                "admin, campaign_manager, comms_team."
            ),
        )

    result = await db.execute(
        select(User).where(User.email == data.email)
    )

    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered",
        )

    if data.admin_id:
        result = await db.execute(
            select(User).where(
                User.admin_id == data.admin_id
            )
        )

        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            raise HTTPException(
                status_code=400,
                detail="Admin ID is already registered",
            )

    if data.manager_id:
        result = await db.execute(
            select(User).where(
                User.manager_id == data.manager_id
            )
        )

        existing_manager = result.scalar_one_or_none()

        if existing_manager:
            raise HTTPException(
                status_code=400,
                detail="Manager ID is already registered",
            )

    user = User(
        name=data.name.strip(),
        email=data.email,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        role=role,
        is_active=True,

        admin_id=data.admin_id,
        department=data.department,
        access_level=data.access_level,

        manager_id=data.manager_id,
        assigned_region=data.assigned_region,
        shift_timing=data.shift_timing,
    )

    db.add(user)

    try:
        await db.commit()
        await db.refresh(user)

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(exc)}",
        )

    return {
        "message": "Registration successful",
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role.value,
    }


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(
            User.email == form_data.username
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        data={
            "sub": user.email
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get("/me")
async def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": role,
        "is_active": current_user.is_active,
        "registration_date": (
            current_user.registration_date.isoformat()
            if current_user.registration_date
            else None
        ),

        "admin_id": current_user.admin_id,
        "department": current_user.department,
        "access_level": current_user.access_level,

        "manager_id": current_user.manager_id,
        "assigned_region": current_user.assigned_region,
        "shift_timing": current_user.shift_timing,
    }


# ============================================================
# UPDATE CURRENT USER
# ============================================================

@router.put("/me")
async def update_current_user(
    data: UpdateCurrentUserRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(get_db),
):
    if data.name is not None:
        current_user.name = data.name.strip()

    if data.phone is not None:
        current_user.phone = data.phone.strip()

    if data.department is not None:
        current_user.department = data.department.strip()

    if data.access_level is not None:
        current_user.access_level = data.access_level.strip()

    if data.assigned_region is not None:
        current_user.assigned_region = data.assigned_region.strip()

    if data.shift_timing is not None:
        current_user.shift_timing = data.shift_timing.strip()

    try:
        await db.commit()
        await db.refresh(current_user)

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(exc)}",
        )

    role = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "role": role,
            "is_active": current_user.is_active,
            "registration_date": (
                current_user.registration_date.isoformat()
                if current_user.registration_date
                else None
            ),

            "admin_id": current_user.admin_id,
            "department": current_user.department,
            "access_level": current_user.access_level,

            "manager_id": current_user.manager_id,
            "assigned_region": current_user.assigned_region,
            "shift_timing": current_user.shift_timing,
        },
    }


# ============================================================
# CHANGE PASSWORD
# ============================================================

@router.post("/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(
        current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    if verify_password(
        new_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    current_user.hashed_password = get_password_hash(
        new_password
    )

    current_user.password_reset_token = None
    current_user.password_reset_expires = None

    try:
        await db.commit()

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password change failed: {str(exc)}",
        )

    return {
        "message": "Password changed successfully"
    }


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post("/forgot-password")
async def forgot_password(
    email: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(
            User.email == email.strip()
        )
    )

    user = result.scalar_one_or_none()

    # Do not reveal whether an email exists.
    if user is None:
        return {
            "message": (
                "If an account with that email exists, "
                "a password reset request has been created."
            )
        }

    # Generate a secure random reset token.
    reset_token = secrets.token_urlsafe(32)

    # Token is valid for 30 minutes.
    reset_expires = datetime.utcnow() + timedelta(
	minutes=30
    )
    user.password_reset_token = reset_token
    user.password_reset_expires = reset_expires

    try:
        await db.commit()

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {str(exc)}",
        )

    # --------------------------------------------------------
    # DEVELOPMENT RESPONSE
    # --------------------------------------------------------
    # In production, do NOT return the reset token.
    # Send it through email/SMS instead.
    # --------------------------------------------------------

    return {
        "message": (
            "Password reset request created successfully"
        ),
        "reset_token": reset_token,
        "expires_in_minutes": 30,
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: AsyncSession = Depends(get_db),
):
    # --------------------------------------------------------
    # Validate new password
    # --------------------------------------------------------

    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    # --------------------------------------------------------
    # Find user by reset token
    # --------------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.password_reset_token == token
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    # --------------------------------------------------------
    # Check token expiration
    # --------------------------------------------------------

    if (
        user.password_reset_expires is None
        or user.password_reset_expires
        < datetime.now(timezone.utc).replace(tzinfo=None)
    ):
        user.password_reset_token = None
        user.password_reset_expires = None

        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    # --------------------------------------------------------
    # Prevent same password
    # --------------------------------------------------------

    if verify_password(
        new_password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    # --------------------------------------------------------
    # Update password
    # --------------------------------------------------------

    user.hashed_password = get_password_hash(
        new_password
    )

    # --------------------------------------------------------
    # Invalidate reset token
    # --------------------------------------------------------

    user.password_reset_token = None
    user.password_reset_expires = None

    try:
        await db.commit()

    except Exception as exc:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {str(exc)}",
        )

    return {
        "message": "Password reset successfully"
    }
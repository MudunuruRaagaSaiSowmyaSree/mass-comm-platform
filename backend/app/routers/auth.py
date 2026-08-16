from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
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
# REGISTER
# ============================================================

@router.post("/register")
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    # --------------------------------------------------------
    # Validate role
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Check duplicate email
    # --------------------------------------------------------

    result = await db.execute(
        select(User).where(User.email == data.email)
    )

    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered",
        )

    # --------------------------------------------------------
    # Check duplicate Admin ID
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Check duplicate Manager ID
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user = User(
        name=data.name.strip(),
        email=data.email,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        role=role,
        is_active=True,

        # Admin fields
        admin_id=data.admin_id,
        department=data.department,
        access_level=data.access_level,

        # Campaign Manager fields
        manager_id=data.manager_id,
        assigned_region=data.assigned_region,
        shift_timing=data.shift_timing,
    )

    db.add(user)

    # --------------------------------------------------------
    # Save user
    # --------------------------------------------------------

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

        # Admin information
        "admin_id": current_user.admin_id,
        "department": current_user.department,
        "access_level": current_user.access_level,

        # Campaign Manager information
        "manager_id": current_user.manager_id,
        "assigned_region": current_user.assigned_region,
        "shift_timing": current_user.shift_timing,
    }
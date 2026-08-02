from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserOut, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.models.user import Role

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check email uniqueness
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check admin_id uniqueness (if provided)
    if data.admin_id:
        result = await db.execute(select(User).where(User.admin_id == data.admin_id))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Admin ID already in use")

    # Check manager_id uniqueness (if provided)
    if data.manager_id:
        result = await db.execute(select(User).where(User.manager_id == data.manager_id))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Manager ID already in use")

    user = User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        hashed_password=hash_password(data.password),
        role=data.role,
        admin_id=data.admin_id,
        department=data.department,
        access_level=data.access_level,
        manager_id=data.manager_id,
        assigned_region=data.assigned_region,
        shift_timing=data.shift_timing,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return current_user
@router.get("/admin-only")
async def admin_only_route(current_user: User = Depends(require_role(Role.ADMIN))):
    return {"message": f"Welcome, admin {current_user.email}"}
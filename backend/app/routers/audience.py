import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.audience import AudienceMember
from app.models.user import User, Role
from app.schemas.audience import AudienceMemberCreate, AudienceMemberOut
from app.core.deps import get_current_user
from app.core.rbac import require_role

router = APIRouter(prefix="/audience", tags=["audience"])

@router.post("/", response_model=AudienceMemberOut)
async def create_member(
    data: AudienceMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    member = AudienceMember(**data.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member

@router.get("/", response_model=list[AudienceMemberOut])
async def list_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(select(AudienceMember).limit(limit).offset(offset))
    return result.scalars().all()

@router.get("/{member_id}", response_model=AudienceMemberOut)
async def get_member(
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = await db.get(AudienceMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Audience member not found")
    return member
import csv
import io
from fastapi import UploadFile, File
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
@router.put("/{member_id}", response_model=AudienceMemberOut)
async def update_member(
    member_id: uuid.UUID,
    data: AudienceMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    member = await db.get(AudienceMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Audience member not found")
    for key, value in data.model_dump().items():
        setattr(member, key, value)
    await db.commit()
    await db.refresh(member)
    return member

@router.delete("/{member_id}")
async def delete_member(
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    member = await db.get(AudienceMember, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Audience member not found")
    await db.delete(member)
    await db.commit()
    return {"detail": "Deleted successfully"}
@router.post("/import")
async def import_members(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN, Role.CAMPAIGN_MANAGER)),
):
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    created = 0
    errors = []

    for i, row in enumerate(reader, start=2):  # start=2 accounts for header row
        try:
            if not row.get("name") or not row.get("language"):
                errors.append({"row": i, "error": "Missing required field: name or language"})
                continue
            member = AudienceMember(
                name=row.get("name"),
                email=row.get("email") or None,
                phone=row.get("phone") or None,
                language=row.get("language"),
                geography=row.get("geography") or None,
                occupation=row.get("occupation") or None,
            )
            db.add(member)
            created += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})

    await db.commit()
    return {"created": created, "errors": errors}
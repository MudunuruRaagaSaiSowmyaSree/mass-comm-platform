import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateCreate, TemplateOut
from app.core.deps import get_current_user


router = APIRouter(
    prefix="/templates",
    tags=["templates"],
)


# ============================================================
# CREATE TEMPLATE
# ============================================================

@router.post("/", response_model=TemplateOut)
async def create_template(
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = Template(
        name=data.name,
        campaign_type=data.campaign_type,
        body=data.body,
        language=data.language,
        created_by=current_user.id,
    )

    db.add(template)

    await db.commit()
    await db.refresh(template)

    return template


# ============================================================
# LIST TEMPLATES
# ============================================================

@router.get("/", response_model=list[TemplateOut])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    campaign_type: str | None = None,
    language: str | None = None,
):
    stmt = select(Template)

    if campaign_type:
        stmt = stmt.where(
            Template.campaign_type == campaign_type
        )

    if language:
        stmt = stmt.where(
            Template.language == language
        )

    result = await db.execute(stmt)

    return result.scalars().all()


# ============================================================
# GET SINGLE TEMPLATE
# ============================================================

@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await db.get(
        Template,
        template_id,
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    return template


# ============================================================
# UPDATE TEMPLATE
# ============================================================

@router.put("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: uuid.UUID,
    data: TemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await db.get(
        Template,
        template_id,
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    template.name = data.name
    template.campaign_type = data.campaign_type
    template.body = data.body
    template.language = data.language

    await db.commit()
    await db.refresh(template)

    return template


# ============================================================
# DELETE TEMPLATE
# ============================================================

@router.delete("/{template_id}")
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = await db.get(
        Template,
        template_id,
    )

    if not template:
        raise HTTPException(
            status_code=404,
            detail="Template not found",
        )

    await db.delete(template)
    await db.commit()

    return {
        "message": "Template deleted successfully",
        "id": str(template_id),
    }
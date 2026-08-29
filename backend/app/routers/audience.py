import csv
import io
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.database import get_db
from app.models.audience import AudienceMember
from app.models.user import Role, User
from app.schemas.audience import (
    AudienceMemberCreate,
    AudienceMemberOut,
)


router = APIRouter(
    prefix="/audience",
    tags=["audience"],
)


# ============================================================
# CREATE AUDIENCE MEMBER
# ============================================================

@router.post(
    "/",
    response_model=AudienceMemberOut,
)
async def create_member(
    data: AudienceMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER,
        )
    ),
):
    member = AudienceMember(
        **data.model_dump()
    )

    db.add(member)

    await db.commit()
    await db.refresh(member)

    return member


# ============================================================
# LIST AUDIENCE MEMBERS
# ============================================================

@router.get(
    "/",
    response_model=list[AudienceMemberOut],
)
async def list_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(AudienceMember)
        .order_by(AudienceMember.name)
        .limit(limit)
        .offset(offset)
    )

    return result.scalars().all()


# ============================================================
# SEGMENT AUDIENCE
# ============================================================

@router.get(
    "/segment",
    response_model=list[AudienceMemberOut],
)
async def segment_audience(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),

    # Basic audience filters
    language: str | None = None,
    geography: str | None = None,
    occupation: str | None = None,

    # Organization filter
    org_id: uuid.UUID | None = None,

    # Engagement filters
    min_engagement: float | None = None,
    max_engagement: float | None = None,

    # Pagination
    limit: int = 100,
    offset: int = 0,
):
    """
    Return audience members matching
    the supplied segmentation filters.

    Supported filters:

    - language
    - geography
    - occupation
    - organization
    - minimum engagement score
    - maximum engagement score
    """

    # Safety limits for pagination
    limit = min(max(limit, 1), 500)
    offset = max(offset, 0)

    stmt = select(AudienceMember)

    # --------------------------------------------------------
    # Language
    # --------------------------------------------------------

    if language:
        stmt = stmt.where(
            AudienceMember.language == language
        )

    # --------------------------------------------------------
    # Geography
    # --------------------------------------------------------

    if geography:
        stmt = stmt.where(
            AudienceMember.geography == geography
        )

    # --------------------------------------------------------
    # Occupation
    # --------------------------------------------------------

    if occupation:
        stmt = stmt.where(
            AudienceMember.occupation == occupation
        )

    # --------------------------------------------------------
    # Organization
    # --------------------------------------------------------

    if org_id:
        stmt = stmt.where(
            AudienceMember.org_id == org_id
        )

    # --------------------------------------------------------
    # Minimum engagement
    # --------------------------------------------------------

    if min_engagement is not None:
        stmt = stmt.where(
            AudienceMember.engagement_score
            >= min_engagement
        )

    # --------------------------------------------------------
    # Maximum engagement
    # --------------------------------------------------------

    if max_engagement is not None:
        stmt = stmt.where(
            AudienceMember.engagement_score
            <= max_engagement
        )

    # --------------------------------------------------------
    # Sorting + pagination
    # --------------------------------------------------------

    stmt = (
        stmt
        .order_by(AudienceMember.name)
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)

    return result.scalars().all()


# ============================================================
# SEGMENT COUNT
# ============================================================

@router.get(
    "/segment/count",
)
async def segment_audience_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),

    language: str | None = None,
    geography: str | None = None,
    occupation: str | None = None,

    org_id: uuid.UUID | None = None,

    min_engagement: float | None = None,
    max_engagement: float | None = None,
):
    """
    Return the number of audience members
    matching the supplied filters.
    """

    stmt = (
        select(func.count())
        .select_from(AudienceMember)
    )

    # Language
    if language:
        stmt = stmt.where(
            AudienceMember.language == language
        )

    # Geography
    if geography:
        stmt = stmt.where(
            AudienceMember.geography == geography
        )

    # Occupation
    if occupation:
        stmt = stmt.where(
            AudienceMember.occupation == occupation
        )

    # Organization
    if org_id:
        stmt = stmt.where(
            AudienceMember.org_id == org_id
        )

    # Minimum engagement
    if min_engagement is not None:
        stmt = stmt.where(
            AudienceMember.engagement_score
            >= min_engagement
        )

    # Maximum engagement
    if max_engagement is not None:
        stmt = stmt.where(
            AudienceMember.engagement_score
            <= max_engagement
        )

    result = await db.execute(stmt)

    return {
        "count": result.scalar_one()
    }


# ============================================================
# GET SINGLE AUDIENCE MEMBER
# ============================================================

@router.get(
    "/{member_id}",
    response_model=AudienceMemberOut,
)
async def get_member(
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    member = await db.get(
        AudienceMember,
        member_id,
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    return member


# ============================================================
# UPDATE AUDIENCE MEMBER
# ============================================================

@router.put(
    "/{member_id}",
    response_model=AudienceMemberOut,
)
async def update_member(
    member_id: uuid.UUID,
    data: AudienceMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER,
        )
    ),
):
    member = await db.get(
        AudienceMember,
        member_id,
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    for key, value in data.model_dump().items():
        setattr(
            member,
            key,
            value,
        )

    await db.commit()
    await db.refresh(member)

    return member


# ============================================================
# DELETE AUDIENCE MEMBER
# ============================================================

@router.delete(
    "/{member_id}",
)
async def delete_member(
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER,
        )
    ),
):
    member = await db.get(
        AudienceMember,
        member_id,
    )

    if not member:
        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    await db.delete(member)
    await db.commit()

    return {
        "detail": "Deleted successfully"
    }


# ============================================================
# IMPORT AUDIENCE FROM CSV
# ============================================================

@router.post(
    "/import",
)
async def import_members(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(
            Role.ADMIN,
            Role.CAMPAIGN_MANAGER,
        )
    ),
):
    content = await file.read()

    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV file must use UTF-8 encoding.",
        )

    reader = csv.DictReader(
        io.StringIO(decoded)
    )

    created = 0
    errors = []

    for i, row in enumerate(
        reader,
        start=2,
    ):
        try:
            # Required fields
            if (
                not row.get("name")
                or not row.get("language")
            ):
                errors.append(
                    {
                        "row": i,
                        "error": (
                            "Missing required field: "
                            "name or language"
                        ),
                    }
                )
                continue

            member = AudienceMember(
                name=row.get("name"),
                email=row.get("email") or None,
                phone=row.get("phone") or None,
                language=row.get("language"),
                geography=(
                    row.get("geography")
                    or None
                ),
                occupation=(
                    row.get("occupation")
                    or None
                ),
            )

            db.add(member)
            created += 1

        except Exception as exc:
            errors.append(
                {
                    "row": i,
                    "error": str(exc),
                }
            )

    await db.commit()

    return {
        "created": created,
        "errors": errors,
    }
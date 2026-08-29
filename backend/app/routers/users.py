from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import Role, User


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


# ============================================================
# SCHEMAS
# ============================================================

class AssignManagerRequest(BaseModel):
    manager_id: str


# ============================================================
# MANAGER TEAM MEMBERS
# ============================================================

@router.get("/team-members")
async def get_team_members(
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
):
    """
    Return Campaign Persons assigned to
    the currently logged-in Campaign Manager.
    """

    if (
        current_user.role
        != Role.CAMPAIGN_MANAGER
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "Only Campaign Managers "
                "can access team members."
            ),
        )

    if not current_user.manager_id:
        return {
            "manager_id": None,
            "total": 0,
            "members": [],
        }

    result = await db.execute(
        select(User)
        .where(
            User.role
            == Role.COMMS_TEAM,
            User.manager_id
            == current_user.manager_id,
        )
        .order_by(
            User.name.asc(),
            User.email.asc(),
        )
    )

    members = result.scalars().all()

    return {
        "manager_id":
            current_user.manager_id,

        "total":
            len(members),

        "members": [
            {
                "id": str(
                    member.id
                ),

                "name":
                    member.name,

                "email":
                    member.email,

                "phone":
                    member.phone,

                "role":
                    member.role.value,

                "is_active":
                    member.is_active,

                "registration_date": (
                    member.registration_date.isoformat()
                    if member.registration_date
                    else None
                ),

                "manager_id":
                    member.manager_id,
            }
            for member in members
        ],
    }


# ============================================================
# ADMIN: LIST USERS
# ============================================================

@router.get("")
async def list_users(
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
):
    """
    Return users for administration.
    """

    if (
        current_user.role
        != Role.ADMIN
    ):
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    result = await db.execute(
        select(User)
        .order_by(
            User.name.asc(),
            User.email.asc(),
        )
    )

    users = result.scalars().all()

    return {
        "total": len(users),

        "users": [
            {
                "id": str(
                    user.id
                ),
                "name":
                    user.name,
                "email":
                    user.email,
                "phone":
                    user.phone,
                "role":
                    user.role.value,
                "is_active":
                    user.is_active,
                "admin_id":
                    user.admin_id,
                "department":
                    user.department,
                "access_level":
                    user.access_level,
                "manager_id":
                    user.manager_id,
                "assigned_region":
                    user.assigned_region,
                "shift_timing":
                    user.shift_timing,
                "registration_date": (
                    user.registration_date.isoformat()
                    if user.registration_date
                    else None
                ),
            }
            for user in users
        ],
    }


# ============================================================
# ADMIN: ASSIGN CAMPAIGN PERSON TO MANAGER
# ============================================================

@router.put(
    "/{user_id}/assign-manager"
)
async def assign_manager(
    user_id: UUID,
    payload: AssignManagerRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
):
    """
    Assign a Campaign Person to a
    Campaign Manager.

    Admin only.
    """

    if (
        current_user.role
        != Role.ADMIN
    ):
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    # --------------------------------------------------------
    # Find Campaign Person
    # --------------------------------------------------------

    user = await db.get(
        User,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if (
        user.role
        != Role.COMMS_TEAM
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only Campaign Persons "
                "can be assigned to a manager."
            ),
        )

    # --------------------------------------------------------
    # Find Manager by manager_id
    # --------------------------------------------------------

    result = await db.execute(
        select(User)
        .where(
            User.role
            == Role.CAMPAIGN_MANAGER,
            User.manager_id
            == payload.manager_id.strip(),
        )
    )

    manager = (
        result.scalar_one_or_none()
    )

    if manager is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Campaign Manager with "
                f"manager_id '{payload.manager_id}' "
                "was not found."
            ),
        )

    # --------------------------------------------------------
    # Assign
    # --------------------------------------------------------

    user.manager_id = (
        payload.manager_id.strip()
    )

    await db.commit()

    await db.refresh(
        user
    )

    return {
        "message":
            "Campaign Person assigned successfully.",

        "user": {
            "id":
                str(user.id),

            "name":
                user.name,

            "email":
                user.email,

            "role":
                user.role.value,

            "manager_id":
                user.manager_id,

            "is_active":
                user.is_active,
        },

        "manager": {
            "id":
                str(manager.id),

            "name":
                manager.name,

            "email":
                manager.email,

            "manager_id":
                manager.manager_id,
        },
    }


# ============================================================
# ADMIN: UNASSIGN CAMPAIGN PERSON
# ============================================================

@router.delete(
    "/{user_id}/assign-manager"
)
async def remove_manager_assignment(
    user_id: UUID,
    current_user: User = Depends(
        get_current_user
    ),
    db: AsyncSession = Depends(
        get_db
    ),
):
    """
    Remove a Campaign Person's manager assignment.

    Admin only.
    """

    if (
        current_user.role
        != Role.ADMIN
    ):
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    user = await db.get(
        User,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if (
        user.role
        != Role.COMMS_TEAM
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only Campaign Persons "
                "can have manager assignments."
            ),
        )

    user.manager_id = None

    await db.commit()

    await db.refresh(
        user
    )

    return {
        "message":
            "Manager assignment removed.",
        "user": {
            "id":
                str(user.id),
            "name":
                user.name,
            "email":
                user.email,
            "role":
                user.role.value,
            "manager_id":
                user.manager_id,
        },
    }
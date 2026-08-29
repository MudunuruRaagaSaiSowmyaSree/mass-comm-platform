import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.rbac import require_role
from app.database import get_db
from app.models.organization import Organization
from app.models.user import Role, User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationOut,
    OrganizationTree,
    OrganizationUpdate,
)


router = APIRouter(
    prefix="/organizations",
    tags=["organizations"],
)


# ============================================================
# CREATE ORGANIZATION
# ============================================================

@router.post(
    "/",
    response_model=OrganizationOut,
)
async def create_organization(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(Role.ADMIN)
    ),
):
    # --------------------------------------------------------
    # Validate parent organization
    # --------------------------------------------------------

    if data.parent_id is not None:

        parent = await db.get(
            Organization,
            data.parent_id,
        )

        if parent is None:
            raise HTTPException(
                status_code=404,
                detail="Parent organization not found.",
            )

    # --------------------------------------------------------
    # Create organization
    # --------------------------------------------------------

    organization = Organization(
        name=data.name.strip(),
        parent_id=data.parent_id,
    )

    db.add(organization)

    await db.commit()
    await db.refresh(organization)

    return organization


# ============================================================
# LIST ALL ORGANIZATIONS
# ============================================================

@router.get(
    "/",
    response_model=list[OrganizationOut],
)
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    result = await db.execute(
        select(Organization)
        .order_by(Organization.name)
    )

    return result.scalars().all()


# ============================================================
# GET SINGLE ORGANIZATION
# ============================================================

@router.get(
    "/{organization_id}",
    response_model=OrganizationOut,
)
async def get_organization(
    organization_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    organization = await db.get(
        Organization,
        organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=404,
            detail="Organization not found.",
        )

    return organization


# ============================================================
# UPDATE ORGANIZATION
# ============================================================

@router.put(
    "/{organization_id}",
    response_model=OrganizationOut,
)
async def update_organization(
    organization_id: uuid.UUID,
    data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(Role.ADMIN)
    ),
):
    organization = await db.get(
        Organization,
        organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=404,
            detail="Organization not found.",
        )

    # --------------------------------------------------------
    # Prevent organization from being its own parent
    # --------------------------------------------------------

    if data.parent_id == organization_id:
        raise HTTPException(
            status_code=400,
            detail="An organization cannot be its own parent.",
        )

    # --------------------------------------------------------
    # Validate parent
    # --------------------------------------------------------

    if data.parent_id is not None:

        parent = await db.get(
            Organization,
            data.parent_id,
        )

        if parent is None:
            raise HTTPException(
                status_code=404,
                detail="Parent organization not found.",
            )

        # ----------------------------------------------------
        # Prevent circular hierarchy
        # ----------------------------------------------------

        current_parent_id = parent.parent_id

        while current_parent_id is not None:

            if current_parent_id == organization_id:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Invalid hierarchy. "
                        "This change would create "
                        "a circular organization structure."
                    ),
                )

            current_parent = await db.get(
                Organization,
                current_parent_id,
            )

            if current_parent is None:
                break

            current_parent_id = (
                current_parent.parent_id
            )

    # --------------------------------------------------------
    # Apply changes
    # --------------------------------------------------------

    if data.name is not None:
        organization.name = data.name.strip()

    organization.parent_id = data.parent_id

    await db.commit()
    await db.refresh(organization)

    return organization


# ============================================================
# DELETE ORGANIZATION
# ============================================================

@router.delete(
    "/{organization_id}",
)
async def delete_organization(
    organization_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_role(Role.ADMIN)
    ),
):
    organization = await db.get(
        Organization,
        organization_id,
    )

    if organization is None:
        raise HTTPException(
            status_code=404,
            detail="Organization not found.",
        )

    # --------------------------------------------------------
    # Check child organizations
    # --------------------------------------------------------

    result = await db.execute(
        select(Organization).where(
            Organization.parent_id
            == organization_id
        )
    )

    children = result.scalars().all()

    if children:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete this organization "
                "because it has child organizations. "
                "Move or delete the children first."
            ),
        )

    await db.delete(organization)

    await db.commit()

    return {
        "detail": "Organization deleted successfully."
    }


# ============================================================
# ORGANIZATION TREE
# ============================================================

@router.get(
    "/tree/all",
    response_model=list[OrganizationTree],
)
async def get_organization_tree(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return organizations as a hierarchical tree.

    Example:

    State
      ├── District A
      │     ├── Department 1
      │     └── Department 2
      │
      └── District B
    """

    result = await db.execute(
        select(Organization)
        .order_by(Organization.name)
    )

    organizations = result.scalars().all()

    # --------------------------------------------------------
    # Create lookup table
    # --------------------------------------------------------

    children_map: dict[
        uuid.UUID | None,
        list[Organization]
    ] = {}

    for organization in organizations:

        children_map.setdefault(
            organization.parent_id,
            [],
        ).append(organization)

    # --------------------------------------------------------
    # Build recursive tree
    # --------------------------------------------------------

    def build_tree(
        parent_id: uuid.UUID | None,
    ) -> list[OrganizationTree]:

        children = children_map.get(
            parent_id,
            [],
        )

        return [
            OrganizationTree(
                id=organization.id,
                name=organization.name,
                parent_id=organization.parent_id,
                children=build_tree(
                    organization.id
                ),
            )
            for organization in children
        ]

    return build_tree(None)
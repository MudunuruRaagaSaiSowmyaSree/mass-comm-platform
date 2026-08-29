import uuid

from pydantic import BaseModel, ConfigDict, Field


class OrganizationCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=255,
    )

    parent_id: uuid.UUID | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    parent_id: uuid.UUID | None = None


class OrganizationOut(BaseModel):
    id: uuid.UUID

    name: str

    parent_id: uuid.UUID | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrganizationTree(OrganizationOut):
    children: list["OrganizationTree"] = []
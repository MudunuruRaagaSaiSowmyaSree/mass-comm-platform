from pydantic import BaseModel, Field


class UpdateProfileRequest(BaseModel):
    """
    Request model for updating the currently logged-in user's profile.
    """

    # Basic profile information
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    # Admin information
    department: str | None = Field(
        default=None,
        max_length=100,
    )

    access_level: str | None = Field(
        default=None,
        max_length=100,
    )

    # Campaign Manager information
    assigned_region: str | None = Field(
        default=None,
        max_length=100,
    )

    shift_timing: str | None = Field(
        default=None,
        max_length=100,
    )
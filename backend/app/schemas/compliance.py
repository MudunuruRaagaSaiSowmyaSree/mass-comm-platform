from pydantic import BaseModel, Field


class ComplianceRequest(BaseModel):
    message: str = Field(..., min_length=1)
    language: str = "en"


class ComplianceResponse(BaseModel):
    compliant: bool
    score: int
    issues: list[str]
    suggestions: list[str]
    message: str
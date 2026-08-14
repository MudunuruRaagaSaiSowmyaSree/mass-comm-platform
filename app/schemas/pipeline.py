from pydantic import BaseModel, Field


class PipelineRequest(BaseModel):
    title: str
    campaign_type: str
    brief: str
    audience: str = "general public"
    languages: list[str] = Field(
        default=["en", "te", "hi", "bn"]
    )


class PipelineResponse(BaseModel):
    title: str
    campaign_type: str
    original_content: str
    translations: dict[str, str]
    compliance: dict
    status: str
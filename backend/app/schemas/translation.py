from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    content: str = Field(..., min_length=1)
    source_language: str = "en"
    target_languages: list[str] = ["te", "hi", "bn"]


class TranslationResponse(BaseModel):
    source_language: str
    original_content: str
    translations: dict[str, str]
from pydantic import BaseModel


class GenerateContentRequest(BaseModel):
    campaign_type: str
    brief: str
    language: str = "en"
    audience: str = "general_public"


class GenerateContentResponse(BaseModel):
    campaign_type: str
    language: str
    audience: str
    brief: str
    draft: str


class ToneCheckRequest(BaseModel):
    message: str
    audience: str = "general_public"


class ToneCheckResponse(BaseModel):
    appropriate: bool
    tone: str
    issues: list[str]
    suggestion: str

class TranslationRequest(BaseModel):
    message: str
    source_language: str = "en"
    target_language: str


class TranslationResponse(BaseModel):
    source_language: str
    target_language: str
    original_message: str
    translated_message: str
    fallback: bool = False

class TranslationRequest(BaseModel):
    message: str
    source_language: str = "en"
    target_language: str


class TranslationResponse(BaseModel):
    source_language: str
    target_language: str
    original_message: str
    translated_message: str
    fallback: bool = False
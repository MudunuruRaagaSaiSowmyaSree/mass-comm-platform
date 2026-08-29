from fastapi import APIRouter, HTTPException

from app.schemas.content import (
    GenerateContentRequest,
    GenerateContentResponse,
    ToneCheckRequest,
    ToneCheckResponse,
)

from app.llm.gemini import (
    generate_content,
    check_tone,
)


router = APIRouter(
    prefix="/generate-content",
    tags=["AI Content Generation"],
)


@router.post(
    "/",
    response_model=GenerateContentResponse,
)
async def generate_campaign_content(
    data: GenerateContentRequest,
):

    try:
        draft = generate_content(
            campaign_type=data.campaign_type,
            brief=data.brief,
            language=data.language,
            audience=data.audience,
        )

        return GenerateContentResponse(
            campaign_type=data.campaign_type,
            language=data.language,
            audience=data.audience,
            brief=data.brief,
            draft=draft,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Content generation failed: {str(e)}",
        )


@router.post(
    "/tone-check",
    response_model=ToneCheckResponse,
)
async def tone_check(
    data: ToneCheckRequest,
):

    try:
        result = check_tone(
            message=data.message,
            audience=data.audience,
        )

        return ToneCheckResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Tone check failed: {str(e)}",
        )
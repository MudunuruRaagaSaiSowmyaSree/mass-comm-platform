from fastapi import APIRouter, HTTPException

from app.schemas.review import (
    ReviewRequest,
    ReviewResponse,
)

from app.schemas.content import (
    TranslationRequest,
    TranslationResponse,
)

from app.llm.gemini import translate_content


router = APIRouter(
    prefix="/review",
    tags=["Human Review"],
)


@router.post(
    "/",
    response_model=ReviewResponse,
)
async def review_content(
    data: ReviewRequest,
):
    action = data.action.lower().strip()

    if action not in ["approve", "reject", "edit"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be approve, reject, or edit",
        )

    if action == "approve":
        return ReviewResponse(
            status="approved",
            message="Content approved successfully",
            final_message=data.draft,
            reviewer_comment=data.reviewer_comment,
        )

    if action == "reject":
        return ReviewResponse(
            status="rejected",
            message="Content rejected",
            final_message=None,
            reviewer_comment=data.reviewer_comment,
        )

    if not data.edited_message:
        raise HTTPException(
            status_code=400,
            detail="edited_message is required when action is edit",
        )

    return ReviewResponse(
        status="edited",
        message="Content edited successfully",
        final_message=data.edited_message,
        reviewer_comment=data.reviewer_comment,
    )


@router.post(
    "/translate",
    response_model=TranslationResponse,
)
async def translate_message(
    data: TranslationRequest,
):
    supported_languages = {
        "en",
        "te",
        "hi",
        "bn",
    }

    source_language = data.source_language.lower().strip()
    target_language = data.target_language.lower().strip()

    if source_language not in supported_languages:
        raise HTTPException(
            status_code=400,
            detail="Unsupported source language. Use en, te, hi, or bn.",
        )

    if target_language not in supported_languages:
        raise HTTPException(
            status_code=400,
            detail="Unsupported target language. Use en, te, hi, or bn.",
        )

    try:
        translated = translate_content(
            message=data.message,
            source_language=source_language,
            target_language=target_language,
        )

        return TranslationResponse(
            source_language=source_language,
            target_language=target_language,
            original_message=data.message,
            translated_message=translated,
            fallback=False,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}",
        )
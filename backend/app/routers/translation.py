from fastapi import APIRouter, HTTPException

from app.schemas.translation import (
    TranslationRequest,
    TranslationResponse,
)

from app.llm.gemini import translate_content


router = APIRouter(
    prefix="/translations",
    tags=["Translations"],
)


@router.post(
    "/",
    response_model=TranslationResponse,
)
async def translate_campaign_content(
    data: TranslationRequest,
):
    """
    Translate user-provided content into one or more
    requested target languages using Gemini AI.
    """

    try:
        source_language = (
            data.source_language
            .lower()
            .strip()
        )

        content = data.content.strip()

        # --------------------------------------------------------
        # VALIDATION
        # --------------------------------------------------------

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Translation content cannot be empty.",
            )

        if not data.target_languages:
            raise HTTPException(
                status_code=400,
                detail="At least one target language is required.",
            )

        # --------------------------------------------------------
        # SUPPORTED LANGUAGES
        # --------------------------------------------------------

        supported_languages = {
            "en": "English",
            "te": "Telugu",
            "hi": "Hindi",
            "bn": "Bengali",
        }

        if source_language not in supported_languages:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported source language: "
                    f"{source_language}. "
                    f"Supported languages: "
                    f"{', '.join(supported_languages.keys())}"
                ),
            )

        # --------------------------------------------------------
        # TRANSLATIONS
        # --------------------------------------------------------

        translations: dict[str, str] = {}

        # Keep original content for source language
        translations[source_language] = content

        for target_language in data.target_languages:

            target_language = (
                target_language
                .lower()
                .strip()
            )

            # Ignore invalid target languages
            if target_language not in supported_languages:
                continue

            # Do not translate into the same language
            if target_language == source_language:
                translations[target_language] = content
                continue

            translated_text = translate_content(
                message=content,
                source_language=source_language,
                target_language=target_language,
            )

            translations[target_language] = (
                translated_text.strip()
            )

        # --------------------------------------------------------
        # RESPONSE
        # --------------------------------------------------------

        return TranslationResponse(
            source_language=source_language,
            original_content=content,
            translations=translations,
        )

    except HTTPException:
        raise

    except Exception as exc:
        print(
            "Translation error:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Translation failed: "
                f"{str(exc)}"
            ),
        )
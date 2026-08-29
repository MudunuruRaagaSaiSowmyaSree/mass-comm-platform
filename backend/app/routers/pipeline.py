import json

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.pipeline import (
    PipelineRequest,
    PipelineResponse,
)
from app.llm.gemini import generate_answer


router = APIRouter(
    prefix="/pipeline",
    tags=["pipeline"],
)


SUPPORTED_LANGUAGES = {
    "en": "English",
    "te": "Telugu",
    "hi": "Hindi",
    "bn": "Bengali",
}


def clean_response(text: str) -> str:
    text = text.strip()

    if text.startswith("```"):
        lines = text.splitlines()

        if lines:
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines)

    return text.strip()


def generate_campaign_content(
    brief: str,
    campaign_type: str,
    audience: str,
) -> str:

    prompt = f"""
You are an AI public communication assistant.

Create a clear, professional campaign message.

Campaign type:
{campaign_type}

Target audience:
{audience}

Campaign brief:
{brief}

Requirements:
- Be clear and factual.
- Use a professional public communication tone.
- Do not invent facts or statistics.
- Do not use offensive language.
- Keep the message concise.
- Return only the final campaign message.
"""

    return clean_response(
        generate_answer(prompt)
    )


def translate_campaign_content(
    content: str,
    language_code: str,
) -> str:

    language = SUPPORTED_LANGUAGES[language_code]

    prompt = f"""
Translate the following public communication
message into {language}.

Requirements:
- Preserve the original meaning.
- Do not add information.
- Keep a professional tone.
- Keep numbers and names unchanged where appropriate.
- Return only the translated message.

Message:

{content}
"""

    return clean_response(
        generate_answer(prompt)
    )


def compliance_check(
    content: str,
) -> dict:

    prompt = f"""
You are a professional communication compliance checker.

Check this public communication message:

{content}

Check for:
1. Offensive language
2. Discriminatory language
3. Threatening language
4. Excessively aggressive language
5. Unprofessional language
6. Misleading or unsupported claims
7. Unclear communication

Return ONLY valid JSON in exactly this format:

{{
    "compliant": true,
    "score": 95,
    "issues": [],
    "suggestions": []
}}

Scoring:
80-100 = compliant
60-79 = needs improvement
0-59 = not compliant
"""

    result = clean_response(
        generate_answer(prompt)
    )

    try:
        return json.loads(result)

    except json.JSONDecodeError:
        return {
            "compliant": False,
            "score": 0,
            "issues": [
                "Compliance AI returned invalid JSON."
            ],
            "suggestions": [
                "Run the compliance check again."
            ],
        }


@router.post(
    "/run",
    response_model=PipelineResponse,
)
async def run_pipeline(
    data: PipelineRequest,
    current_user: User = Depends(
        get_current_user
    ),
):

    # -----------------------------------------
    # STEP 1: Validate languages
    # -----------------------------------------

    for language in data.languages:

        if language not in SUPPORTED_LANGUAGES:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported language: {language}. "
                    f"Supported languages: "
                    f"{list(SUPPORTED_LANGUAGES.keys())}"
                ),
            )

    # -----------------------------------------
    # STEP 2: Generate English content
    # -----------------------------------------

    try:

        original_content = generate_campaign_content(
            brief=data.brief,
            campaign_type=data.campaign_type,
            audience=data.audience,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Content generation failed: {str(e)}",
        )

    # -----------------------------------------
    # STEP 3: Translate
    # -----------------------------------------

    translations = {}

    try:

        for language in data.languages:

            if language == "en":

                translations["en"] = original_content

            else:

                translations[language] = (
                    translate_campaign_content(
                        original_content,
                        language,
                    )
                )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(e)}",
        )

    # -----------------------------------------
    # STEP 4: Compliance
    # -----------------------------------------

    try:

        compliance = compliance_check(
            original_content
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Compliance check failed: {str(e)}",
        )

    # -----------------------------------------
    # STEP 5: Decide final status
    # -----------------------------------------

    score = int(
        compliance.get("score", 0)
    )

    if (
        compliance.get("compliant") is True
        and score >= 80
    ):

        status = "ready"

    else:

        status = "review_required"

    # -----------------------------------------
    # STEP 6: Return pipeline result
    # -----------------------------------------

    return PipelineResponse(
        title=data.title,
        campaign_type=data.campaign_type,
        original_content=original_content,
        translations=translations,
        compliance=compliance,
        status=status,
    )
import json

from fastapi import APIRouter, HTTPException

from app.schemas.compliance import (
    ComplianceRequest,
    ComplianceResponse,
)
from app.llm.gemini import generate_answer


router = APIRouter(
    prefix="/compliance",
    tags=["compliance"],
)


@router.post(
    "/check",
    response_model=ComplianceResponse,
)
async def check_compliance(
    data: ComplianceRequest,
):
    prompt = f"""
You are a professional communication compliance checker.

Review the following public communication message.

Language: {data.language}

Message:
{data.message}

Check the message for:

1. Offensive or discriminatory language
2. Threatening or harmful language
3. Excessively aggressive language
4. Unprofessional language
5. Unsupported or misleading claims
6. Unclear or confusing communication
7. Missing important information
8. Inappropriate tone for public communication

Give the message a compliance score from 0 to 100.

Rules:
- 80-100 = compliant
- 60-79 = needs improvement
- below 60 = not compliant

Return ONLY valid JSON in exactly this format:

{{
    "compliant": true,
    "score": 95,
    "issues": [],
    "suggestions": [],
    "message": "Message is suitable for public communication."
}}

Do not use markdown.
Do not use ```json.
Return JSON only.
"""

    try:
        # generate_answer() is a normal synchronous function
        result = generate_answer(prompt)

        result = result.strip()

        # Remove accidental markdown code fences
        if result.startswith("```json"):
            result = result[7:]

        elif result.startswith("```"):
            result = result[3:]

        if result.endswith("```"):
            result = result[:-3]

        result = result.strip()

        parsed = json.loads(result)

        return ComplianceResponse(
            compliant=bool(
                parsed.get("compliant", False)
            ),
            score=int(
                parsed.get("score", 0)
            ),
            issues=parsed.get(
                "issues",
                []
            ),
            suggestions=parsed.get(
                "suggestions",
                []
            ),
            message=parsed.get(
                "message",
                "Compliance check completed.",
            ),
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="AI returned an invalid compliance response.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Compliance check failed: {str(e)}",
        )
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    CampaignGenerateRequest,
    CampaignGenerateResponse,
    ToneCheckRequest,
    ToneCheckResponse,
)

from app.models.chat_history import (
    ChatHistory,
)

from app.rag.pipeline import (
    run_rag_pipeline,
)

from app.llm.gemini import (
    generate_content,
    check_tone,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


# ============================================================
# SAVE CHAT HISTORY
# ============================================================

async def save_chat_history(
    db: AsyncSession,
    user_id,
    question: str,
    answer: str,
    language: str,
):
    if not user_id:
        return

    history = ChatHistory(
        user_id=user_id,
        session_id=None,
        message=question,
        response=answer,
        language=language,
    )

    db.add(history)

    await db.commit()


# ============================================================
# AI CHAT / RAG
# ============================================================

@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    # --------------------------------------------------------
    # Clean question
    # --------------------------------------------------------

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    # --------------------------------------------------------
    # Language
    # --------------------------------------------------------

    language = request.language

    # --------------------------------------------------------
    # Run async RAG pipeline
    # --------------------------------------------------------

    result = await run_rag_pipeline(
        question=question,
        language=language,
    )

    # --------------------------------------------------------
    # Save conversation history
    # --------------------------------------------------------

    await save_chat_history(
        db=db,
        user_id=request.user_id,
        question=question,
        answer=result["answer"],
        language=language,
    )

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return ChatResponse(
        question=result["question"],
        domain=result["domain"],
        answer=result["answer"],
        sources=result["sources"],
        confidence_score=result["confidence_score"],
        confidence_status=result["confidence_status"],
        needs_human=result["needs_human"],
        quality_reason=result["quality_reason"],
        human_escalation=result["human_escalation"],
    )


# ============================================================
# AI CAMPAIGN CONTENT GENERATION
# ============================================================

@router.post(
    "/generate-campaign",
    response_model=CampaignGenerateResponse,
)
async def generate_campaign_content(
    request: CampaignGenerateRequest,
):

    try:

        content = generate_content(
            campaign_type=request.campaign_type,
            brief=request.topic,
            language=request.language,
            audience=request.audience or "general_public",
        )

    except RuntimeError as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"AI content generation failed: "
                f"{str(exc)}"
            ),
        )

    return CampaignGenerateResponse(
        topic=request.topic,
        campaign_type=request.campaign_type,
        language=request.language,
        audience=request.audience,
        tone=request.tone,
        content=content,
    )


# ============================================================
# AI TONE CHECK
# ============================================================

@router.post(
    "/tone-check",
    response_model=ToneCheckResponse,
)
async def tone_check(
    request: ToneCheckRequest,
):

    try:

        result = check_tone(
            message=request.message,
            audience=request.audience,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                f"AI tone analysis failed: "
                f"{str(exc)}"
            ),
        )

    return ToneCheckResponse(
        message=request.message,
        audience=request.audience,
        appropriate=result.get(
            "appropriate",
            False,
        ),
        tone=result.get(
            "tone",
            "",
        ),
        issues=result.get(
            "issues",
            [],
        ),
        suggestion=result.get(
            "suggestion",
            "",
        ),
    )

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.ai import ChatRequest, ChatResponse
from app.models.chat_history import ChatHistory
from app.rag.pipeline import run_rag_pipeline


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


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


@router.post(
    "/chat",
    response_model=ChatResponse,
)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    # Clean the user's question
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    # Language is already validated by ChatRequest.
    # Supported values:
    # en = English
    # hi = Hindi
    # te = Telugu
    # bn = Bengali
    language = request.language

    # Run the complete RAG pipeline
    result = run_rag_pipeline(
        question=question,
        language=language,
    )

    # Save conversation history when a user ID is available
    await save_chat_history(
        db=db,
        user_id=request.user_id,
        question=question,
        answer=result["answer"],
        language=language,
    )

    # Return the RAG result to the frontend
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
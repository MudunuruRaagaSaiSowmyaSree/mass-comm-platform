from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_history import ChatHistory
from app.rag.search import retrieve_context
from app.llm.gemini import generate_answer


router = APIRouter(
    prefix="/chat",
    tags=["RAG Chat"],
)


@router.get("/")
async def chat(
    user_id: UUID,
    query: str,
    language: str = "en",
    db: AsyncSession = Depends(get_db),
):
    # --------------------------------------------------
    # Get previous conversation for this user
    # --------------------------------------------------

    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.asc())
    )

    previous_messages = result.scalars().all()

    history = []

    for item in previous_messages:
        history.append(
            {
                "user": item.message,
                "bot": item.response,
            }
        )

    # --------------------------------------------------
    # Retrieve information from knowledge base
    # --------------------------------------------------

    context, sources = retrieve_context(query)

    # --------------------------------------------------
    # Generate answer
    # --------------------------------------------------

    if not context.strip():
        answer = (
            "Sorry, I couldn't find relevant information "
            "in the available information."
        )
    else:
        answer = generate_answer(
            question=query,
            context=context,
            language=language,
            history=history,
        )

    # --------------------------------------------------
    # Save conversation
    # --------------------------------------------------

    chat_record = ChatHistory(
        user_id=user_id,
        message=query,
        response=answer,
    )

    db.add(chat_record)

    await db.commit()
    await db.refresh(chat_record)

    # --------------------------------------------------
    # Return response
    # --------------------------------------------------

    return {
        "user_id": str(user_id),
        "query": query,
        "language": language,
        "answer": answer,
        "sources": sources,
    }


@router.get("/history")
async def chat_history(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.asc())
    )

    history = result.scalars().all()

    return {
        "user_id": str(user_id),
        "history": [
            {
                "id": str(item.id),
                "message": item.message,
                "response": item.response,
                "created_at": item.created_at,
            }
            for item in history
        ],
    }
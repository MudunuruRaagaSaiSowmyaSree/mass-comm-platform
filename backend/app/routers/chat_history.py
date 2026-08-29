from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_history import ChatHistory


router = APIRouter(
    prefix="/chat-history",
    tags=["Chat History"],
)


# ============================================================
# GET CHAT HISTORY BY USER ID
# ============================================================

@router.get("/")
async def get_chat_history(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatHistory)
        .where(
            ChatHistory.user_id == user_id
        )
        .order_by(
            ChatHistory.created_at.desc()
        )
    )

    history = result.scalars().all()

    return {
        "user_id": str(user_id),
        "history": [
            {
                "id": str(item.id),
                "message": item.message,
                "response": item.response,
                "language": item.language,
                "created_at": item.created_at.isoformat(),
            }
            for item in history
        ],
    }


# ============================================================
# GET CHAT HISTORY BY SESSION ID
#
# Used by WhatsApp.
#
# For WhatsApp:
#
#     session_id = sender phone number
#
# Example:
#
#     917013039501
#
# ============================================================

@router.get("/session")
async def get_session_chat_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    session_id = session_id.strip()

    if not session_id:
        return {
            "session_id": "",
            "history": [],
        }

    result = await db.execute(
        select(ChatHistory)
        .where(
            ChatHistory.session_id == session_id
        )
        .order_by(
            ChatHistory.created_at.desc()
        )
        .limit(10)
    )

    history = result.scalars().all()

    return {
        "session_id": session_id,
        "history": [
            {
                "id": str(item.id),
                "message": item.message,
                "response": item.response,
                "language": item.language,
                "created_at": item.created_at.isoformat(),
            }
            for item in reversed(history)
        ],
    }

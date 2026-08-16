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


@router.get("/")
async def get_chat_history(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.desc())
    )

    history = result.scalars().all()

    return {
        "user_id": str(user_id),
        "history": [
            {
                "id": str(item.id),
                "message": item.message,
                "response": item.response,
                "created_at": item.created_at.isoformat(),
            }
            for item in history
        ],
    }
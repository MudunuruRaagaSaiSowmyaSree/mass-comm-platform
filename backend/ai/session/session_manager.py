from uuid import UUID

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.chat_history import ChatHistory


class SessionManager:

    async def get_history(self, session_id: str) -> list:

        async with AsyncSessionLocal() as db:

            result = await db.execute(
                select(ChatHistory)
                .where(
                    ChatHistory.session_id == session_id
                )
                .order_by(
                    ChatHistory.created_at.asc()
                )
            )

            records = result.scalars().all()

            history = []

            for record in records:
                history.append({
                    "user": record.message,
                    "bot": record.response,
                    "language": record.language,
                })

            return history

    async def add_interaction(
        self,
        session_id: str,
        user_text: str,
        bot_text: str,
        detected_lang: str,
        user_id: UUID,
    ):

        async with AsyncSessionLocal() as db:

            chat = ChatHistory(
                session_id=session_id,
                message=user_text,
                response=bot_text,
                language=detected_lang,
                user_id=user_id,
            )

            db.add(chat)

            await db.commit()
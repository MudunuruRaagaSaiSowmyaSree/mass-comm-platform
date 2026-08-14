from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ChatHistoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    response: str
    created_at: datetime
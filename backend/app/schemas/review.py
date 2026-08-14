from pydantic import BaseModel


class ReviewRequest(BaseModel):
    draft: str
    action: str
    edited_message: str | None = None
    reviewer_comment: str | None = None


class ReviewResponse(BaseModel):
    status: str
    message: str
    final_message: str | None = None
    reviewer_comment: str | None = None
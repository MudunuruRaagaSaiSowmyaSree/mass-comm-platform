from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.chat_history import ChatHistory
from app.models.campaign import Campaign
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
    # Retrieve user's campaigns
    # --------------------------------------------------

    campaign_result = await db.execute(
        select(Campaign)
        .where(Campaign.created_by == user_id)
        .order_by(Campaign.created_at.desc())
    )

    campaigns = campaign_result.scalars().all()

    # --------------------------------------------------
    # Add campaign information to AI context
    # --------------------------------------------------

    if campaigns:
        campaign_context = """
    
CURRENT USER CAMPAIGNS
The following campaigns belong to the current user.
Use this information when the user asks about campaigns,
the latest campaign, recent campaigns, campaign status,
scheduled campaigns, or campaign content.

The campaigns are ordered from newest to oldest by creation date.

"""

        for campaign in campaigns:
            campaign_context += (
                f"Campaign Title: {campaign.title}\n"
                f"Campaign Type: {campaign.type.value}\n"
                f"Campaign Status: {campaign.status.value}\n"
                f"Created At: {campaign.created_at}\n"
                f"Scheduled At: {campaign.scheduled_at}\n"
                f"Content: {campaign.content or 'No content'}\n"
                "---\n"
            )

        context += campaign_context
        sources.append("User campaigns")

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
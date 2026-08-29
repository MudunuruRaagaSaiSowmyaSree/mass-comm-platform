from datetime import datetime, timedelta
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy import (
    select,
    func,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.database import get_db

from app.models.feedback import (
    Feedback,
    FeedbackSource,
    SentimentType,
)

from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
)

from app.services.sentiment_analysis import (
    analyze_sentiment,
)


router = APIRouter(
    prefix="/feedback",
    tags=["Feedback & Sentiment"],
)


# ============================================================
# CREATE FEEDBACK
# ============================================================

@router.post(
    "",
    response_model=FeedbackResponse,
)
async def create_feedback(
    payload: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Store feedback and automatically analyze sentiment.
    """

    sentiment_result = analyze_sentiment(
        payload.message
    )

    feedback = Feedback(
        campaign_id=payload.campaign_id,
        audience_member_id=(
            payload.audience_member_id
        ),
        source=FeedbackSource(
            payload.source.value
        ),
        channel=payload.channel,
        message=payload.message,
        language=payload.language,
        geography=payload.geography,
        sentiment=SentimentType(
            sentiment_result.sentiment
        ),
        sentiment_score=(
            sentiment_result.score
        ),
        analysis_metadata=(
            sentiment_result.to_dict()
        ),
    )

    db.add(
        feedback
    )

    await db.commit()

    await db.refresh(
        feedback
    )

    return feedback


# ============================================================
# LIST FEEDBACK
# ============================================================

@router.get(
    "",
    response_model=list[FeedbackResponse],
)
async def list_feedback(
    campaign_id: UUID | None = None,
    channel: str | None = None,
    language: str | None = None,
    geography: str | None = None,
    sentiment: SentimentType | None = None,
    source: FeedbackSource | None = None,
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Return feedback with optional filters.

    Supports dashboard drill-down by:

        campaign
        channel
        language
        geography
        sentiment
        source
    """

    query = select(
        Feedback
    )

    # --------------------------------------------------------
    # Filters
    # --------------------------------------------------------

    if campaign_id is not None:

        query = query.where(
            Feedback.campaign_id
            == campaign_id
        )

    if channel:

        query = query.where(
            Feedback.channel
            == channel.strip().lower()
        )

    if language:

        query = query.where(
            Feedback.language
            == language.strip().lower()
        )

    if geography:

        query = query.where(
            Feedback.geography
            == geography
        )

    if sentiment:

        query = query.where(
            Feedback.sentiment
            == sentiment
        )

    if source:

        query = query.where(
            Feedback.source
            == source
        )

    query = (
        query
        .order_by(
            Feedback.created_at.desc()
        )
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(
        query
    )

    return result.scalars().all()


# ============================================================
# SINGLE FEEDBACK
# ============================================================

@router.get(
    "/{feedback_id}",
    response_model=FeedbackResponse,
)
async def get_feedback(
    feedback_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Feedback).where(
            Feedback.id
            == feedback_id
        )
    )

    feedback = (
        result.scalar_one_or_none()
    )

    if feedback is None:

        raise HTTPException(
            status_code=404,
            detail="Feedback not found.",
        )

    return feedback


# ============================================================
# SENTIMENT SUMMARY
# ============================================================

@router.get(
    "/analytics/summary",
)
async def get_sentiment_summary(
    campaign_id: UUID | None = None,
    channel: str | None = None,
    language: str | None = None,
    geography: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Return positive / neutral / negative
    sentiment totals and percentages.
    """

    query = select(
        Feedback.sentiment,
        func.count(
            Feedback.id
        ).label("count"),
    ).group_by(
        Feedback.sentiment
    )

    if campaign_id is not None:

        query = query.where(
            Feedback.campaign_id
            == campaign_id
        )

    if channel:

        query = query.where(
            Feedback.channel
            == channel.strip().lower()
        )

    if language:

        query = query.where(
            Feedback.language
            == language.strip().lower()
        )

    if geography:

        query = query.where(
            Feedback.geography
            == geography
        )

    result = await db.execute(
        query
    )

    rows = result.all()

    positive = 0
    neutral = 0
    negative = 0

    for sentiment, count in rows:

        if sentiment == SentimentType.POSITIVE:

            positive = count

        elif sentiment == SentimentType.NEUTRAL:

            neutral = count

        elif sentiment == SentimentType.NEGATIVE:

            negative = count

    total = (
        positive
        + neutral
        + negative
    )

    def percentage(
        value: int,
    ) -> float:

        if total == 0:

            return 0.0

        return round(
            (value / total) * 100,
            2,
        )

    return {
        "total_feedback": total,
        "positive": positive,
        "neutral": neutral,
        "negative": negative,
        "positive_percentage": percentage(
            positive
        ),
        "neutral_percentage": percentage(
            neutral
        ),
        "negative_percentage": percentage(
            negative
        ),
    }


# ============================================================
# DASHBOARD OVERVIEW
# ============================================================

@router.get(
    "/analytics/dashboard",
)
async def get_feedback_dashboard(
    campaign_id: UUID | None = None,
    channel: str | None = None,
    language: str | None = None,
    geography: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete Module 4 dashboard data.

    Includes:

        total feedback
        sentiment distribution
        channel breakdown
        language breakdown
        geography breakdown
    """

    base_filters = []

    if campaign_id is not None:

        base_filters.append(
            Feedback.campaign_id
            == campaign_id
        )

    if channel:

        base_filters.append(
            Feedback.channel
            == channel.strip().lower()
        )

    if language:

        base_filters.append(
            Feedback.language
            == language.strip().lower()
        )

    if geography:

        base_filters.append(
            Feedback.geography
            == geography
        )

    # --------------------------------------------------------
    # Total
    # --------------------------------------------------------

    total_query = select(
        func.count(
            Feedback.id
        )
    )

    if base_filters:

        total_query = total_query.where(
            *base_filters
        )

    total_result = await db.execute(
        total_query
    )

    total_feedback = (
        total_result.scalar()
        or 0
    )

    # --------------------------------------------------------
    # Sentiment
    # --------------------------------------------------------

    sentiment_query = select(
        Feedback.sentiment,
        func.count(
            Feedback.id
        ).label("count"),
    ).group_by(
        Feedback.sentiment
    )

    if base_filters:

        sentiment_query = (
            sentiment_query.where(
                *base_filters
            )
        )

    sentiment_result = await db.execute(
        sentiment_query
    )

    sentiment_rows = (
        sentiment_result.all()
    )

    positive = 0
    neutral = 0
    negative = 0

    for sentiment, count in sentiment_rows:

        if sentiment == SentimentType.POSITIVE:
            positive = count

        elif sentiment == SentimentType.NEUTRAL:
            neutral = count

        elif sentiment == SentimentType.NEGATIVE:
            negative = count

    # --------------------------------------------------------
    # Channel breakdown
    # --------------------------------------------------------

    channel_query = select(
        Feedback.channel,
        func.count(
            Feedback.id
        ).label("count"),
    ).group_by(
        Feedback.channel
    )

    if base_filters:

        channel_query = (
            channel_query.where(
                *base_filters
            )
        )

    channel_result = await db.execute(
        channel_query
    )

    channel_rows = (
        channel_result.all()
    )

    channel_breakdown = [
        {
            "channel": channel_name,
            "count": count,
        }
        for channel_name, count
        in channel_rows
    ]

    # --------------------------------------------------------
    # Language breakdown
    # --------------------------------------------------------

    language_query = select(
        Feedback.language,
        func.count(
            Feedback.id
        ).label("count"),
    ).group_by(
        Feedback.language
    )

    if base_filters:

        language_query = (
            language_query.where(
                *base_filters
            )
        )

    language_result = await db.execute(
        language_query
    )

    language_rows = (
        language_result.all()
    )

    language_breakdown = [
        {
            "language": language_name,
            "count": count,
        }
        for language_name, count
        in language_rows
    ]

    # --------------------------------------------------------
    # Geography breakdown
    # --------------------------------------------------------

    geography_query = select(
        Feedback.geography,
        func.count(
            Feedback.id
        ).label("count"),
    ).group_by(
        Feedback.geography
    )

    if base_filters:

        geography_query = (
            geography_query.where(
                *base_filters
            )
        )

    geography_result = await db.execute(
        geography_query
    )

    geography_rows = (
        geography_result.all()
    )

    geography_breakdown = [
        {
            "geography": geography_name,
            "count": count,
        }
        for geography_name, count
        in geography_rows
    ]

    # --------------------------------------------------------
    # Percentages
    # --------------------------------------------------------

    def percentage(
        value: int,
    ) -> float:

        if total_feedback == 0:

            return 0.0

        return round(
            (value / total_feedback) * 100,
            2,
        )

    return {
        "total_feedback": total_feedback,

        "sentiment": {
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
            "positive_percentage": percentage(
                positive
            ),
            "neutral_percentage": percentage(
                neutral
            ),
            "negative_percentage": percentage(
                negative
            ),
        },

        "breakdowns": {
            "channel": channel_breakdown,
            "language": language_breakdown,
            "geography": geography_breakdown,
        },
    }


# ============================================================
# ENGAGEMENT TREND
# ============================================================

@router.get(
    "/analytics/trend",
)
async def get_feedback_trend(
    campaign_id: UUID | None = None,
    days: int = Query(
        default=7,
        ge=1,
        le=90,
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Return daily feedback/sentiment trend.

    Used by the Module 4 dashboard engagement trend chart.
    """

    start_date = (
        datetime.utcnow()
        - timedelta(days=days - 1)
    )

    query = select(
        Feedback
    ).where(
        Feedback.created_at
        >= start_date
    )

    if campaign_id is not None:

        query = query.where(
            Feedback.campaign_id
            == campaign_id
        )

    query = query.order_by(
        Feedback.created_at.asc()
    )

    result = await db.execute(
        query
    )

    feedback_rows = (
        result.scalars().all()
    )

    trend = {}

    # --------------------------------------------------------
    # Initialize dates
    # --------------------------------------------------------

    for index in range(days):

        current_date = (
            start_date
            + timedelta(days=index)
        ).date()

        key = current_date.isoformat()

        trend[key] = {
            "date": key,
            "feedback_count": 0,
            "positive": 0,
            "neutral": 0,
            "negative": 0,
        }

    # --------------------------------------------------------
    # Populate
    # --------------------------------------------------------

    for feedback in feedback_rows:

        key = (
            feedback.created_at
            .date()
            .isoformat()
        )

        if key not in trend:

            continue

        trend[key][
            "feedback_count"
        ] += 1

        if (
            feedback.sentiment
            == SentimentType.POSITIVE
        ):

            trend[key][
                "positive"
            ] += 1

        elif (
            feedback.sentiment
            == SentimentType.NEUTRAL
        ):

            trend[key][
                "neutral"
            ] += 1

        elif (
            feedback.sentiment
            == SentimentType.NEGATIVE
        ):

            trend[key][
                "negative"
            ] += 1

    return {
        "days": days,
        "trend": list(
            trend.values()
        ),
    }
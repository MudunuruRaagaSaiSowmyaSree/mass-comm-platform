from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.ext.asyncio import (
    AsyncSession,
)

from app.database import get_db

from app.services.analytics import (
    get_campaign_analytics,
    get_global_analytics,
)

from app.schemas.analytics import (
    CampaignAnalytics,
    AnalyticsSummary,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ============================================================
# GLOBAL ANALYTICS
# ============================================================

@router.get(
    "/summary",
    response_model=AnalyticsSummary,
)
async def analytics_summary(
    db: AsyncSession = Depends(get_db),
):
    """
    Return overall platform analytics.
    """

    try:

        result = await get_global_analytics(
            db=db,
        )

        return result

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


# ============================================================
# CAMPAIGN ANALYTICS
# ============================================================

@router.get(
    "/campaign/{campaign_id}",
    response_model=CampaignAnalytics,
)
async def campaign_analytics(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Return analytics for a specific campaign.
    """

    try:

        result = await get_campaign_analytics(
            campaign_id=campaign_id,
            db=db,
        )

        return result

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
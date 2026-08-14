from fastapi import APIRouter, HTTPException

from app.services.mandi import get_mandi_prices


router = APIRouter(
    prefix="/mandi",
    tags=["Mandi"]
)


@router.get("/price")
async def mandi_price(
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
    commodity: str | None = None,
    limit: int = 10,
):
    """
    Get current mandi prices.
    """

    try:

        data = get_mandi_prices(
            state=state,
            district=district,
            market=market,
            commodity=commodity,
            limit=limit,
        )

        return data

    except Exception as error:

        raise HTTPException(
            status_code=502,
            detail=f"Mandi API error: {str(error)}"
        )
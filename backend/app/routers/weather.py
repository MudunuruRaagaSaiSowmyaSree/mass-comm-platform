from fastapi import APIRouter, HTTPException

from app.services.weather import get_current_weather


router = APIRouter(
    prefix="/weather",
    tags=["Weather"]
)


@router.get("/current")
async def current_weather(city: str):

    city = city.strip()

    if not city:
        raise HTTPException(
            status_code=400,
            detail="City is required."
        )

    weather = await get_current_weather(city)

    if not weather["success"]:
        raise HTTPException(
            status_code=502,
            detail=weather["error"]
        )

    return weather
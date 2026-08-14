import os
import httpx


WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")

WEATHER_API_URL = (
    "https://api.openweathermap.org/data/2.5/weather"
)


async def get_current_weather(city: str):

    if not WEATHER_API_KEY:
        return {
            "success": False,
            "error": "WEATHER_API_KEY is not configured."
        }

    params = {
        "q": city,
        "appid": WEATHER_API_KEY,
        "units": "metric",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:

            response = await client.get(
                WEATHER_API_URL,
                params=params,
            )

            response.raise_for_status()

            data = response.json()

        return {
            "success": True,
            "city": data.get("name"),

            "temperature": data.get(
                "main",
                {}
            ).get("temp"),

            "humidity": data.get(
                "main",
                {}
            ).get("humidity"),

            "weather": (
                data.get("weather", [{}])[0]
                .get("description")
            ),

            "wind_speed": data.get(
                "wind",
                {}
            ).get("speed"),
        }

    except httpx.HTTPStatusError as error:

        return {
            "success": False,
            "error": (
                f"Weather API returned "
                f"status {error.response.status_code}"
            )
        }

    except Exception as error:

        return {
            "success": False,
            "error": str(error)
        }
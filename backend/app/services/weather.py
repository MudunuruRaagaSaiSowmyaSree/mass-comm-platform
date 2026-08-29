from datetime import datetime


# ============================================================
# DUMMY WEATHER DATA
# ============================================================

DUMMY_WEATHER_DATA = {
    "hyderabad": {
        "city": "Hyderabad",
        "temperature": 28,
        "humidity": 65,
        "weather": "partly cloudy",
        "wind_speed": 12,
    },

    "vijayawada": {
        "city": "Vijayawada",
        "temperature": 30,
        "humidity": 70,
        "weather": "sunny",
        "wind_speed": 10,
    },

    "visakhapatnam": {
        "city": "Visakhapatnam",
        "temperature": 29,
        "humidity": 75,
        "weather": "cloudy",
        "wind_speed": 14,
    },

    "tirupati": {
        "city": "Tirupati",
        "temperature": 27,
        "humidity": 68,
        "weather": "partly cloudy",
        "wind_speed": 9,
    },

    "warangal": {
        "city": "Warangal",
        "temperature": 29,
        "humidity": 62,
        "weather": "sunny",
        "wind_speed": 11,
    },
}


# ============================================================
# GET CURRENT WEATHER
# ============================================================

async def get_current_weather(city: str):

    city = city.strip().lower()

    if not city:
        return {
            "success": False,
            "error": "City is required.",
        }

    weather = DUMMY_WEATHER_DATA.get(city)

    if not weather:
        return {
            "success": False,
            "error": (
                f"No dummy weather data available for "
                f"'{city}'. Available cities: "
                f"{', '.join(DUMMY_WEATHER_DATA.keys())}"
            ),
        }

    return {
        "success": True,
        "city": weather["city"],
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "weather": weather["weather"],
        "wind_speed": weather["wind_speed"],
        "source": "dummy_data",
        "date": datetime.now().strftime("%Y-%m-%d"),
    }

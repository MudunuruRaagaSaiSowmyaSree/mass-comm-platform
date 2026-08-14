import requests

from app.core.config import settings


MANDI_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"

MANDI_API_URL = (
    f"https://api.data.gov.in/resource/{MANDI_RESOURCE_ID}"
)


def get_mandi_prices(
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
    commodity: str | None = None,
    limit: int = 10,
):
    """
    Fetch current mandi prices from data.gov.in.
    """

    if not settings.MANDI_API_KEY:
        raise RuntimeError(
            "MANDI_API_KEY is not configured."
        )

    limit = max(1, min(limit, 100))

    params = {
        "api-key": settings.MANDI_API_KEY,
        "format": "json",
        "limit": limit,
    }

    if state:
        params["filters[state]"] = state

    if district:
        params["filters[district]"] = district

    if market:
        params["filters[market]"] = market

    if commodity:
        params["filters[commodity]"] = commodity

    try:
        response = requests.get(
            MANDI_API_URL,
            params=params,
            timeout=(10, 20),
        )

        response.raise_for_status()

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "source": "data.gov.in",
            "message": (
                "The live Mandi service is currently "
                "not responding. Please try again later."
            ),
            "records": [],
        }

    except requests.exceptions.RequestException as error:
        return {
            "success": False,
            "source": "data.gov.in",
            "message": f"Mandi service unavailable: {error}",
            "records": [],
        }

    try:
        data = response.json()

    except ValueError:
        return {
            "success": False,
            "source": "data.gov.in",
            "message": "Mandi API returned an invalid response.",
            "records": [],
        }

    return {
        "success": True,
        "source": "data.gov.in",
        "message": "Mandi prices retrieved successfully.",
        "records": data.get("records", []),
        "total": data.get("total", 0),
    }
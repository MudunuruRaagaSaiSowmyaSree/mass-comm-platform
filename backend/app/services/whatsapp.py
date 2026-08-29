import os

import httpx
from dotenv import load_dotenv


load_dotenv()


WHATSAPP_ACCESS_TOKEN = os.getenv(
    "WHATSAPP_ACCESS_TOKEN",
    "",
)

WHATSAPP_PHONE_NUMBER_ID = os.getenv(
    "WHATSAPP_PHONE_NUMBER_ID",
    "",
)

WHATSAPP_API_VERSION = os.getenv(
    "WHATSAPP_API_VERSION",
    "v23.0",
)


# ============================================================
# SEND WHATSAPP MESSAGE
# ============================================================

async def send_whatsapp_message(
    to: str,
    message: str,
) -> dict:
    """
    Send a text message through the WhatsApp Cloud API.

    Returns the complete Meta API response.

    Important:
        Meta returns the WhatsApp provider message ID
        inside:

            messages[0].id

        That ID should be stored in
        MessageDelivery.provider_message_id
        so that later webhook status events can be matched.
    """

    # --------------------------------------------------------
    # VALIDATE CONFIGURATION
    # --------------------------------------------------------

    if not WHATSAPP_ACCESS_TOKEN:

        raise RuntimeError(
            "WHATSAPP_ACCESS_TOKEN is not configured."
        )

    if not WHATSAPP_PHONE_NUMBER_ID:

        raise RuntimeError(
            "WHATSAPP_PHONE_NUMBER_ID is not configured."
        )

    # --------------------------------------------------------
    # VALIDATE INPUT
    # --------------------------------------------------------

    to = str(to or "").strip()

    message = str(message or "").strip()

    if not to:

        raise ValueError(
            "WhatsApp recipient phone number is empty."
        )

    if not message:

        raise ValueError(
            "WhatsApp message is empty."
        )

    # --------------------------------------------------------
    # API URL
    # --------------------------------------------------------

    url = (
        f"https://graph.facebook.com/"
        f"{WHATSAPP_API_VERSION}/"
        f"{WHATSAPP_PHONE_NUMBER_ID}/messages"
    )

    # --------------------------------------------------------
    # HEADERS
    # --------------------------------------------------------

    headers = {
        "Authorization": (
            f"Bearer {WHATSAPP_ACCESS_TOKEN}"
        ),
        "Content-Type": "application/json",
    }

    # --------------------------------------------------------
    # PAYLOAD
    # --------------------------------------------------------

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message,
        },
    }

    # --------------------------------------------------------
    # SEND REQUEST
    # --------------------------------------------------------

    try:

        async with httpx.AsyncClient(
            timeout=30.0
        ) as client:

            response = await client.post(
                url,
                headers=headers,
                json=payload,
            )

    except httpx.RequestError as exc:

        raise RuntimeError(
            "Could not connect to WhatsApp Cloud API: "
            f"{exc}"
        ) from exc

    # --------------------------------------------------------
    # HANDLE HTTP ERROR
    # --------------------------------------------------------

    if response.is_error:

        raise RuntimeError(
            "WhatsApp API error "
            f"{response.status_code}: "
            f"{response.text}"
        )

    # --------------------------------------------------------
    # PARSE RESPONSE
    # --------------------------------------------------------

    try:

        response_data = response.json()

    except ValueError as exc:

        raise RuntimeError(
            "WhatsApp API returned invalid JSON: "
            f"{response.text}"
        ) from exc

    # --------------------------------------------------------
    # VALIDATE META RESPONSE
    # --------------------------------------------------------

    messages = response_data.get(
        "messages",
        [],
    )

    if not messages:

        raise RuntimeError(
            "WhatsApp API response does not contain "
            "a message ID."
        )

    provider_message_id = (
        messages[0].get(
            "id"
        )
    )

    if not provider_message_id:

        raise RuntimeError(
            "WhatsApp API response contains no "
            "provider message ID."
        )

    # --------------------------------------------------------
    # LOG SUCCESS
    # --------------------------------------------------------

    print()
    print("=" * 60)

    print(
        "WhatsApp message sent successfully."
    )

    print(
        f"Recipient: {to}"
    )

    print(
        f"Provider message ID: "
        f"{provider_message_id}"
    )

    print("=" * 60)

    return response_data
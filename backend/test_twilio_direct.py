import asyncio
import httpx
import os

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

TO_NUMBER = "917013039501"

async def main():

    url = (
        f"https://api.twilio.com/2010-04-01/"
        f"Accounts/{ACCOUNT_SID}/Messages.json"
    )

    data = {
        "To": TO_NUMBER,
        "From": FROM_NUMBER,
        "Body": "MassComm direct Twilio SMS test."
    }

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.post(
            url,
            data=data,
            auth=(ACCOUNT_SID, AUTH_TOKEN),
        )

    print()
    print("=" * 70)
    print("DIRECT TWILIO SMS TEST")
    print("=" * 70)
    print("HTTP STATUS:", response.status_code)
    print("RESPONSE:")
    print(response.text)
    print("=" * 70)
    print()

asyncio.run(main())

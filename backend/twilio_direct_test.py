import asyncio
import httpx

ACCOUNT_SID = "YOUR_ACCOUNT_SID"
AUTH_TOKEN = "YOUR_AUTH_TOKEN"
FROM_NUMBER = "+17372212163"
TO_NUMBER = "+917013039501"


async def main():

    url = (
        "https://api.twilio.com/2010-04-01/"
        f"Accounts/{ACCOUNT_SID}/Messages.json"
    )

    data = {
        "To": TO_NUMBER,
        "From": FROM_NUMBER,
        "Body": "Mass Communication Platform Twilio test",
    }

    async with httpx.AsyncClient(timeout=30) as client:

        response = await client.post(
            url,
            data=data,
            auth=(ACCOUNT_SID, AUTH_TOKEN),
        )

    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)


asyncio.run(main())

import asyncio
import httpx
from urllib.parse import quote

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.channel_config import ChannelConfig


async def main():

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(ChannelConfig).where(
                ChannelConfig.channel == "sms"
            )
        )

        item = result.scalar_one_or_none()

        if item is None:
            print("SMS CONFIG NOT FOUND")
            return

        config = item.config or {}

        account_sid = config.get("account_sid")
        auth_token = config.get("auth_token")
        from_number = config.get("from_number")

        print("ACCOUNT SID:", account_sid)
        print("FROM NUMBER:", from_number)
        print("AUTH TOKEN:", "configured" if auth_token else "MISSING")

        if not account_sid or not auth_token or not from_number:
            print("Twilio configuration incomplete.")
            return

        url = (
            "https://api.twilio.com/2010-04-01/"
            f"Accounts/{quote(account_sid, safe='')}/"
            "Messages.json"
        )

        data = {
            "To": "+917013039501",
            "From": from_number,
            "Body": "Mass Communication Platform direct Twilio test",
        }

        async with httpx.AsyncClient(timeout=30) as client:

            response = await client.post(
                url,
                data=data,
                auth=(account_sid, auth_token),
            )

        print()
        print("STATUS:", response.status_code)
        print("RESPONSE:", response.text)


asyncio.run(main())

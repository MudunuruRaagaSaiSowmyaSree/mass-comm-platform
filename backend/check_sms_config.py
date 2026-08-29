import asyncio

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

        print("CHANNEL:", item.channel)
        print("ENABLED:", item.enabled)
        print("PROVIDER:", config.get("provider"))
        print("ACCOUNT SID:", config.get("account_sid"))
        print("FROM NUMBER:", config.get("from_number"))
        print(
            "AUTH TOKEN:",
            "configured" if config.get("auth_token") else "MISSING"
        )


asyncio.run(main())

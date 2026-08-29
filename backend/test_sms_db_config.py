import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.channel_config import ChannelConfig
from app.services.channel_dispatcher import send_channel_message


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

        print("SMS CONFIGURATION")
        print("=" * 60)
        print("Provider:", config.get("provider"))
        print("From:", config.get("from_number"))
        print(
            "Auth token:",
            "configured" if config.get("auth_token") else "MISSING",
        )
        print("=" * 60)

        result = await send_channel_message(
            channel="sms",
            recipient="+917013039501",
            message="Mass Communication Platform Twilio trial test",
            config=config,
        )

        print()
        print("RESULT")
        print("=" * 60)
        print(result)
        print("=" * 60)


asyncio.run(main())

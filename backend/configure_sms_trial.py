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

        config["provider"] = "twilio"
        config["trial"] = True
        config["trial_template"] = "sms_internal_alerts"

        item.config = config

        await db.commit()

        print("SMS TWILIO TRIAL CONFIG UPDATED")
        print("PROVIDER:", config.get("provider"))
        print("TRIAL:", config.get("trial"))
        print(
            "TRIAL TEMPLATE:",
            config.get("trial_template"),
        )


asyncio.run(main())

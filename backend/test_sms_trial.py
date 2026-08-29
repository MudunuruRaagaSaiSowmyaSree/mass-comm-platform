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

        print("Provider:", item.config.get("provider"))
        print("Trial:", item.config.get("trial"))
        print(
            "Trial template:",
            item.config.get("trial_template"),
        )

        result = await send_channel_message(
            channel="sms",
            recipient="+917013039501",
            message=(
                "This application message will "
                "be replaced by the Twilio trial "
                "template while the account is in trial."
            ),
            config=item.config,
        )

        print()
        print("RESULT:")
        print(result)


asyncio.run(main())

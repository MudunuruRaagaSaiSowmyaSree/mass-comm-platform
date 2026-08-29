import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.channel_config import ChannelConfig

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ChannelConfig)
        )

        configs = result.scalars().all()

        print(f"TOTAL CHANNEL CONFIGS = {len(configs)}")

        for c in configs:
            print("--------------------------------------------------")
            print("ID      =", c.id)
            print("Channel =", c.channel)
            print("Enabled =", c.enabled)
            print("Config  =", c.config)

asyncio.run(main())

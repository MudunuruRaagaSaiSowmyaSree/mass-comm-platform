import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.campaign import Campaign

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Campaign).order_by(Campaign.created_at.desc())
        )

        campaigns = result.scalars().all()

        if not campaigns:
            print("NO CAMPAIGNS FOUND")
            return

        for campaign in campaigns:
            print(
                "ID:", campaign.id,
                "| TITLE:", campaign.title,
                "| STATUS:", campaign.status.value,
                "| TYPE:", campaign.type.value,
            )

asyncio.run(main())

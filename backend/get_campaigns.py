import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.campaign import Campaign


async def main():
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(Campaign)
            .limit(10)
        )

        campaigns = result.scalars().all()

        print()
        print("=" * 80)
        print("CAMPAIGNS")
        print("=" * 80)

        for campaign in campaigns:
            print(f"Campaign ID: {campaign.id}")
            print(f"Name: {campaign.name}")
            print(f"Status: {campaign.status}")
            print("-" * 80)


if __name__ == "__main__":
    asyncio.run(main())
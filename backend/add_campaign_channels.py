import asyncio

from sqlalchemy import text

from app.database import engine


async def add_campaign_channels():
    async with engine.begin() as conn:

        # Check whether the column already exists
        result = await conn.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'campaigns'
                  AND column_name = 'channels'
                """
            )
        )

        column_exists = result.scalar_one_or_none()

        if column_exists:
            print("channels column already exists.")
            return

        # Add the missing column
        await conn.execute(
            text(
                """
                ALTER TABLE campaigns
                ADD COLUMN channels JSON NOT NULL
                DEFAULT '["email"]'
                """
            )
        )

        print(
            "Successfully added campaigns.channels column."
        )


if __name__ == "__main__":
    asyncio.run(add_campaign_channels())
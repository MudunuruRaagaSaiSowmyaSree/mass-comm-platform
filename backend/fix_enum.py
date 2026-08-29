import asyncio

from sqlalchemy import text
from app.database import engine


async def fix_recipient_status_enum():
    async with engine.begin() as conn:
        print("Connected to PostgreSQL.")

        await conn.execute(
            text(
                """
                ALTER TYPE recipientstatus
                ADD VALUE IF NOT EXISTS 'pending';
                """
            )
        )

        await conn.execute(
            text(
                """
                ALTER TYPE recipientstatus
                ADD VALUE IF NOT EXISTS 'sent';
                """
            )
        )

        await conn.execute(
            text(
                """
                ALTER TYPE recipientstatus
                ADD VALUE IF NOT EXISTS 'failed';
                """
            )
        )

        result = await conn.execute(
            text(
                """
                SELECT enumlabel
                FROM pg_enum
                WHERE enumtypid = 'recipientstatus'::regtype
                ORDER BY enumsortorder;
                """
            )
        )

        values = [row[0] for row in result]

        print("recipientstatus values:")
        for value in values:
            print(f"  - {value}")

        print("Enum fix completed successfully.")


if __name__ == "__main__":
    asyncio.run(fix_recipient_status_enum())
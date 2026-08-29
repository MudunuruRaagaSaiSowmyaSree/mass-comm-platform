import asyncio

from sqlalchemy import text

from app.database import engine


async def main():
    async with engine.begin() as conn:
        print("Connected to PostgreSQL.")

        # Add provider column if it does not already exist
        await conn.execute(
            text("""
                ALTER TABLE message_deliveries
                ADD COLUMN IF NOT EXISTS provider VARCHAR;
            """)
        )

        # Add index if it does not already exist
        await conn.execute(
            text("""
                CREATE INDEX IF NOT EXISTS ix_message_deliveries_provider
                ON message_deliveries(provider);
            """)
        )

        print("message_deliveries.provider column fixed successfully.")


if __name__ == "__main__":
    asyncio.run(main())
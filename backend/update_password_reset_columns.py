import asyncio

from sqlalchemy import text

from app.database import engine


async def update_database():
    async with engine.begin() as conn:

        await conn.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR UNIQUE
                """
            )
        )

        await conn.execute(
            text(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP
                """
            )
        )

    print("===================================")
    print("DATABASE UPDATED SUCCESSFULLY")
    print("===================================")
    print("Added:")
    print("- password_reset_token")
    print("- password_reset_expires")
    print("===================================")


if __name__ == "__main__":
    asyncio.run(update_database())
import asyncio

from app.database import Base, engine

# Import models so SQLAlchemy registers all tables.
from app import models  # noqa: F401


async def main():
    print()
    print("=" * 60)
    print("Initializing Mass Communication Platform database")
    print("=" * 60)

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all
        )

    print()
    print("Database tables initialized successfully.")
    print("=" * 60)
    print()


if __name__ == "__main__":
    asyncio.run(main())
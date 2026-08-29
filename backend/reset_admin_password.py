import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash

NEW_PASSWORD = "Admin@12345"

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                User.email == "admin@example.com"
            )
        )

        user = result.scalar_one_or_none()

        if user is None:
            print("ERROR: admin@example.com not found")
            return

        user.hashed_password = get_password_hash(NEW_PASSWORD)
        user.is_active = True

        await db.commit()

        print("SUCCESS: Admin password has been reset.")
        print("Email: admin@example.com")
        print("Password: Admin@12345")

asyncio.run(main())

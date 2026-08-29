import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User, Role
from app.core.security import get_password_hash


ADMIN_NAME = "System Administrator"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "Admin@12345"


async def create_admin():

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(User).where(User.email == ADMIN_EMAIL)
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("===================================")
            print("User already exists!")
            print(f"Email: {existing_user.email}")
            print(f"Role: {existing_user.role}")
            print(f"Active: {existing_user.is_active}")
            print("===================================")
            return

        admin = User(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            hashed_password=get_password_hash(ADMIN_PASSWORD),
            role=Role.ADMIN,
            is_active=True,
        )

        db.add(admin)

        await db.commit()
        await db.refresh(admin)

        print("===================================")
        print("ADMIN CREATED SUCCESSFULLY")
        print("===================================")
        print(f"Email: {ADMIN_EMAIL}")
        print(f"Password: {ADMIN_PASSWORD}")
        print(f"Role: {admin.role}")
        print(f"ID: {admin.id}")
        print("===================================")


if __name__ == "__main__":
    asyncio.run(create_admin())
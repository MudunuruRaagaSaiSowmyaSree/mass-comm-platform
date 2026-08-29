import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User.id, User.name, User.email, User.role, User.is_active)
        )

        for row in result.all():
            print(
                f"ID={row.id} | "
                f"Name={row.name} | "
                f"Email={row.email} | "
                f"Role={row.role} | "
                f"Active={row.is_active}"
            )

asyncio.run(main())

import asyncio
from sqlalchemy import select
from app.database import get_db
from app.models.user import User

async def main():
    gen = get_db()
    db = await anext(gen)
    try:
        result = await db.execute(select(User))
        users = result.scalars().all()

        for user in users:
            print(
                f"EMAIL={user.email} | "
                f"NAME={user.name} | "
                f"ROLE={user.role.value} | "
                f"ACTIVE={user.is_active}"
            )
    finally:
        await gen.aclose()

asyncio.run(main())

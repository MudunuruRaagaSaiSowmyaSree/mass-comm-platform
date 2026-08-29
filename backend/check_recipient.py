import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.audience import AudienceMember

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AudienceMember).where(
                AudienceMember.email == "mrs3@yopmail.com"
            )
        )

        member = result.scalar_one_or_none()

        if member:
            print("ID:", member.id)
            print("NAME:", member.name)
            print("EMAIL:", member.email)
            print("LANGUAGE:", member.language)
            print("GEOGRAPHY:", member.geography)
        else:
            print("NOT FOUND")

asyncio.run(main())

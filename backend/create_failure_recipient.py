import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.audience import AudienceMember

EMAIL = "this-address-does-not-exist-123456789@example.invalid"

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AudienceMember).where(
                AudienceMember.email == EMAIL
            )
        )

        member = result.scalar_one_or_none()

        if member:
            print("ALREADY EXISTS")
            print("ID:", member.id)
            print("EMAIL:", member.email)
            return

        member = AudienceMember(
            name="Email Failure Test",
            email=EMAIL,
            phone=None,
            language="English",
            geography="Test",
            occupation=None,
            engagement_score=0.0,
        )

        db.add(member)
        await db.commit()
        await db.refresh(member)

        print("CREATED")
        print("ID:", member.id)
        print("EMAIL:", member.email)

asyncio.run(main())

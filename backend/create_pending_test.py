import asyncio
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.audience import AudienceMember
from app.models.campaign_recipient import CampaignRecipient, RecipientStatus

CAMPAIGN_ID = uuid.UUID("00f4da07-e509-4c16-bad5-a4d6439946df")

async def main():
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(AudienceMember).where(
                AudienceMember.email == "mrs3@yopmail.com"
            )
        )

        member = result.scalar_one()

        recipient = CampaignRecipient(
            campaign_id=CAMPAIGN_ID,
            audience_member_id=member.id,
            status=RecipientStatus.PENDING,
        )

        db.add(recipient)
        await db.commit()
        await db.refresh(recipient)

        print("NEW RECIPIENT CREATED")
        print("RECIPIENT ID:", recipient.id)
        print("EMAIL:", member.email)
        print("STATUS:", recipient.status.value)

asyncio.run(main())

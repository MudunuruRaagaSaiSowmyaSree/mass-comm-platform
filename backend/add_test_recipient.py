import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.campaign_recipient import CampaignRecipient, RecipientStatus
from app.models.audience import AudienceMember

CAMPAIGN_ID = uuid.UUID("00f4da07-e509-4c16-bad5-a4d6439946df")
AUDIENCE_ID = uuid.UUID("23c93225-8b1d-4fc8-8bea-c74ef160ba20")

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CampaignRecipient).where(
                CampaignRecipient.campaign_id == CAMPAIGN_ID,
                CampaignRecipient.audience_member_id == AUDIENCE_ID,
            )
        )

        recipient = result.scalar_one_or_none()

        if recipient:
            print("ALREADY EXISTS")
            print("RECIPIENT ID:", recipient.id)
            print("STATUS:", recipient.status.value)
            return

        recipient = CampaignRecipient(
            campaign_id=CAMPAIGN_ID,
            audience_member_id=AUDIENCE_ID,
            status=RecipientStatus.PENDING,
        )

        db.add(recipient)
        await db.commit()
        await db.refresh(recipient)

        print("RECIPIENT CREATED")
        print("RECIPIENT ID:", recipient.id)
        print("STATUS:", recipient.status.value)

asyncio.run(main())

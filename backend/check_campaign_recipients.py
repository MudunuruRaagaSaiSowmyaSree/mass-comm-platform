import asyncio
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.campaign_recipient import CampaignRecipient
from app.models.audience import AudienceMember

CAMPAIGN_ID = uuid.UUID("00f4da07-e509-4c16-bad5-a4d6439946df")

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CampaignRecipient, AudienceMember)
            .join(
                AudienceMember,
                CampaignRecipient.audience_member_id == AudienceMember.id
            )
            .where(
                CampaignRecipient.campaign_id == CAMPAIGN_ID
            )
        )

        rows = result.all()

        if not rows:
            print("NO RECIPIENTS FOUND")
            return

        for recipient, member in rows:
            print(
                "RECIPIENT:",
                recipient.id,
                "| EMAIL:",
                member.email,
                "| STATUS:",
                recipient.status.value,
            )

asyncio.run(main())

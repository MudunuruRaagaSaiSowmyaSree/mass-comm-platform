import asyncio
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.campaign_recipient import CampaignRecipient
from app.models.message_delivery import MessageDelivery

RECIPIENT_ID = uuid.UUID("23a6e1a1-5e5e-42ea-8f5a-b732f8e33edf")

async def main():
    async with AsyncSessionLocal() as db:
        r = await db.execute(
            select(CampaignRecipient).where(
                CampaignRecipient.id == RECIPIENT_ID
            )
        )
        recipient = r.scalar_one_or_none()

        d = await db.execute(
            select(MessageDelivery)
            .where(
                MessageDelivery.recipient_id == RECIPIENT_ID
            )
            .order_by(MessageDelivery.sent_at.desc())
        )
        delivery = d.scalars().first()

        print("RECIPIENT STATUS:", recipient.status.value if recipient else "NOT FOUND")
        print("CONTACTED AT:", recipient.contacted_at if recipient else None)
        print("DELIVERY STATUS:", delivery.status.value if delivery else "NOT FOUND")
        print("PROVIDER ID:", delivery.provider_message_id if delivery else None)
        print("ERROR:", delivery.error_message if delivery else None)

asyncio.run(main())

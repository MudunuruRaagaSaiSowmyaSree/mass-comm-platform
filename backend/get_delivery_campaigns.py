import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.message_delivery import MessageDelivery
from app.models.campaign_recipient import CampaignRecipient

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(MessageDelivery).limit(30)
        )

        deliveries = result.scalars().all()

        print("=" * 80)
        print("DELIVERY -> CAMPAIGN")
        print("=" * 80)

        for delivery in deliveries:
            recipient_result = await db.execute(
                select(CampaignRecipient).where(
                    CampaignRecipient.id == delivery.recipient_id
                )
            )

            recipient = recipient_result.scalar_one_or_none()

            if recipient:
                print(
                    f"Delivery: {delivery.id}"
                )
                print(
                    f"Campaign: {recipient.campaign_id}"
                )
                print(
                    f"Status: {delivery.status}"
                )
                print(
                    f"Channel: {delivery.channel}"
                )
                print("-" * 80)

asyncio.run(main())

import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.message_delivery import MessageDelivery

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(MessageDelivery)
            .order_by(MessageDelivery.sent_at.desc())
        )

        deliveries = result.scalars().all()

        print(f"TOTAL DELIVERIES = {len(deliveries)}")

        for d in deliveries:
            print("-" * 70)
            print("ID           =", d.id)
            print("Recipient    =", d.recipient_id)
            print("Channel      =", d.channel)
            print("Status       =", d.status)
            print("Provider     =", d.provider)
            print("Provider ID  =", d.provider_message_id)
            print("Error        =", d.error_message)
            print("Sent At      =", d.sent_at)
            print("Delivered At =", d.delivered_at)
            print("Failed At    =", d.failed_at)
            print("Retry Count  =", d.retry_count)

asyncio.run(main())

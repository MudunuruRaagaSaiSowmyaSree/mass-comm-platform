import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.message_delivery import MessageDelivery


async def main():
    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(MessageDelivery)
            .limit(10)
        )

        deliveries = result.scalars().all()

        if not deliveries:
            print("No message deliveries found.")
            return

        print()
        print("=" * 80)
        print("MESSAGE DELIVERIES")
        print("=" * 80)

        for delivery in deliveries:
            print()
            print(f"Delivery ID: {delivery.id}")
            print(f"Status: {delivery.status}")
            print(f"Channel: {delivery.channel}")
            print(
                f"Provider Message ID: "
                f"{delivery.provider_message_id}"
            )
            print(
                f"Provider: "
                f"{delivery.provider}"
            )
            print("-" * 80)


if __name__ == "__main__":
    asyncio.run(main())
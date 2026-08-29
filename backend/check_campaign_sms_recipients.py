import asyncio
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.campaign_recipient import CampaignRecipient
from app.models.audience import AudienceMember

CAMPAIGN_ID = uuid.UUID(
    "00f4da07-e509-4c16-bad5-a4d6439946df"
)

async def main():

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(
                CampaignRecipient,
                AudienceMember
            )
            .join(
                AudienceMember,
                CampaignRecipient.audience_member_id
                == AudienceMember.id
            )
            .where(
                CampaignRecipient.campaign_id
                == CAMPAIGN_ID
            )
        )

        rows = result.all()

        if not rows:
            print("NO RECIPIENTS FOUND")
            return

        print()
        print("=" * 70)
        print("CAMPAIGN SMS RECIPIENTS")
        print("=" * 70)

        for recipient, member in rows:

            print(
                "RECIPIENT ID:",
                recipient.id
            )

            print(
                "AUDIENCE MEMBER ID:",
                member.id
            )

            print(
                "NAME:",
                getattr(member, "name", None)
            )

            print(
                "EMAIL:",
                member.email
            )

            print(
                "PHONE:",
                member.phone
            )

            print(
                "STATUS:",
                recipient.status.value
            )

            print("-" * 70)


asyncio.run(main())

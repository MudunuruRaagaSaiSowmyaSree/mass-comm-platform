import asyncio
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User, Role
from app.models.campaign import (
    Campaign,
    CampaignStatus,
    CampaignType,
)


CAMPAIGN_PERSON_EMAIL = "test@example.com"


DEMO_TASKS = [
    {
        "title": "Create Content - Swachh Bharat Abhiyan",
        "content": (
            "Create an awareness message encouraging citizens "
            "to keep public spaces clean and dispose of waste properly."
        ),
        "type": CampaignType.AWARENESS,
        "status": CampaignStatus.SENDING,
        "days_ago": 1,
        "channels": ["whatsapp", "sms"],
        "target_filters": {
            "audience": "General Public",
            "language": "en",
            "geography": "South India",
        },
    },
    {
        "title": "Translate Content - Dengue Drive",
        "content": (
            "Translate the dengue prevention awareness message "
            "for regional audiences."
        ),
        "type": CampaignType.EDUCATIONAL,
        "status": CampaignStatus.REVIEW,
        "days_ago": 1,
        "channels": ["whatsapp", "email"],
        "target_filters": {
            "audience": "General Public",
            "language": "te",
            "geography": "Telangana",
        },
    },
    {
        "title": "Tone Check - Digital India",
        "content": (
            "Review the tone of the Digital India awareness "
            "message and ensure that it is clear and friendly."
        ),
        "type": CampaignType.EDUCATIONAL,
        "status": CampaignStatus.REVIEW,
        "days_ago": 2,
        "channels": ["email"],
        "target_filters": {
            "audience": "Youth",
            "language": "en",
            "geography": "India",
        },
    },
    {
        "title": "Compliance Check - Water Conservation",
        "content": (
            "Review the water conservation campaign for "
            "compliance before submission."
        ),
        "type": CampaignType.ANNOUNCEMENT,
        "status": CampaignStatus.READY,
        "days_ago": 3,
        "channels": ["whatsapp", "sms"],
        "target_filters": {
            "audience": "Farmers",
            "language": "te",
            "geography": "Andhra Pradesh",
        },
    },
    {
        "title": "Content Submitted - Vaccination Awareness",
        "content": (
            "Vaccination awareness content prepared and submitted "
            "for review."
        ),
        "type": CampaignType.AWARENESS,
        "status": CampaignStatus.COMPLETED,
        "days_ago": 4,
        "channels": ["sms", "whatsapp"],
        "target_filters": {
            "audience": "Senior Citizens",
            "language": "en",
            "geography": "South India",
        },
    },
    {
        "title": "Rejected Content - Emergency Preparedness",
        "content": (
            "Emergency preparedness awareness message requiring "
            "content revision."
        ),
        "type": CampaignType.EMERGENCY,
        "status": CampaignStatus.FAILED,
        "days_ago": 5,
        "channels": ["sms"],
        "target_filters": {
            "audience": "General Public",
            "language": "en",
            "geography": "Coastal Areas",
        },
    },
]


async def find_campaign_person(db):
    result = await db.execute(
        select(User).where(
            User.email == CAMPAIGN_PERSON_EMAIL,
            User.role == Role.COMMS_TEAM,
        )
    )

    return result.scalar_one_or_none()


async def main():
    print()
    print("=" * 60)
    print("CampaignHub Campaign Person Demo Data")
    print("=" * 60)
    print()

    async with AsyncSessionLocal() as db:

        # --------------------------------------------------
        # FIND CAMPAIGN PERSON
        # --------------------------------------------------

        person = await find_campaign_person(db)

        if person is None:
            print(
                f"ERROR: Campaign Person "
                f"{CAMPAIGN_PERSON_EMAIL} was not found."
            )
            return

        print(
            f"Campaign Person found: "
            f"{person.name} <{person.email}>"
        )

        print(
            f"User ID: {person.id}"
        )

        print()


        # --------------------------------------------------
        # CREATE DEMO CAMPAIGNS / TASKS
        # --------------------------------------------------

        created_count = 0


        for item in DEMO_TASKS:

            result = await db.execute(
                select(Campaign).where(
                    Campaign.title == item["title"]
                )
            )

            existing = (
                result.scalar_one_or_none()
            )


            if existing is not None:

                print(
                    f"Already exists: "
                    f"{item['title']}"
                )

                continue


            created_at = (
                datetime.utcnow()
                - timedelta(
                    days=item["days_ago"]
                )
            )


            started_at = None
            completed_at = None


            if item["status"] in {
                CampaignStatus.SENDING,
                CampaignStatus.COMPLETED,
                CampaignStatus.FAILED,
            }:

                started_at = (
                    created_at
                    + timedelta(
                        hours=2
                    )
                )


            if item["status"] in {
                CampaignStatus.COMPLETED,
                CampaignStatus.FAILED,
            }:

                completed_at = (
                    created_at
                    + timedelta(
                        hours=6
                    )
                )


            campaign = Campaign(

                id=uuid4(),

                title=item["title"],

                content=item["content"],

                type=item["type"],

                status=item["status"],

                # IMPORTANT:
                # The Campaign Person owns these records,
                # so /campaigns/ will return them for this login.
                created_by=person.id,

                target_filters=item[
                    "target_filters"
                ],

                template_id=None,

                scheduled_at=None,

                started_at=started_at,

                completed_at=completed_at,

                channels=item["channels"],

                created_at=created_at,
            )


            db.add(campaign)

            created_count += 1


            print(
                f"Created: "
                f"{item['title']} "
                f"[{item['status'].value}]"
            )


        # --------------------------------------------------
        # COMMIT
        # --------------------------------------------------

        try:

            await db.commit()

        except Exception as exc:

            await db.rollback()

            print()
            print(
                "ERROR: Database commit failed:"
            )

            print(
                str(exc)
            )

            raise


        print()
        print("=" * 60)

        print(
            f"Campaign Person demo records created: "
            f"{created_count}"
        )

        print("=" * 60)
        print()


if __name__ == "__main__":
    asyncio.run(main())
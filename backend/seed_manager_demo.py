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
from app.models.audience import AudienceMember
from app.models.channel_config import ChannelConfig


# ============================================================
# CONFIGURATION
# ============================================================

MANAGER_ID = "CM001"
MANAGER_EMAIL = "campaignmanager@example.com"

CAMPAIGN_PERSON_LIMIT = 3
AUDIENCE_LIMIT = 8


# ============================================================
# SAMPLE DATA
# ============================================================

CAMPAIGN_DATA = [
    {
        "title": "Clean India Awareness Drive",
        "content": (
            "Help keep our communities clean. "
            "Use waste bins, avoid littering, and encourage "
            "others to keep public spaces clean."
        ),
        "type": CampaignType.AWARENESS,
        "status": CampaignStatus.SENDING,
        "channels": [
            "whatsapp",
            "sms",
            "email",
        ],
        "target_filters": {
            "audience": "General Public",
            "language": "en",
            "geography": "South India",
        },
        "days_ago": 1,
    },
    {
        "title": "Dengue Prevention Drive",
        "content": (
            "Prevent dengue by removing stagnant water, "
            "keeping surroundings clean, and protecting "
            "your family from mosquito bites."
        ),
        "type": CampaignType.EDUCATIONAL,
        "status": CampaignStatus.REVIEW,
        "channels": [
            "whatsapp",
            "sms",
        ],
        "target_filters": {
            "audience": "General Public",
            "language": "en",
            "geography": "South India",
        },
        "days_ago": 2,
    },
    {
        "title": "Digital Literacy Program",
        "content": (
            "Learn essential digital skills and use online "
            "services safely and confidently."
        ),
        "type": CampaignType.EDUCATIONAL,
        "status": CampaignStatus.READY,
        "channels": [
            "email",
            "whatsapp",
        ],
        "target_filters": {
            "audience": "Youth",
            "language": "en",
            "geography": "South India",
        },
        "days_ago": 3,
    },
    {
        "title": "Water Conservation Message",
        "content": (
            "Every drop matters. Reduce water wastage and "
            "help protect local water resources."
        ),
        "type": CampaignType.ANNOUNCEMENT,
        "status": CampaignStatus.SCHEDULED,
        "channels": [
            "whatsapp",
            "email",
        ],
        "target_filters": {
            "audience": "Farmers",
            "language": "te",
            "geography": "Andhra Pradesh",
        },
        "days_ago": 4,
        "scheduled_days_from_now": 2,
    },
    {
        "title": "Vaccination Awareness",
        "content": (
            "Stay informed about recommended vaccinations "
            "and consult your local healthcare provider."
        ),
        "type": CampaignType.AWARENESS,
        "status": CampaignStatus.COMPLETED,
        "channels": [
            "sms",
            "whatsapp",
        ],
        "target_filters": {
            "audience": "Senior Citizens",
            "language": "en",
            "geography": "Telangana",
        },
        "days_ago": 5,
    },
    {
        "title": "Emergency Flood Alert",
        "content": (
            "Emergency preparedness message for communities "
            "in flood-prone regions."
        ),
        "type": CampaignType.EMERGENCY,
        "status": CampaignStatus.FAILED,
        "channels": [
            "sms",
            "whatsapp",
        ],
        "target_filters": {
            "audience": "General Public",
            "language": "en",
            "geography": "Coastal Andhra",
        },
        "days_ago": 6,
    },
]


AUDIENCE_DATA = [
    {
        "name": "Ravi Kumar",
        "email": "ravi.kumar.demo@example.com",
        "phone": "9000000001",
        "language": "en",
        "geography": "Bengaluru",
        "occupation": "Student",
        "engagement_score": 82,
    },
    {
        "name": "Lakshmi Devi",
        "email": "lakshmi.devi.demo@example.com",
        "phone": "9000000002",
        "language": "te",
        "geography": "Hyderabad",
        "occupation": "Healthcare Worker",
        "engagement_score": 76,
    },
    {
        "name": "Suresh Reddy",
        "email": "suresh.reddy.demo@example.com",
        "phone": "9000000003",
        "language": "te",
        "geography": "Vijayawada",
        "occupation": "Farmer",
        "engagement_score": 68,
    },
    {
        "name": "Priya Sharma",
        "email": "priya.sharma.demo@example.com",
        "phone": "9000000004",
        "language": "hi",
        "geography": "Delhi",
        "occupation": "Student",
        "engagement_score": 91,
    },
    {
        "name": "Anita Rao",
        "email": "anita.rao.demo@example.com",
        "phone": "9000000005",
        "language": "en",
        "geography": "Chennai",
        "occupation": "Government Employee",
        "engagement_score": 72,
    },
    {
        "name": "Mohammed Imran",
        "email": "imran.demo@example.com",
        "phone": "9000000006",
        "language": "en",
        "geography": "Hyderabad",
        "occupation": "Business",
        "engagement_score": 64,
    },
    {
        "name": "Meena Lakshmi",
        "email": "meena.demo@example.com",
        "phone": "9000000007",
        "language": "ta",
        "geography": "Chennai",
        "occupation": "Teacher",
        "engagement_score": 87,
    },
    {
        "name": "Ramesh Naidu",
        "email": "ramesh.naidu.demo@example.com",
        "phone": "9000000008",
        "language": "te",
        "geography": "Visakhapatnam",
        "occupation": "Farmer",
        "engagement_score": 59,
    },
]


# ============================================================
# HELPERS
# ============================================================

async def find_manager(db):
    result = await db.execute(
        select(User).where(
            User.role == Role.CAMPAIGN_MANAGER,
            User.manager_id == MANAGER_ID,
        )
    )

    manager = result.scalar_one_or_none()

    if manager is None:
        result = await db.execute(
            select(User).where(
                User.role == Role.CAMPAIGN_MANAGER,
                User.email == MANAGER_EMAIL,
            )
        )

        manager = result.scalar_one_or_none()

    return manager


async def assign_campaign_persons(db):
    """
    Assign existing Campaign Persons to CM001.

    Because you already fixed manager_id so that several
    Campaign Persons can share the same Manager ID, this
    safely assigns up to CAMPAIGN_PERSON_LIMIT users.
    """

    result = await db.execute(
        select(User)
        .where(
            User.role == Role.COMMS_TEAM
        )
        .order_by(
            User.registration_date.asc(),
            User.email.asc(),
        )
    )

    people = result.scalars().all()

    assigned = 0

    for person in people:

        if assigned >= CAMPAIGN_PERSON_LIMIT:
            break

        # Already assigned to another manager:
        # leave that assignment untouched.
        if (
            person.manager_id
            and person.manager_id != MANAGER_ID
        ):
            continue

        if person.manager_id == MANAGER_ID:
            print(
                f"Already assigned: "
                f"{person.name} <{person.email}>"
            )
            assigned += 1
            continue

        person.manager_id = MANAGER_ID

        print(
            f"Assigned Campaign Person: "
            f"{person.name} <{person.email}>"
        )

        assigned += 1

    return assigned


async def create_audience(db):
    """
    Create demo audience records if they don't already exist.
    """

    created = 0

    existing_result = await db.execute(
        select(AudienceMember.email)
    )

    existing_emails = {
        row[0]
        for row in existing_result.all()
        if row[0]
    }

    for item in AUDIENCE_DATA:

        if item["email"] in existing_emails:
            continue

        member = AudienceMember(
            id=uuid4(),
            name=item["name"],
            email=item["email"],
            phone=item["phone"],
            language=item["language"],
            geography=item["geography"],
            occupation=item["occupation"],
            engagement_score=item[
                "engagement_score"
            ],
        )

        db.add(member)

        created += 1

        print(
            f"Created audience member: "
            f"{item['name']}"
        )

    return created


async def create_channels(db):
    """
    Create safe demo channel configurations.

    These are enabled for dashboard/configuration visibility,
    but contain NO real credentials.
    """

    channels = [
        "email",
        "sms",
        "whatsapp",
        "push",
        "web_broadcast",
    ]

    created = 0

    for channel_name in channels:

        result = await db.execute(
            select(ChannelConfig).where(
                ChannelConfig.channel
                == channel_name
            )
        )

        existing = (
            result.scalar_one_or_none()
        )

        if existing is not None:
            continue

        config = ChannelConfig(
            id=uuid4(),
            channel=channel_name,
            enabled=True,
            config={
                "provider": "demo",
                "demo": True,
            },
        )

        db.add(config)

        created += 1

        print(
            f"Created demo channel: "
            f"{channel_name}"
        )

    return created


async def create_campaigns(
    db,
    manager,
):
    """
    Create six demo campaigns owned by the Manager.
    """

    created = 0

    for item in CAMPAIGN_DATA:

        result = await db.execute(
            select(Campaign).where(
                Campaign.title
                == item["title"]
            )
        )

        existing = (
            result.scalar_one_or_none()
        )

        if existing is not None:

            print(
                f"Campaign already exists: "
                f"{item['title']}"
            )

            continue


        created_at = (
            datetime.utcnow()
            - timedelta(
                days=item["days_ago"]
            )
        )


        scheduled_at = None

        if (
            "scheduled_days_from_now"
            in item
        ):

            scheduled_at = (
                datetime.utcnow()
                + timedelta(
                    days=item[
                        "scheduled_days_from_now"
                    ],
                    hours=2,
                )
            )


        started_at = None
        completed_at = None


        if (
            item["status"]
            in {
                CampaignStatus.SENDING,
                CampaignStatus.COMPLETED,
                CampaignStatus.FAILED,
            }
        ):

            started_at = (
                created_at
                + timedelta(
                    hours=2
                )
            )


        if (
            item["status"]
            in {
                CampaignStatus.COMPLETED,
                CampaignStatus.FAILED,
            }
        ):

            completed_at = (
                created_at
                + timedelta(
                    hours=8
                )
            )


        campaign = Campaign(

            id=uuid4(),

            title=item["title"],

            content=item["content"],

            type=item["type"],

            status=item["status"],

            created_by=manager.id,

            target_filters=item[
                "target_filters"
            ],

            template_id=None,

            scheduled_at=scheduled_at,

            started_at=started_at,

            completed_at=completed_at,

            channels=item["channels"],

            created_at=created_at,

        )


        db.add(campaign)

        created += 1


        print(
            f"Created campaign: "
            f"{item['title']} "
            f"[{item['status'].value}]"
        )


    return created


# ============================================================
# MAIN
# ============================================================

async def main():

    print()
    print("=" * 60)
    print("CampaignHub Manager Demo Data Seeder")
    print("=" * 60)
    print()


    async with AsyncSessionLocal() as db:

        # ----------------------------------------------------
        # MANAGER
        # ----------------------------------------------------

        manager = await find_manager(db)

        if manager is None:

            print(
                "ERROR: Manager CM001 was not found."
            )

            print(
                "Expected manager email:",
                MANAGER_EMAIL,
            )

            return


        print(
            f"Manager found: "
            f"{manager.name} "
            f"<{manager.email}>"
        )

        print(
            f"Manager ID: "
            f"{manager.manager_id}"
        )

        print()


        # ----------------------------------------------------
        # ASSIGN PEOPLE
        # ----------------------------------------------------

        assigned_count = (
            await assign_campaign_persons(
                db
            )
        )

        print()


        # ----------------------------------------------------
        # AUDIENCE
        # ----------------------------------------------------

        audience_created = (
            await create_audience(
                db
            )
        )

        print()


        # ----------------------------------------------------
        # CHANNELS
        # ----------------------------------------------------

        channels_created = (
            await create_channels(
                db
            )
        )

        print()


        # ----------------------------------------------------
        # CAMPAIGNS
        # ----------------------------------------------------

        campaigns_created = (
            await create_campaigns(
                db,
                manager,
            )
        )

        print()


        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        try:

            await db.commit()

        except Exception as exc:

            await db.rollback()

            print()
            print(
                "ERROR: Database commit failed."
            )

            print(
                str(exc)
            )

            raise


        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        print("=" * 60)

        print(
            "Demo data seeding completed."
        )

        print()

        print(
            f"Campaign Persons assigned : "
            f"{assigned_count}"
        )

        print(
            f"Audience records created  : "
            f"{audience_created}"
        )

        print(
            f"Channels created          : "
            f"{channels_created}"
        )

        print(
            f"Campaigns created         : "
            f"{campaigns_created}"
        )

        print("=" * 60)
        print()


if __name__ == "__main__":
    asyncio.run(main())
import asyncio
import uuid

from sqlalchemy import select

from app.database import AsyncSessionLocal

from app.models.campaign import (
    Campaign,
    CampaignType,
    CampaignStatus,
)

from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.models.audience import (
    AudienceMember,
)

from app.models.message_delivery import (
    MessageDelivery,
)

from app.services.campaign_delivery import (
    deliver_campaign,
)


# ============================================================
# CONFIGURATION
# ============================================================

CREATED_BY = uuid.UUID(
    "8967094e-5939-411d-ab5c-64d9ed19fdde"
)

TEST_PHONE = "917013039501"


# ============================================================
# MAIN TEST
# ============================================================

async def main():

    async with AsyncSessionLocal() as db:

        # ====================================================
        # FIND AUDIENCE MEMBER
        # ====================================================

        result = await db.execute(
            select(AudienceMember).where(
                AudienceMember.phone.in_(
                    [
                        TEST_PHONE,
                        f"+{TEST_PHONE}",
                    ]
                )
            )
        )

        audience_member = (
            result.scalars().first()
        )

        if audience_member is None:

            print()
            print("=" * 70)
            print("AUDIENCE MEMBER NOT FOUND")
            print("=" * 70)
            print(
                "No audience member was found with phone:",
                TEST_PHONE,
            )
            print()

            return

        # ====================================================
        # DISPLAY RECIPIENT
        # ====================================================

        print()
        print("=" * 70)
        print("SMS CAMPAIGN TEST")
        print("=" * 70)

        print(
            "Audience member:",
            audience_member.id,
        )

        print(
            "Name:",
            getattr(
                audience_member,
                "name",
                None,
            ),
        )

        print(
            "Phone:",
            audience_member.phone,
        )

        print("=" * 70)

        # ====================================================
        # CREATE CAMPAIGN
        # ====================================================

        campaign = Campaign(
            title="Twilio Trial SMS Campaign Test",
            content=(
                "Mass Communication Platform "
                "Twilio trial campaign test."
            ),
            type=CampaignType.AWARENESS,
            status=CampaignStatus.READY,
            created_by=CREATED_BY,
            target_filters={},
            template_id=None,
            channels=["sms"],
        )

        db.add(campaign)

        await db.flush()

        print()
        print("CAMPAIGN CREATED")
        print(
            "Campaign ID:",
            campaign.id,
        )

        print(
            "Channels:",
            campaign.channels,
        )

        print(
            "Status:",
            campaign.status.value,
        )

        # ====================================================
        # CREATE CAMPAIGN RECIPIENT
        # ====================================================

        campaign_recipient = CampaignRecipient(
            campaign_id=campaign.id,
            audience_member_id=audience_member.id,
            status=RecipientStatus.PENDING,
        )

        db.add(campaign_recipient)

        await db.commit()

        print()
        print("CAMPAIGN RECIPIENT CREATED")

        print(
            "Recipient ID:",
            campaign_recipient.id,
        )

        # ====================================================
        # DELIVER CAMPAIGN
        # ====================================================

        print()
        print("=" * 70)
        print("STARTING CAMPAIGN DELIVERY")
        print("=" * 70)

        try:

            delivery_result = await deliver_campaign(
                campaign_id=campaign.id,
                db=db,
            )

        except Exception as exc:

            await db.rollback()

            print()
            print("=" * 70)
            print("CAMPAIGN DELIVERY EXCEPTION")
            print("=" * 70)

            print(
                "Exception type:",
                type(exc).__name__,
            )

            print(
                "Exception:",
                str(exc),
            )

            print()

            return

        # ====================================================
        # DISPLAY DELIVERY RESULT
        # ====================================================

        print()
        print("=" * 70)
        print("CAMPAIGN DELIVERY RESULT")
        print("=" * 70)

        print(
            "Campaign ID:",
            campaign.id,
        )

        print(
            "Campaign status:",
            delivery_result.get(
                "campaign_status"
            ),
        )

        print(
            "Total attempts:",
            delivery_result.get(
                "total_attempts"
            ),
        )

        print(
            "Successful deliveries:",
            delivery_result.get(
                "successful_deliveries"
            ),
        )

        print(
            "Failed deliveries:",
            delivery_result.get(
                "failed_deliveries"
            ),
        )

        # ====================================================
        # INDIVIDUAL DELIVERY RESULTS
        # ====================================================

        print()
        print("=" * 70)
        print("INDIVIDUAL DELIVERY RESULTS")
        print("=" * 70)

        deliveries = delivery_result.get(
            "deliveries",
            [],
        )

        if not deliveries:

            print(
                "No delivery results returned."
            )

        else:

            for item in deliveries:

                print()

                print(
                    "Recipient:",
                    item.get(
                        "recipient_id"
                    ),
                )

                print(
                    "Channel:",
                    item.get(
                        "channel"
                    ),
                )

                print(
                    "Success:",
                    item.get(
                        "success"
                    ),
                )

                print(
                    "Provider:",
                    item.get(
                        "provider"
                    ),
                )

                print(
                    "Message ID:",
                    item.get(
                        "message_id"
                    ),
                )

                print(
                    "Error:",
                    item.get(
                        "error"
                    ),
                )

        # ====================================================
        # READ DATABASE DELIVERY RECORD
        # ====================================================

        delivery_query = await db.execute(
            select(MessageDelivery).where(
                MessageDelivery.recipient_id
                == campaign_recipient.id
            )
        )

        delivery = (
            delivery_query.scalars().first()
        )

        print()
        print("=" * 70)
        print("DATABASE DELIVERY RECORD")
        print("=" * 70)

        if delivery is None:

            print(
                "NO MESSAGE DELIVERY RECORD FOUND"
            )

        else:

            print(
                "Delivery ID:",
                delivery.id,
            )

            print(
                "Channel:",
                delivery.channel,
            )

            print(
                "Status:",
                delivery.status.value,
            )

            print(
                "Provider:",
                delivery.provider,
            )

            print(
                "Provider message ID:",
                delivery.provider_message_id,
            )

            print(
                "Error:",
                delivery.error_message,
            )

            print(
                "Sent at:",
                delivery.sent_at,
            )

            print(
                "Failed at:",
                delivery.failed_at,
            )

        # ====================================================
        # FINAL CAMPAIGN STATE
        # ====================================================

        await db.refresh(
            campaign
        )

        await db.refresh(
            campaign_recipient
        )

        print()
        print("=" * 70)
        print("FINAL DATABASE STATE")
        print("=" * 70)

        print(
            "Campaign:",
            campaign.id,
        )

        print(
            "Campaign status:",
            campaign.status.value,
        )

        print(
            "Recipient status:",
            campaign_recipient.status.value,
        )

        print(
            "Recipient error:",
            campaign_recipient.error_message,
        )

        print("=" * 70)
        print()

        # ====================================================
        # TEST INTERPRETATION
        # ====================================================

        if campaign.status == CampaignStatus.FAILED:

            print(
                "RESULT: Campaign correctly recorded "
                "the Twilio delivery failure."
            )

        elif campaign.status == CampaignStatus.COMPLETED:

            print(
                "RESULT: Campaign completed successfully."
            )

        else:

            print(
                "RESULT: Unexpected campaign status:",
                campaign.status.value,
            )

        print()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    asyncio.run(main())

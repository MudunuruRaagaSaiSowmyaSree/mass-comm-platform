import uuid
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.models.user import (
    User,
    Role,
)

from app.models.campaign import (
    Campaign,
    CampaignStatus,
)

from app.models.audience import (
    AudienceMember,
)

from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.models.message_delivery import (
    MessageDelivery,
)

from app.schemas.campaign_recipient import (
    CampaignRecipientOut,
)

from app.core.deps import (
    get_current_user,
)

from app.services.campaign_delivery import (
    deliver_campaign,
)


router = APIRouter(
    prefix="/campaigns",
    tags=["campaign recipients"],
)


# ============================================================
# CHECK CAMPAIGN ACCESS
# ============================================================

def check_campaign_access(
    campaign: Campaign,
    current_user: User,
):

    if (
        current_user.role != Role.ADMIN
        and campaign.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access "
                "to this campaign"
            ),
        )


# ============================================================
# ASSIGN MATCHING AUDIENCE MEMBERS
# ============================================================

@router.post(
    "/{campaign_id}/recipients/assign",
)
async def assign_matching_recipients(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if not campaign:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    check_campaign_access(
        campaign,
        current_user,
    )

    filters = (
        campaign.target_filters
        or {}
    )

    if not filters:
        raise HTTPException(
            status_code=400,
            detail="Campaign has no target filters",
        )

    stmt = select(
        AudienceMember
    )

    # ========================================================
    # ORGANIZATION
    # ========================================================

    if filters.get("org_id"):

        try:
            org_id = uuid.UUID(
                str(
                    filters["org_id"]
                )
            )

        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Invalid org_id "
                    "in target_filters"
                ),
            )

        stmt = stmt.where(
            AudienceMember.org_id
            == org_id
        )

    # ========================================================
    # LANGUAGE
    # ========================================================

    if filters.get("language"):

        stmt = stmt.where(
            AudienceMember.language
            == filters["language"]
        )

    # ========================================================
    # OCCUPATION
    # ========================================================

    if filters.get("occupation"):

        stmt = stmt.where(
            AudienceMember.occupation
            == filters["occupation"]
        )

    # ========================================================
    # GEOGRAPHY
    # ========================================================

    if filters.get("geography"):

        stmt = stmt.where(
            AudienceMember.geography
            == filters["geography"]
        )

    result = await db.execute(
        stmt
    )

    audience_members = (
        result.scalars().all()
    )

    if not audience_members:

        return {
            "campaign_id": str(
                campaign_id
            ),
            "message": (
                "No audience members "
                "matched the campaign filters"
            ),
            "matched": 0,
            "added": 0,
            "already_exists": 0,
        }

    existing_result = await db.execute(
        select(
            CampaignRecipient.audience_member_id
        ).where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    existing_ids = set(
        existing_result.scalars().all()
    )

    added = 0
    already_exists = 0

    for audience_member in audience_members:

        if audience_member.id in existing_ids:

            already_exists += 1
            continue

        recipient = CampaignRecipient(
            campaign_id=campaign_id,
            audience_member_id=audience_member.id,
            status=RecipientStatus.PENDING,
        )

        db.add(recipient)

        existing_ids.add(
            audience_member.id
        )

        added += 1

    try:
        await db.commit()

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to assign recipients: {str(exc)}"
            ),
        )

    return {
        "campaign_id": str(
            campaign_id
        ),
        "message": (
            "Audience members assigned successfully"
        ),
        "matched": len(
            audience_members
        ),
        "added": added,
        "already_exists": already_exists,
    }


# ============================================================
# ADD SINGLE RECIPIENT
# ============================================================

@router.post(
    "/{campaign_id}/recipients/{audience_member_id}",
    response_model=CampaignRecipientOut,
)
async def add_recipient(
    campaign_id: uuid.UUID,
    audience_member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if not campaign:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    check_campaign_access(
        campaign,
        current_user,
    )

    audience_member = await db.get(
        AudienceMember,
        audience_member_id,
    )

    if not audience_member:

        raise HTTPException(
            status_code=404,
            detail="Audience member not found",
        )

    result = await db.execute(
        select(
            CampaignRecipient
        ).where(
            CampaignRecipient.campaign_id
            == campaign_id,
            CampaignRecipient.audience_member_id
            == audience_member_id,
        )
    )

    existing = (
        result.scalar_one_or_none()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail=(
                "Audience member is already "
                "a recipient"
            ),
        )

    recipient = CampaignRecipient(
        campaign_id=campaign_id,
        audience_member_id=audience_member_id,
        status=RecipientStatus.PENDING,
    )

    db.add(recipient)

    await db.commit()
    await db.refresh(recipient)

    return recipient


# ============================================================
# LIST RECIPIENTS
# ============================================================

@router.get(
    "/{campaign_id}/recipients",
    response_model=list[
        CampaignRecipientOut
    ],
)
async def list_recipients(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if not campaign:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    check_campaign_access(
        campaign,
        current_user,
    )

    result = await db.execute(
        select(
            CampaignRecipient
        ).where(
            CampaignRecipient.campaign_id
            == campaign_id
        )
    )

    return result.scalars().all()


# ============================================================
# SEND ALL PENDING RECIPIENTS
# ============================================================

@router.post(
    "/{campaign_id}/send-all",
)
async def send_all_recipients(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    # ========================================================
    # GET CAMPAIGN
    # ========================================================

    campaign = await db.get(
        Campaign,
        campaign_id,
    )

    if not campaign:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    check_campaign_access(
        campaign,
        current_user,
    )

    # ========================================================
    # VALIDATE CAMPAIGN STATUS
    # ========================================================

    allowed_statuses = {
        CampaignStatus.READY,
        CampaignStatus.SCHEDULED,
        CampaignStatus.SENDING,
    }

    if campaign.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail=(
                "Campaign must be ready, "
                "scheduled, or sending "
                "before recipients can be sent"
            ),
        )

    # ========================================================
    # CHECK PENDING RECIPIENTS
    # ========================================================

    result = await db.execute(
        select(
            CampaignRecipient
        ).where(
            CampaignRecipient.campaign_id
            == campaign_id,
            CampaignRecipient.status
            == RecipientStatus.PENDING,
        )
    )

    recipients = (
        result.scalars().all()
    )

    if not recipients:

        return {
            "campaign_id": str(
                campaign_id
            ),
            "message": (
                "No pending recipients found"
            ),
            "channels": (
                campaign.channels
                or []
            ),
            "sent": 0,
            "failed": 0,
            "channel_results": {},
        }

    # ========================================================
    # DELIVER CAMPAIGN
    #
    # This uses app/services/campaign_delivery.py.
    #
    # That service:
    #
    #   - loads enabled ChannelConfig records
    #   - loads SMTP configuration
    #   - gets recipient email address
    #   - sends through the configured provider
    #   - creates MessageDelivery records
    #   - updates CampaignRecipient
    #   - updates campaign status
    #
    # ========================================================

    try:

        delivery_result = await deliver_campaign(
            campaign_id=campaign_id,
            db=db,
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        await db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to send campaign: "
                f"{str(exc)}"
            ),
        )

    # ========================================================
    # BUILD CHANNEL RESULTS
    # ========================================================

    channel_results = {}

    for delivery in delivery_result.get(
        "deliveries",
        [],
    ):

        channel = delivery.get(
            "channel"
        )

        if channel not in channel_results:

            channel_results[channel] = {
                "sent": 0,
                "failed": 0,
            }

        if delivery.get(
            "success",
            False,
        ):

            channel_results[channel][
                "sent"
            ] += 1

        else:

            channel_results[channel][
                "failed"
            ] += 1

    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {
        "campaign_id": str(
            campaign_id
        ),
        "message": (
            "Multi-channel campaign "
            "sending completed"
        ),
        "channels": (
            campaign.channels
            or []
        ),
        "sent": delivery_result.get(
            "successful_deliveries",
            0,
        ),
        "failed": delivery_result.get(
            "failed_deliveries",
            0,
        ),
        "channel_results": channel_results,
        "campaign_status": (
            delivery_result.get(
                "campaign_status"
            )
        ),
    }

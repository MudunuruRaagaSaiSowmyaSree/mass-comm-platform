from datetime import datetime
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

from app.models.campaign import (
    Campaign,
    CampaignStatus,
)

from app.models.campaign_schedule import (
    CampaignSchedule,
    ScheduleFrequency,
    ScheduleStatus,
)

from app.schemas.campaign_schedule import (
    CampaignScheduleCreate,
    CampaignScheduleResponse,
    CampaignScheduleUpdate,
)


router = APIRouter(
    prefix="/campaign-schedules",
    tags=["Campaign Scheduling"],
)


# ============================================================
# HELPERS
# ============================================================

def serialize_schedule(
    item: CampaignSchedule,
) -> dict:

    return {
        "id": str(item.id),
        "campaign_id": str(item.campaign_id),
        "scheduled_at": item.scheduled_at,
        "timezone": item.timezone,
        "frequency": item.frequency.value,
        "interval": item.interval,
        "max_occurrences": item.max_occurrences,
        "occurrence_count": item.occurrence_count,
        "status": item.status.value,
        "enabled": item.enabled,
        "priority": item.priority,
        "last_run_at": item.last_run_at,
        "next_run_at": item.next_run_at,
        "error_message": item.error_message,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


async def load_campaign(
    campaign_id: UUID,
    db: AsyncSession,
) -> Campaign:

    result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id
        )
    )

    campaign = result.scalar_one_or_none()

    if campaign is None:

        raise HTTPException(
            status_code=404,
            detail="Campaign not found.",
        )

    return campaign


async def load_schedule(
    schedule_id: UUID,
    db: AsyncSession,
) -> CampaignSchedule:

    result = await db.execute(
        select(CampaignSchedule).where(
            CampaignSchedule.id == schedule_id
        )
    )

    schedule = result.scalar_one_or_none()

    if schedule is None:

        raise HTTPException(
            status_code=404,
            detail="Campaign schedule not found.",
        )

    return schedule


# ============================================================
# CREATE SCHEDULE
# ============================================================

@router.post(
    "/",
    status_code=201,
)
async def create_campaign_schedule(
    data: CampaignScheduleCreate,
    db: AsyncSession = Depends(get_db),
):

    campaign = await load_campaign(
        campaign_id=data.campaign_id,
        db=db,
    )

    # --------------------------------------------------------
    # Campaign must contain content
    # --------------------------------------------------------

    if not campaign.content:

        raise HTTPException(
            status_code=400,
            detail=(
                "Campaign does not contain content. "
                "Add campaign content before scheduling."
            ),
        )

    # --------------------------------------------------------
    # Campaign must have channels
    # --------------------------------------------------------

    if not campaign.channels:

        raise HTTPException(
            status_code=400,
            detail=(
                "Campaign does not have any channels configured."
            ),
        )

    # --------------------------------------------------------
    # Prevent duplicate schedule
    # --------------------------------------------------------

    result = await db.execute(
        select(CampaignSchedule).where(
            CampaignSchedule.campaign_id
            == data.campaign_id
        )
    )

    existing = result.scalar_one_or_none()

    if existing:

        raise HTTPException(
            status_code=409,
            detail=(
                "This campaign already has a schedule."
            ),
        )

    # --------------------------------------------------------
    # Validate scheduled time
    # --------------------------------------------------------

    now = datetime.utcnow()

    if data.scheduled_at <= now:

        raise HTTPException(
            status_code=400,
            detail=(
                "scheduled_at must be in the future."
            ),
        )

    # --------------------------------------------------------
    # Create schedule
    # --------------------------------------------------------

    schedule = CampaignSchedule(
        campaign_id=data.campaign_id,
        scheduled_at=data.scheduled_at,
        timezone=data.timezone,
        frequency=data.frequency,
        interval=data.interval,
        max_occurrences=data.max_occurrences,
        occurrence_count=0,
        status=ScheduleStatus.ACTIVE,
        enabled=data.enabled,
        priority=data.priority,
        last_run_at=None,
        next_run_at=data.scheduled_at,
        error_message=None,
        created_at=now,
        updated_at=now,
    )

    db.add(schedule)

    # --------------------------------------------------------
    # Update campaign
    # --------------------------------------------------------

    campaign.scheduled_at = data.scheduled_at

    campaign.status = (
        CampaignStatus.SCHEDULED
    )

    await db.commit()

    await db.refresh(schedule)

    return {
        "success": True,
        "message": (
            "Campaign scheduled successfully."
        ),
        "schedule": serialize_schedule(
            schedule
        ),
    }


# ============================================================
# GET ALL SCHEDULES
# ============================================================

@router.get("/")
async def get_campaign_schedules(
    db: AsyncSession = Depends(get_db),
):

    result = await db.execute(
        select(CampaignSchedule)
        .order_by(
            CampaignSchedule.priority.asc(),
            CampaignSchedule.next_run_at.asc(),
        )
    )

    schedules = result.scalars().all()

    return {
        "schedules": [
            serialize_schedule(item)
            for item in schedules
        ]
    }


# ============================================================
# GET SINGLE SCHEDULE
# ============================================================

@router.get("/{schedule_id}")
async def get_campaign_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    schedule = await load_schedule(
        schedule_id=schedule_id,
        db=db,
    )

    return serialize_schedule(
        schedule
    )


# ============================================================
# UPDATE SCHEDULE
# ============================================================

@router.put("/{schedule_id}")
async def update_campaign_schedule(
    schedule_id: UUID,
    data: CampaignScheduleUpdate,
    db: AsyncSession = Depends(get_db),
):

    schedule = await load_schedule(
        schedule_id=schedule_id,
        db=db,
    )

    campaign = await load_campaign(
        campaign_id=schedule.campaign_id,
        db=db,
    )

    # --------------------------------------------------------
    # Update scheduled time
    # --------------------------------------------------------

    if data.scheduled_at is not None:

        if data.scheduled_at <= datetime.utcnow():

            raise HTTPException(
                status_code=400,
                detail=(
                    "scheduled_at must be in the future."
                ),
            )

        schedule.scheduled_at = (
            data.scheduled_at
        )

        schedule.next_run_at = (
            data.scheduled_at
        )

        campaign.scheduled_at = (
            data.scheduled_at
        )

    # --------------------------------------------------------
    # Update timezone
    # --------------------------------------------------------

    if data.timezone is not None:

        schedule.timezone = (
            data.timezone.strip()
        )

    # --------------------------------------------------------
    # Update frequency
    # --------------------------------------------------------

    if data.frequency is not None:

        schedule.frequency = (
            data.frequency
        )

    # --------------------------------------------------------
    # Update interval
    # --------------------------------------------------------

    if data.interval is not None:

        schedule.interval = (
            data.interval
        )

    # --------------------------------------------------------
    # Update max occurrences
    # --------------------------------------------------------

    if data.max_occurrences is not None:

        schedule.max_occurrences = (
            data.max_occurrences
        )

    # --------------------------------------------------------
    # Update priority
    # --------------------------------------------------------

    if data.priority is not None:

        schedule.priority = (
            data.priority
        )

    # --------------------------------------------------------
    # Update enabled
    # --------------------------------------------------------

    if data.enabled is not None:

        schedule.enabled = (
            data.enabled
        )

        if data.enabled:

            schedule.status = (
                ScheduleStatus.ACTIVE
            )

        else:

            schedule.status = (
                ScheduleStatus.PAUSED
            )

    # --------------------------------------------------------
    # Update status
    # --------------------------------------------------------

    if data.status is not None:

        schedule.status = (
            data.status
        )

        if data.status == ScheduleStatus.CANCELLED:

            schedule.enabled = False

        elif data.status == ScheduleStatus.PAUSED:

            schedule.enabled = False

        elif data.status == ScheduleStatus.ACTIVE:

            schedule.enabled = True

    # --------------------------------------------------------
    # Campaign status
    # --------------------------------------------------------

    if schedule.enabled:

        campaign.status = (
            CampaignStatus.SCHEDULED
        )

    schedule.updated_at = datetime.utcnow()

    await db.commit()

    await db.refresh(schedule)

    return {
        "success": True,
        "message": (
            "Campaign schedule updated successfully."
        ),
        "schedule": serialize_schedule(
            schedule
        ),
    }


# ============================================================
# PAUSE SCHEDULE
# ============================================================

@router.post("/{schedule_id}/pause")
async def pause_campaign_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    schedule = await load_schedule(
        schedule_id=schedule_id,
        db=db,
    )

    schedule.enabled = False

    schedule.status = (
        ScheduleStatus.PAUSED
    )

    schedule.updated_at = datetime.utcnow()

    await db.commit()

    await db.refresh(schedule)

    return {
        "success": True,
        "message": (
            "Campaign schedule paused."
        ),
        "schedule": serialize_schedule(
            schedule
        ),
    }


# ============================================================
# RESUME SCHEDULE
# ============================================================

@router.post("/{schedule_id}/resume")
async def resume_campaign_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    schedule = await load_schedule(
        schedule_id=schedule_id,
        db=db,
    )

    if schedule.status == ScheduleStatus.CANCELLED:

        raise HTTPException(
            status_code=400,
            detail=(
                "A cancelled schedule cannot be resumed. "
                "Create a new schedule."
            ),
        )

    schedule.enabled = True

    schedule.status = (
        ScheduleStatus.ACTIVE
    )

    schedule.updated_at = datetime.utcnow()

    await db.commit()

    await db.refresh(schedule)

    return {
        "success": True,
        "message": (
            "Campaign schedule resumed."
        ),
        "schedule": serialize_schedule(
            schedule
        ),
    }


# ============================================================
# CANCEL SCHEDULE
# ============================================================

@router.post("/{schedule_id}/cancel")
async def cancel_campaign_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    schedule = await load_schedule(
        schedule_id=schedule_id,
        db=db,
    )

    schedule.enabled = False

    schedule.status = (
        ScheduleStatus.CANCELLED
    )

    schedule.updated_at = datetime.utcnow()

    await db.commit()

    await db.refresh(schedule)

    return {
        "success": True,
        "message": (
            "Campaign schedule cancelled."
        ),
        "schedule": serialize_schedule(
            schedule
        ),
    }


# ============================================================
# DELETE SCHEDULE
# ============================================================

@router.delete("/{schedule_id}")
async def delete_campaign_schedule(
    schedule_id: UUID,
    db: AsyncSession = Depends(get_db),
):

    schedule = await load_schedule(
        schedule_id=schedule_id,
        db=db,
    )

    campaign = await load_campaign(
        campaign_id=schedule.campaign_id,
        db=db,
    )

    await db.delete(schedule)

    campaign.scheduled_at = None

    if campaign.status == CampaignStatus.SCHEDULED:

        campaign.status = (
            CampaignStatus.READY
        )

    await db.commit()

    return {
        "success": True,
        "message": (
            "Campaign schedule deleted."
        ),
        "schedule_id": str(
            schedule_id
        ),
    }
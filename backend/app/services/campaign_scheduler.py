"""
Automated campaign scheduler.

Responsibilities:

    1. Find campaigns whose scheduled time has arrived.
    2. Add them to the campaign priority queue.
    3. Process queued campaigns.
    4. Call the existing campaign delivery implementation.
    5. Update recurring schedules.
    6. Keep one-time schedules completed.
    7. Continue running in the FastAPI background.

IMPORTANT:

This module does NOT implement channel delivery itself.

It continues to use the existing Module 1 campaign delivery
route/service so that:

    Email
    SMS
    WhatsApp
    Push
    Web Broadcast

continue using the existing channel dispatcher.

The existing WhatsApp implementation is therefore preserved.
"""


import asyncio
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import select

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

from app.routers.campaign_delivery import (
    send_campaign,
)

from app.services.campaign_queue import (
    campaign_queue,
)


# ============================================================
# CONFIGURATION
# ============================================================


SCHEDULER_INTERVAL_SECONDS = 10

MAX_CAMPAIGNS_PER_SCAN = 100

MAX_CONCURRENT_DELIVERIES = 3


# ============================================================
# RUNNING STATE
# ============================================================


_scheduler_task: asyncio.Task | None = None

_scheduler_stop_event: asyncio.Event | None = None

_worker_tasks: list[asyncio.Task] = []


# ============================================================
# NEXT RUN CALCULATION
# ============================================================


def calculate_next_run(
    schedule: CampaignSchedule,
    current_run: datetime,
) -> datetime | None:
    """
    Calculate the next execution time.

    Returns:

        datetime
            Next run for recurring schedule.

        None
            Schedule has finished.
    """

    frequency = schedule.frequency

    interval = max(
        1,
        schedule.interval,
    )

    # --------------------------------------------------------
    # ONE TIME
    # --------------------------------------------------------

    if frequency == ScheduleFrequency.ONE_TIME:

        return None

    # --------------------------------------------------------
    # HOURLY
    # --------------------------------------------------------

    if frequency == ScheduleFrequency.HOURLY:

        return current_run + timedelta(
            hours=interval
        )

    # --------------------------------------------------------
    # DAILY
    # --------------------------------------------------------

    if frequency == ScheduleFrequency.DAILY:

        return current_run + timedelta(
            days=interval
        )

    # --------------------------------------------------------
    # WEEKLY
    # --------------------------------------------------------

    if frequency == ScheduleFrequency.WEEKLY:

        return current_run + timedelta(
            weeks=interval
        )

    # --------------------------------------------------------
    # MONTHLY
    # --------------------------------------------------------

    if frequency == ScheduleFrequency.MONTHLY:

        # Keep this dependency-free.
        #
        # Calculate approximately one month using the
        # calendar-day length of the current month.

        year = current_run.year

        month = current_run.month

        day = current_run.day

        total_months = (
            year * 12
            + (month - 1)
            + interval
        )

        next_year = total_months // 12

        next_month = (
            total_months % 12
        ) + 1

        # Days in target month.
        if next_month == 12:

            next_month_start = datetime(
                next_year + 1,
                1,
                1,
            )

        else:

            next_month_start = datetime(
                next_year,
                next_month + 1,
                1,
            )

        current_month_start = datetime(
            next_year,
            next_month,
            1,
        )

        days_in_target_month = (
            next_month_start
            - current_month_start
        ).days

        safe_day = min(
            day,
            days_in_target_month,
        )

        return current_run.replace(
            year=next_year,
            month=next_month,
            day=safe_day,
        )

    return None


# ============================================================
# CHECK OCCURRENCE LIMIT
# ============================================================


def has_reached_occurrence_limit(
    schedule: CampaignSchedule,
) -> bool:
    """
    Return True when the recurring schedule has reached
    its maximum occurrence count.
    """

    if schedule.max_occurrences is None:

        return False

    return (
        schedule.occurrence_count
        >= schedule.max_occurrences
    )


# ============================================================
# GET DATABASE SESSION
# ============================================================


async def get_background_db():
    """
    Obtain an AsyncSession from the application's existing
    FastAPI database dependency.

    This avoids requiring a second database/session system.
    """

    generator = get_db()

    db = await anext(
        generator
    )

    return (
        db,
        generator,
    )


async def close_background_db(
    db,
    generator,
) -> None:
    """
    Close the database dependency generator safely.
    """

    try:

        await generator.aclose()

    except Exception:

        try:

            await db.close()

        except Exception:

            pass


# ============================================================
# FIND DUE SCHEDULES
# ============================================================


async def scan_due_campaigns() -> int:
    """
    Find active schedules whose next_run_at has arrived.

    Returns the number of campaigns added to the queue.
    """

    now = datetime.utcnow()

    db = None

    generator = None

    added_count = 0

    try:

        db, generator = (
            await get_background_db()
        )

        result = await db.execute(
            select(CampaignSchedule)
            .where(
                CampaignSchedule.enabled == True,
                CampaignSchedule.status
                == ScheduleStatus.ACTIVE,
                CampaignSchedule.next_run_at.is_not(None),
                CampaignSchedule.next_run_at
                <= now,
            )
            .order_by(
                CampaignSchedule.priority.asc(),
                CampaignSchedule.next_run_at.asc(),
            )
            .limit(
                MAX_CAMPAIGNS_PER_SCAN
            )
        )

        schedules = (
            result.scalars().all()
        )

        for schedule in schedules:

            campaign_id = str(
                schedule.campaign_id
            )

            already_queued = (
                await campaign_queue.is_queued(
                    campaign_id
                )
            )

            if already_queued:

                continue

            added = await campaign_queue.add(
                campaign_id=campaign_id,
                priority=schedule.priority,
            )

            if added:

                added_count += 1

        return added_count

    except Exception as exc:

        print(
            "Campaign scheduler scan error:",
            exc,
        )

        return 0

    finally:

        if db is not None and generator is not None:

            await close_background_db(
                db,
                generator,
            )


# ============================================================
# LOAD SCHEDULE
# ============================================================


async def load_schedule_for_campaign(
    db,
    campaign_id: UUID,
) -> CampaignSchedule | None:

    result = await db.execute(
        select(CampaignSchedule).where(
            CampaignSchedule.campaign_id
            == campaign_id
        )
    )

    return (
        result.scalar_one_or_none()
    )


# ============================================================
# UPDATE SCHEDULE AFTER DELIVERY
# ============================================================


async def update_schedule_after_delivery(
    db,
    schedule: CampaignSchedule,
    delivery_success: bool,
) -> None:
    """
    Update schedule after a campaign execution.

    One-time:

        ACTIVE -> COMPLETED

    Recurring:

        Calculate next_run_at and keep ACTIVE.

    If delivery fails, the schedule remains active for a
    recurring campaign so the next occurrence can still run.
    """

    now = datetime.utcnow()

    schedule.last_run_at = now

    schedule.occurrence_count += 1

    schedule.updated_at = now

    # --------------------------------------------------------
    # ONE-TIME
    # --------------------------------------------------------

    if (
        schedule.frequency
        == ScheduleFrequency.ONE_TIME
    ):

        schedule.next_run_at = None

        schedule.enabled = False

        if delivery_success:

            schedule.status = (
                ScheduleStatus.COMPLETED
            )

        else:

            schedule.status = (
                ScheduleStatus.FAILED
            )

        return

    # --------------------------------------------------------
    # OCCURRENCE LIMIT
    # --------------------------------------------------------

    if has_reached_occurrence_limit(
        schedule
    ):

        schedule.next_run_at = None

        schedule.enabled = False

        if delivery_success:

            schedule.status = (
                ScheduleStatus.COMPLETED
            )

        else:

            schedule.status = (
                ScheduleStatus.FAILED
            )

        return

    # --------------------------------------------------------
    # RECURRING
    # --------------------------------------------------------

    next_run = calculate_next_run(
        schedule=schedule,
        current_run=now,
    )

    if next_run is None:

        schedule.next_run_at = None

        schedule.enabled = False

        schedule.status = (
            ScheduleStatus.COMPLETED
        )

        return

    schedule.next_run_at = next_run

    schedule.enabled = True

    schedule.status = (
        ScheduleStatus.ACTIVE
    )


# ============================================================
# PROCESS ONE CAMPAIGN
# ============================================================


async def process_campaign(
    campaign_id: str,
) -> None:
    """
    Process one scheduled campaign.

    This calls the existing campaign delivery implementation.
    """

    db = None

    generator = None

    try:

        campaign_uuid = UUID(
            str(campaign_id)
        )

        db, generator = (
            await get_background_db()
        )

        # ----------------------------------------------------
        # Load campaign
        # ----------------------------------------------------

        campaign_result = await db.execute(
            select(Campaign).where(
                Campaign.id == campaign_uuid
            )
        )

        campaign = (
            campaign_result.scalar_one_or_none()
        )

        if campaign is None:

            print(
                "Scheduled campaign not found:",
                campaign_id,
            )

            return

        # ----------------------------------------------------
        # Load schedule
        # ----------------------------------------------------

        schedule = (
            await load_schedule_for_campaign(
                db=db,
                campaign_id=campaign_uuid,
            )
        )

        if schedule is None:

            print(
                "Schedule not found for campaign:",
                campaign_id,
            )

            return

        # ----------------------------------------------------
        # Verify schedule is still active
        # ----------------------------------------------------

        if not schedule.enabled:

            return

        if schedule.status != ScheduleStatus.ACTIVE:

            return

        # ----------------------------------------------------
        # Prevent invalid campaign state
        # ----------------------------------------------------

        if campaign.status not in {
            CampaignStatus.READY,
            CampaignStatus.SCHEDULED,
        }:

            print(
                "Scheduled campaign skipped because "
                f"status is '{campaign.status.value}': "
                f"{campaign_id}"
            )

            return

        # ----------------------------------------------------
        # Mark campaign scheduled/sending flow
        # ----------------------------------------------------

        campaign.status = (
            CampaignStatus.SCHEDULED
        )

        await db.commit()

        # ----------------------------------------------------
        # Execute existing campaign delivery
        # ----------------------------------------------------

        delivery_success = False

        try:

            response = await send_campaign(
                campaign_id=campaign_uuid,
                db=db,
            )

            delivery_success = bool(
                response.get(
                    "success",
                    False,
                )
            )

        except Exception as exc:

            print(
                "Scheduled campaign delivery error:",
                exc,
            )

            delivery_success = False

            # Refresh schedule because the delivery function
            # may have committed the session before failing.

            try:

                await db.rollback()

            except Exception:

                pass

        # ----------------------------------------------------
        # Reload schedule
        # ----------------------------------------------------

        schedule = (
            await load_schedule_for_campaign(
                db=db,
                campaign_id=campaign_uuid,
            )
        )

        if schedule is None:

            return

        # ----------------------------------------------------
        # Update schedule
        # ----------------------------------------------------

        await update_schedule_after_delivery(
            db=db,
            schedule=schedule,
            delivery_success=delivery_success,
        )

        # ----------------------------------------------------
        # Recurring campaign must return to SCHEDULED
        # ----------------------------------------------------

        if (
            schedule.enabled
            and schedule.status
            == ScheduleStatus.ACTIVE
        ):

            campaign.status = (
                CampaignStatus.SCHEDULED
            )

            campaign.scheduled_at = (
                schedule.next_run_at
            )

        await db.commit()

        print(
            "Scheduled campaign processed:",
            campaign_id,
            "success=",
            delivery_success,
            "next_run=",
            schedule.next_run_at,
        )

    except Exception as exc:

        print(
            "Campaign worker error:",
            exc,
        )

    finally:

        if db is not None and generator is not None:

            await close_background_db(
                db,
                generator,
            )


# ============================================================
# QUEUE WORKER
# ============================================================


async def campaign_queue_worker(
    worker_number: int,
) -> None:
    """
    Continuously process campaigns from the priority queue.
    """

    print(
        f"Campaign queue worker "
        f"{worker_number} started."
    )

    while True:

        item = None

        try:

            item = await campaign_queue.get()

            print(
                f"Worker {worker_number} "
                f"processing campaign "
                f"{item.campaign_id} "
                f"priority={item.priority}"
            )

            await process_campaign(
                campaign_id=item.campaign_id
            )

        except asyncio.CancelledError:

            print(
                f"Campaign queue worker "
                f"{worker_number} stopped."
            )

            raise

        except Exception as exc:

            print(
                f"Campaign queue worker "
                f"{worker_number} error:",
                exc,
            )

        finally:

            if item is not None:

                await campaign_queue.complete(
                    item.campaign_id
                )


# ============================================================
# SCHEDULER LOOP
# ============================================================


async def scheduler_loop() -> None:
    """
    Main scheduler loop.

    Every few seconds it checks the database for campaigns
    whose scheduled time has arrived.
    """

    print(
        "Campaign scheduler started."
    )

    while True:

        try:

            await scan_due_campaigns()

            await asyncio.sleep(
                SCHEDULER_INTERVAL_SECONDS
            )

        except asyncio.CancelledError:

            print(
                "Campaign scheduler stopped."
            )

            raise

        except Exception as exc:

            print(
                "Campaign scheduler loop error:",
                exc,
            )

            await asyncio.sleep(
                SCHEDULER_INTERVAL_SECONDS
            )


# ============================================================
# START SCHEDULER
# ============================================================


async def start_campaign_scheduler() -> None:
    """
    Start the scheduler and queue workers.

    This function should be called once when FastAPI starts.
    """

    global _scheduler_task
    global _scheduler_stop_event
    global _worker_tasks

    # --------------------------------------------------------
    # Prevent duplicate startup
    # --------------------------------------------------------

    if (
        _scheduler_task is not None
        and not _scheduler_task.done()
    ):

        return

    _scheduler_stop_event = (
        asyncio.Event()
    )

    # --------------------------------------------------------
    # Scheduler
    # --------------------------------------------------------

    _scheduler_task = asyncio.create_task(
        scheduler_loop()
    )

    # --------------------------------------------------------
    # Queue workers
    # --------------------------------------------------------

    _worker_tasks = []

    for worker_number in range(
        1,
        MAX_CONCURRENT_DELIVERIES + 1,
    ):

        task = asyncio.create_task(
            campaign_queue_worker(
                worker_number
            )
        )

        _worker_tasks.append(
            task
        )

    print(
        "Campaign scheduling system started."
    )


# ============================================================
# STOP SCHEDULER
# ============================================================


async def stop_campaign_scheduler() -> None:
    """
    Stop scheduler and queue workers cleanly.
    """

    global _scheduler_task
    global _scheduler_stop_event
    global _worker_tasks

    # --------------------------------------------------------
    # Stop scheduler
    # --------------------------------------------------------

    if _scheduler_task is not None:

        _scheduler_task.cancel()

        try:

            await _scheduler_task

        except asyncio.CancelledError:

            pass

        _scheduler_task = None

    # --------------------------------------------------------
    # Stop workers
    # --------------------------------------------------------

    for task in _worker_tasks:

        task.cancel()

    for task in _worker_tasks:

        try:

            await task

        except asyncio.CancelledError:

            pass

    _worker_tasks = []

    _scheduler_stop_event = None

    print(
        "Campaign scheduling system stopped."
    )
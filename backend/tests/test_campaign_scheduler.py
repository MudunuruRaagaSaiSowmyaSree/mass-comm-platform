import asyncio
from datetime import datetime, timedelta
from uuid import uuid4

import pytest

from app.models.campaign_schedule import (
    CampaignSchedule,
    ScheduleFrequency,
    ScheduleStatus,
)

from app.services.campaign_scheduler import (
    calculate_next_run,
    has_reached_occurrence_limit,
)
from app.services.campaign_queue import (
    CampaignQueue,
)


# ============================================================
# CALCULATE NEXT RUN
# ============================================================


def make_schedule(
    frequency,
    interval=1,
    max_occurrences=None,
    occurrence_count=0,
):
    return CampaignSchedule(
        campaign_id=uuid4(),
        scheduled_at=datetime(2030, 1, 1, 10, 0, 0),
        timezone="UTC",
        frequency=frequency,
        interval=interval,
        max_occurrences=max_occurrences,
        occurrence_count=occurrence_count,
        status=ScheduleStatus.ACTIVE,
        enabled=True,
        priority=5,
    )


def test_calculate_next_run_one_time():

    schedule = make_schedule(
        ScheduleFrequency.ONE_TIME
    )

    current = datetime(
        2030,
        1,
        1,
        10,
        0,
        0,
    )

    result = calculate_next_run(
        schedule,
        current,
    )

    assert result is None


def test_calculate_next_run_hourly():

    schedule = make_schedule(
        ScheduleFrequency.HOURLY,
        interval=2,
    )

    current = datetime(
        2030,
        1,
        1,
        10,
        0,
        0,
    )

    result = calculate_next_run(
        schedule,
        current,
    )

    assert result == datetime(
        2030,
        1,
        1,
        12,
        0,
        0,
    )


def test_calculate_next_run_daily():

    schedule = make_schedule(
        ScheduleFrequency.DAILY,
        interval=3,
    )

    current = datetime(
        2030,
        1,
        1,
        10,
        0,
        0,
    )

    result = calculate_next_run(
        schedule,
        current,
    )

    assert result == datetime(
        2030,
        1,
        4,
        10,
        0,
        0,
    )


def test_calculate_next_run_weekly():

    schedule = make_schedule(
        ScheduleFrequency.WEEKLY,
        interval=2,
    )

    current = datetime(
        2030,
        1,
        1,
        10,
        0,
        0,
    )

    result = calculate_next_run(
        schedule,
        current,
    )

    assert result == datetime(
        2030,
        1,
        15,
        10,
        0,
        0,
    )


def test_calculate_next_run_monthly():

    schedule = make_schedule(
        ScheduleFrequency.MONTHLY,
        interval=1,
    )

    current = datetime(
        2030,
        1,
        15,
        10,
        0,
        0,
    )

    result = calculate_next_run(
        schedule,
        current,
    )

    assert result == datetime(
        2030,
        2,
        15,
        10,
        0,
        0,
    )


def test_calculate_next_run_month_end_is_safe():

    schedule = make_schedule(
        ScheduleFrequency.MONTHLY,
        interval=1,
    )

    current = datetime(
        2030,
        1,
        31,
        10,
        0,
        0,
    )

    result = calculate_next_run(
        schedule,
        current,
    )

    assert result == datetime(
        2030,
        2,
        28,
        10,
        0,
        0,
    )


# ============================================================
# OCCURRENCE LIMIT
# ============================================================


def test_occurrence_limit_none():

    schedule = make_schedule(
        ScheduleFrequency.DAILY,
        max_occurrences=None,
        occurrence_count=100,
    )

    assert (
        has_reached_occurrence_limit(
            schedule
        )
        is False
    )


def test_occurrence_limit_not_reached():

    schedule = make_schedule(
        ScheduleFrequency.DAILY,
        max_occurrences=5,
        occurrence_count=3,
    )

    assert (
        has_reached_occurrence_limit(
            schedule
        )
        is False
    )


def test_occurrence_limit_reached():

    schedule = make_schedule(
        ScheduleFrequency.DAILY,
        max_occurrences=5,
        occurrence_count=5,
    )

    assert (
        has_reached_occurrence_limit(
            schedule
        )
        is True
    )


# ============================================================
# QUEUE
# ============================================================


@pytest.mark.asyncio
async def test_queue_add_and_get():

    queue = CampaignQueue()

    campaign_id = str(uuid4())

    added = await queue.add(
        campaign_id=campaign_id,
        priority=3,
    )

    assert added is True
    assert queue.size() == 1
    assert await queue.is_queued(
        campaign_id
    )

    item = await queue.get()

    assert item.campaign_id == campaign_id
    assert item.priority == 3

    await queue.complete(
        campaign_id
    )

    assert (
        await queue.is_queued(
            campaign_id
        )
        is False
    )

    assert queue.empty()


@pytest.mark.asyncio
async def test_queue_prevents_duplicate_campaign():

    queue = CampaignQueue()

    campaign_id = str(uuid4())

    first = await queue.add(
        campaign_id=campaign_id,
        priority=5,
    )

    second = await queue.add(
        campaign_id=campaign_id,
        priority=1,
    )

    assert first is True
    assert second is False
    assert queue.size() == 1

    item = await queue.get()

    await queue.complete(
        item.campaign_id
    )


@pytest.mark.asyncio
async def test_queue_priority():

    queue = CampaignQueue()

    low_priority_campaign = str(uuid4())
    high_priority_campaign = str(uuid4())

    await queue.add(
        campaign_id=low_priority_campaign,
        priority=8,
    )

    await queue.add(
        campaign_id=high_priority_campaign,
        priority=2,
    )

    first = await queue.get()

    assert (
        first.campaign_id
        == high_priority_campaign
    )

    await queue.complete(
        first.campaign_id
    )

    second = await queue.get()

    assert (
        second.campaign_id
        == low_priority_campaign
    )

    await queue.complete(
        second.campaign_id
    )


@pytest.mark.asyncio
async def test_queue_same_priority_preserves_order():

    queue = CampaignQueue()

    first_campaign = str(uuid4())
    second_campaign = str(uuid4())

    await queue.add(
        campaign_id=first_campaign,
        priority=5,
    )

    await queue.add(
        campaign_id=second_campaign,
        priority=5,
    )

    first = await queue.get()

    assert (
        first.campaign_id
        == first_campaign
    )

    await queue.complete(
        first.campaign_id
    )

    second = await queue.get()

    assert (
        second.campaign_id
        == second_campaign
    )

    await queue.complete(
        second.campaign_id
    )


# ============================================================
# QUEUE NORMALIZATION
# ============================================================


@pytest.mark.asyncio
async def test_queue_normalizes_campaign_id():

    queue = CampaignQueue()

    campaign_id = uuid4()

    added = await queue.add(
        campaign_id=campaign_id,
        priority=5,
    )

    assert added is True

    assert await queue.is_queued(
        str(campaign_id)
    )

    item = await queue.get()

    assert (
        item.campaign_id
        == str(campaign_id)
    )

    await queue.complete(
        campaign_id
    )


# ============================================================
# PRIORITY CLAMPING
# ============================================================


@pytest.mark.asyncio
async def test_queue_clamps_priority():

    queue = CampaignQueue()

    campaign_one = str(uuid4())
    campaign_two = str(uuid4())

    await queue.add(
        campaign_id=campaign_one,
        priority=-100,
    )

    await queue.add(
        campaign_id=campaign_two,
        priority=100,
    )

    first = await queue.get()

    assert first.priority == 1

    await queue.complete(
        first.campaign_id
    )

    second = await queue.get()

    assert second.priority == 10

    await queue.complete(
        second.campaign_id
    )

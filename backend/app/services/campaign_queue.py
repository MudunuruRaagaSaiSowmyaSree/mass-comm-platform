"""
Campaign delivery queue.

This queue provides a lightweight in-process priority queue
for scheduled campaigns.

Priority:
    1 = highest priority
    10 = lowest priority

The queue does not replace the existing Module 1 channel
dispatcher.

It only decides which scheduled campaigns should be processed
first.

Actual campaign delivery continues through:

    app.routers.campaign_delivery

and therefore continues to use:

    app.services.channel_dispatcher
"""


import asyncio
from dataclasses import dataclass
from typing import Optional


# ============================================================
# QUEUE ITEM
# ============================================================


@dataclass(order=True)
class CampaignQueueItem:
    """
    One campaign waiting for delivery.

    Lower priority number means higher priority.
    """

    priority: int
    sequence: int
    campaign_id: str


# ============================================================
# CAMPAIGN QUEUE
# ============================================================


class CampaignQueue:
    """
    In-memory priority queue for campaign delivery.

    This is intentionally lightweight so Module 2 can work
    without introducing Redis/Celery yet.

    It is suitable for the current application architecture
    and development environment.
    """

    def __init__(self) -> None:

        self._queue: asyncio.PriorityQueue[
            CampaignQueueItem
        ] = asyncio.PriorityQueue()

        self._sequence: int = 0

        self._queued_campaigns: set[str] = set()

        self._lock = asyncio.Lock()

    # ========================================================
    # ADD CAMPAIGN
    # ========================================================

    async def add(
        self,
        campaign_id: str,
        priority: int = 5,
    ) -> bool:
        """
        Add a campaign to the queue.

        Returns:

            True
                Campaign was added.

            False
                Campaign was already queued.
        """

        campaign_id = str(
            campaign_id
        )

        priority = max(
            1,
            min(
                int(priority),
                10,
            ),
        )

        async with self._lock:

            if campaign_id in self._queued_campaigns:

                return False

            self._sequence += 1

            item = CampaignQueueItem(
                priority=priority,
                sequence=self._sequence,
                campaign_id=campaign_id,
            )

            self._queued_campaigns.add(
                campaign_id
            )

            await self._queue.put(
                item
            )

            return True

    # ========================================================
    # GET NEXT CAMPAIGN
    # ========================================================

    async def get(
        self,
    ) -> CampaignQueueItem:
        """
        Wait for and return the next campaign.
        """

        item = await self._queue.get()

        return item

    # ========================================================
    # MARK COMPLETE
    # ========================================================

    async def complete(
        self,
        campaign_id: str,
    ) -> None:
        """
        Remove a campaign from the active queue set.
        """

        campaign_id = str(
            campaign_id
        )

        async with self._lock:

            self._queued_campaigns.discard(
                campaign_id
            )

        self._queue.task_done()

    # ========================================================
    # CHECK QUEUED
    # ========================================================

    async def is_queued(
        self,
        campaign_id: str,
    ) -> bool:
        """
        Check whether a campaign is already queued.
        """

        campaign_id = str(
            campaign_id
        )

        async with self._lock:

            return (
                campaign_id
                in self._queued_campaigns
            )

    # ========================================================
    # SIZE
    # ========================================================

    def size(self) -> int:
        """
        Return approximate queue size.
        """

        return self._queue.qsize()

    # ========================================================
    # EMPTY
    # ========================================================

    def empty(self) -> bool:
        """
        Return True when the queue is empty.
        """

        return self._queue.empty()


# ============================================================
# GLOBAL QUEUE
# ============================================================


campaign_queue = CampaignQueue()
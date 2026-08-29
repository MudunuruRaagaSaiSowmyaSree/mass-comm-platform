import uuid
from datetime import datetime

import pytest
import pytest_asyncio

from httpx import (
    AsyncClient,
    ASGITransport,
)

from sqlalchemy import select

from backend.app.main import app

from app.database import (
    Base,
    get_db,
)

from tests.conftest import (
    engine,
    TestSessionLocal,
)

from app.models.audience import (
    AudienceMember,
)

from app.models.campaign import (
    Campaign,
    CampaignStatus,
)

from app.models.campaign_recipient import (
    CampaignRecipient,
    RecipientStatus,
)

from app.models.message_delivery import (
    MessageDelivery,
)

from app.models.engagement_event import (
    EngagementEvent,
    EngagementType,
)

from app.models.channel_config import (
    ChannelConfig,
)


# ============================================================
# DATABASE OVERRIDE
# ============================================================


async def override_test_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_test_db


# ============================================================
# DATABASE SETUP
# ============================================================


@pytest_asyncio.fixture(
    scope="function",
    autouse=True,
)
async def setup_module3_db():

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all
        )

    yield

    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.drop_all
        )


# ============================================================
# CLIENT
# ============================================================


@pytest_asyncio.fixture
async def module3_client():

    transport = ASGITransport(
        app=app
    )

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:

        yield client


# ============================================================
# CREATE TEST USER
# ============================================================


async def create_test_user(
    client: AsyncClient,
):

    response = await client.post(
        "/auth/register",
        json={
            "name": "Module 3 Admin",
            "email": "module3_admin@example.com",
            "password": "TestPass123!",
            "role": "admin",
            "admin_id": "M3ADMIN001",
        },
    )

    assert response.status_code == 200, response.text

    login = await client.post(
        "/auth/login",
        data={
            "username": "module3_admin@example.com",
            "password": "TestPass123!",
        },
    )

    assert login.status_code == 200, login.text

    token = login.json()["access_token"]

    return {
        "Authorization": f"Bearer {token}"
    }


# ============================================================
# CREATE AUDIENCE
# ============================================================


async def create_test_audience(
    db,
):

    member = AudienceMember(
        name="Module 3 Test Member",
        email="module3@example.com",
        phone="919999999999",
        language="en",
        geography="Test",
        occupation="Tester",
    )

    db.add(member)

    await db.commit()
    await db.refresh(member)

    return member


# ============================================================
# ENABLE EMAIL CHANNEL
# ============================================================


async def enable_email_channel(
    db,
):

    result = await db.execute(
        select(ChannelConfig).where(
            ChannelConfig.channel == "email"
        )
    )

    config = result.scalar_one_or_none()

    if config is None:

        config = ChannelConfig(
            channel="email",
            enabled=True,
            config={
                "provider": "smtp",
                "host": "localhost",
                "port": 1025,
                "from_email": "test@example.com",
            },
        )

        db.add(config)

    else:

        config.enabled = True

        config.config = {
            "provider": "smtp",
            "host": "localhost",
            "port": 1025,
            "from_email": "test@example.com",
        }

    await db.commit()


# ============================================================
# CREATE CAMPAIGN
# ============================================================


async def create_campaign_directly(
    db,
    user_id,
):

    campaign = Campaign(
        title="Module 3 Test Campaign",
        content="Module 3 delivery test message.",
        type="awareness",
        status=CampaignStatus.READY,
        created_by=user_id,
        target_filters={},
        channels=["email"],
    )

    db.add(campaign)

    await db.commit()
    await db.refresh(campaign)

    return campaign


# ============================================================
# CREATE RECIPIENT
# ============================================================


async def create_recipient_directly(
    db,
    campaign_id,
    audience_member_id,
):

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
# TEST 1 - DELIVERY RECORD
# ============================================================


@pytest.mark.asyncio
async def test_module3_delivery_record(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    me = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert me.status_code == 200, me.text

    user_id = uuid.UUID(
        me.json()["id"]
    )

    async with TestSessionLocal() as db:

        audience = await create_test_audience(
            db
        )

        campaign = await create_campaign_directly(
            db,
            user_id,
        )

        recipient = await create_recipient_directly(
            db,
            campaign.id,
            audience.id,
        )

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.SENT,
            provider="smtp",
            provider_message_id=None,
            sent_at=datetime.utcnow(),
        )

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        campaign_id = campaign.id
        delivery_id = delivery.id

    response = await module3_client.get(
        f"/message-delivery/campaign/{campaign_id}",
        headers=headers,
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["total"] == 1
    assert len(data["records"]) == 1

    record = data["records"][0]

    assert record["id"] == str(
        delivery_id
    )

    assert record["status"] == "sent"
    assert record["channel"] == "email"
    assert record["provider"] == "smtp"


# ============================================================
# TEST 2 - ENGAGEMENT TRACKING
# ============================================================


@pytest.mark.asyncio
async def test_module3_engagement_tracking(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    me = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert me.status_code == 200

    user_id = uuid.UUID(
        me.json()["id"]
    )

    async with TestSessionLocal() as db:

        audience = await create_test_audience(
            db
        )

        campaign = await create_campaign_directly(
            db,
            user_id,
        )

        recipient = await create_recipient_directly(
            db,
            campaign.id,
            audience.id,
        )

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.SENT,
            provider="smtp",
            sent_at=datetime.utcnow(),
        )

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        delivery_id = delivery.id

    response = await module3_client.get(
        f"/delivery-tracking/{delivery_id}/engagement",
        headers=headers,
    )

    assert response.status_code == 200, response.text

    assert response.json()["events"] == []

    response = await module3_client.post(
        f"/delivery-tracking/{delivery_id}/engagement",
        json={
            "event_type": "open",
            "metadata": {
                "source": "module3_test",
            },
        },
        headers=headers,
    )

    assert response.status_code == 200, response.text

    event_data = response.json()

    assert event_data["success"] is True
    assert event_data["event_type"] == "open"

    response = await module3_client.get(
        f"/delivery-tracking/{delivery_id}/engagement",
        headers=headers,
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert len(data["events"]) == 1

    event = data["events"][0]

    assert event["type"] == "open"

    assert (
        event["metadata"]["source"]
        == "module3_test"
    )


# ============================================================
# TEST 3 - DELIVERY STATUS UPDATE
# ============================================================


@pytest.mark.asyncio
async def test_module3_delivery_status_update(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    me = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert me.status_code == 200

    user_id = uuid.UUID(
        me.json()["id"]
    )

    async with TestSessionLocal() as db:

        audience = await create_test_audience(
            db
        )

        campaign = await create_campaign_directly(
            db,
            user_id,
        )

        recipient = await create_recipient_directly(
            db,
            campaign.id,
            audience.id,
        )

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.SENT,
            provider="smtp",
            sent_at=datetime.utcnow(),
        )

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        delivery_id = delivery.id

    response = await module3_client.post(
        f"/delivery-tracking/{delivery_id}/status",
        json={
            "status": "delivered",
        },
        headers=headers,
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["success"] is True

    assert data["status"] == "delivered"

    assert data["delivered_at"] is not None


# ============================================================
# TEST 4 - DASHBOARD
# ============================================================


@pytest.mark.asyncio
async def test_module3_dashboard(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    me = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert me.status_code == 200

    user_id = uuid.UUID(
        me.json()["id"]
    )

    async with TestSessionLocal() as db:

        audience = await create_test_audience(
            db
        )

        campaign = await create_campaign_directly(
            db,
            user_id,
        )

        recipient = await create_recipient_directly(
            db,
            campaign.id,
            audience.id,
        )

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.DELIVERED,
            provider="smtp",
            sent_at=datetime.utcnow(),
            delivered_at=datetime.utcnow(),
        )

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        event = EngagementEvent(
            delivery_id=delivery.id,
            campaign_id=campaign.id,
            audience_member_id=audience.id,
            event_type=EngagementType.OPEN,
            event_at=datetime.utcnow(),
            event_metadata={
                "source": "module3_dashboard_test"
            },
        )

        db.add(event)

        await db.commit()

        campaign_id = campaign.id

    response = await module3_client.get(
        f"/delivery-tracking/campaign/{campaign_id}/dashboard",
        headers=headers,
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["total_recipients"] == 1

    assert data["total_deliveries"] == 1

    assert (
        data["delivery_status"]["delivered"]
        == 1
    )

    assert (
        data["engagement"]["opens"]
        == 1
    )

    assert (
        data["rates"]["open_rate"]
        == 100.0
    )


# ============================================================
# TEST 5 - DELIVERY LOGS
# ============================================================


@pytest.mark.asyncio
async def test_module3_delivery_logs(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    me = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert me.status_code == 200

    user_id = uuid.UUID(
        me.json()["id"]
    )

    async with TestSessionLocal() as db:

        audience = await create_test_audience(
            db
        )

        campaign = await create_campaign_directly(
            db,
            user_id,
        )

        recipient = await create_recipient_directly(
            db,
            campaign.id,
            audience.id,
        )

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.SENT,
            provider="smtp",
            sent_at=datetime.utcnow(),
        )

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        event = EngagementEvent(
            delivery_id=delivery.id,
            campaign_id=campaign.id,
            audience_member_id=audience.id,
            event_type=EngagementType.OPEN,
            event_at=datetime.utcnow(),
            event_metadata={
                "source": "module3_logs_test"
            },
        )

        db.add(event)

        await db.commit()

        campaign_id = campaign.id

    response = await module3_client.get(
        f"/delivery-tracking/campaign/{campaign_id}/logs",
        headers=headers,
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert data["total_logs"] == 1

    log = data["logs"][0]

    assert log["channel"] == "email"

    assert log["status"] == "sent"

    assert len(
        log["engagement_events"]
    ) == 1

    assert (
        log["engagement_events"][0]["type"]
        == "open"
    )


# ============================================================
# TEST 6 - RETRY
# ============================================================


@pytest.mark.asyncio
async def test_module3_retry(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    me = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert me.status_code == 200

    user_id = uuid.UUID(
        me.json()["id"]
    )

    async with TestSessionLocal() as db:

        audience = await create_test_audience(
            db
        )

        campaign = await create_campaign_directly(
            db,
            user_id,
        )

        recipient = await create_recipient_directly(
            db,
            campaign.id,
            audience.id,
        )

        delivery = MessageDelivery(
            recipient_id=recipient.id,
            channel="email",
            status=RecipientStatus.FAILED,
            provider="smtp",
            sent_at=None,
            failed_at=datetime.utcnow(),
            error_message="Initial failure",
            retry_count=0,
            max_retries=3,
        )

        db.add(delivery)

        await db.commit()
        await db.refresh(delivery)

        delivery_id = delivery.id

    response = await module3_client.post(
        f"/delivery-tracking/{delivery_id}/retry",
        headers=headers,
    )

    assert response.status_code in {
        200,
        400,
    }

    if response.status_code == 200:

        data = response.json()

        assert data["retry_count"] == 1

        assert data["status"] in {
            "sent",
            "failed",
        }

    else:

        assert (
            "cannot be retried"
            in response.text.lower()
            or "channel"
            in response.text.lower()
        )


# ============================================================
# TEST 7 - MODULE 3 SMOKE
# ============================================================


@pytest.mark.asyncio
async def test_module3_smoke(
    module3_client,
):

    headers = await create_test_user(
        module3_client
    )

    # --------------------------------------------------------
    # Health
    # --------------------------------------------------------

    response = await module3_client.get(
        "/"
    )

    assert response.status_code == 200

    # --------------------------------------------------------
    # Supported channels
    #
    # API response format:
    #
    # {
    #     "channels": [
    #         {
    #             "channel": "email",
    #             "enabled": false
    #         }
    #     ]
    # }
    # --------------------------------------------------------

    response = await module3_client.get(
        "/channel-config/supported"
    )

    assert response.status_code == 200, response.text

    data = response.json()

    assert "channels" in data

    channels = data["channels"]

    assert isinstance(
        channels,
        list,
    )

    channel_names = {
        item["channel"]
        for item in channels
    }

    assert "email" in channel_names
    assert "sms" in channel_names
    assert "whatsapp" in channel_names
    assert "push" in channel_names
    assert "web_broadcast" in channel_names

    # --------------------------------------------------------
    # Auth
    # --------------------------------------------------------

    response = await module3_client.get(
        "/auth/me",
        headers=headers,
    )

    assert response.status_code == 200
import pytest


@pytest.mark.asyncio
async def test_full_m1_flow(client):
    # ============================================================
    # 1. Register an admin-track user and a comms_team user
    # ============================================================

    register_resp = await client.post(
        "/auth/register",
        json={
            "name": "Admin Test",
            "email": "admin_test@example.com",
            "password": "adminpass123",
            "role": "comms_team",
        },
    )

    assert register_resp.status_code == 200, register_resp.text

    register_resp = await client.post(
        "/auth/register",
        json={
            "name": "Comms Test",
            "email": "comms_test@example.com",
            "password": "commspass123",
            "role": "comms_team",
        },
    )

    assert register_resp.status_code == 200, register_resp.text

    # ============================================================
    # 2. Log in as the first user
    # ============================================================

    login_resp = await client.post(
        "/auth/login",
        data={
            "username": "admin_test@example.com",
            "password": "adminpass123",
        },
    )

    assert login_resp.status_code == 200, login_resp.text

    admin_token = login_resp.json()["access_token"]

    admin_headers = {
        "Authorization": f"Bearer {admin_token}"
    }

    # ============================================================
    # Promote the test user directly in the test database
    # ============================================================

    from sqlalchemy import text
    from tests.conftest import TestSessionLocal

    async with TestSessionLocal() as session:
        await session.execute(
            text(
                "UPDATE users "
                "SET role = 'ADMIN' "
                "WHERE email = 'admin_test@example.com'"
            )
        )

        await session.commit()

    # ============================================================
    # Re-login to get a fresh token
    # ============================================================

    login_resp = await client.post(
        "/auth/login",
        data={
            "username": "admin_test@example.com",
            "password": "adminpass123",
        },
    )

    assert login_resp.status_code == 200, login_resp.text

    admin_token = login_resp.json()["access_token"]

    admin_headers = {
        "Authorization": f"Bearer {admin_token}"
    }

    # ============================================================
    # Login as comms_team user
    # ============================================================

    login_resp = await client.post(
        "/auth/login",
        data={
            "username": "comms_test@example.com",
            "password": "commspass123",
        },
    )

    assert login_resp.status_code == 200, login_resp.text

    comms_token = login_resp.json()["access_token"]

    comms_headers = {
        "Authorization": f"Bearer {comms_token}"
    }

    # ============================================================
    # 3. Create audience members as admin
    # ============================================================

    response = await client.post(
        "/audience/",
        json={
            "name": "Test Member 1",
            "language": "hi",
            "geography": "Bihar",
        },
        headers=admin_headers,
    )

    assert response.status_code == 200, response.text

    response = await client.post(
        "/audience/",
        json={
            "name": "Test Member 2",
            "language": "hi",
            "geography": "Bihar",
        },
        headers=admin_headers,
    )

    assert response.status_code == 200, response.text

    response = await client.post(
        "/audience/",
        json={
            "name": "Test Member 3",
            "language": "pa",
            "geography": "Punjab",
        },
        headers=admin_headers,
    )

    assert response.status_code == 200, response.text

    # ============================================================
    # 4. Segment by language=hi
    # ============================================================

    segment_resp = await client.get(
        "/audience/segment",
        params={
            "language": "hi",
        },
        headers=admin_headers,
    )

    assert segment_resp.status_code == 200, segment_resp.text
    assert len(segment_resp.json()) == 2

    count_resp = await client.get(
        "/audience/segment/count",
        params={
            "language": "hi",
        },
        headers=admin_headers,
    )

    assert count_resp.status_code == 200, count_resp.text
    assert count_resp.json()["count"] == 2

    # ============================================================
    # 5. Create a campaign targeting that segment
    #
    # CampaignCreate requires:
    #   title
    #   content
    #   type
    #
    # ============================================================

    campaign_resp = await client.post(
        "/campaigns/",
        json={
            "title": "Integration Test Campaign",
            "content": "This is an integration test campaign.",
            "type": "awareness",
            "target_filters": {
                "language": "hi",
            },
            "channels": [
                "email",
            ],
        },
        headers=admin_headers,
    )

    assert campaign_resp.status_code == 200, campaign_resp.text

    campaign = campaign_resp.json()

    assert campaign["status"] == "draft"

    campaign_id = campaign["id"]

    # ============================================================
    # 6. Transition draft -> review
    # ============================================================

    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={
            "new_status": "review",
        },
        headers=admin_headers,
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "review"

    # ============================================================
    # 7. Transition review -> ready
    # ============================================================

    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={
            "new_status": "ready",
        },
        headers=admin_headers,
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "ready"

    # ============================================================
    # 8. Set schedule before scheduled transition
    #
    # The campaign router requires scheduled_at before
    # ready -> scheduled.
    # ============================================================

    resp = await client.put(
        f"/campaigns/{campaign_id}/schedule",
        params={
            "scheduled_at": "2030-01-01T10:00:00",
        },
        headers=admin_headers,
    )

    assert resp.status_code == 200, resp.text

    assert resp.json()["scheduled_at"] is not None

    # ============================================================
    # 9. Transition ready -> scheduled
    # ============================================================

    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={
            "new_status": "scheduled",
        },
        headers=admin_headers,
    )

    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "scheduled"

    # ============================================================
    # 10. Invalid transition: scheduled -> review
    # ============================================================

    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={
            "new_status": "review",
        },
        headers=admin_headers,
    )

    assert resp.status_code == 400

    # ============================================================
    # 11. RBAC:
    # comms_team cannot transition campaigns
    # ============================================================

    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={
            "new_status": "sending",
        },
        headers=comms_headers,
    )

    assert resp.status_code == 403

    # ============================================================
    # 12. RBAC:
    # comms_team can still view campaigns
    # ============================================================

    resp = await client.get(
        "/campaigns/",
        headers=comms_headers,
    )

    assert resp.status_code == 200, resp.text

    # ============================================================
    # 13. RBAC:
    # comms_team can create templates
    # ============================================================

    resp = await client.post(
        "/templates/",
        json={
            "name": "Test Template",
            "campaign_type": "awareness",
            "body": "Hello {name}",
            "language": "hi",
        },
        headers=comms_headers,
    )

    assert resp.status_code == 200, resp.text

    # ============================================================
    # 14. RBAC:
    # comms_team cannot create campaigns
    # ============================================================

    resp = await client.post(
        "/campaigns/",
        json={
            "title": "Should Fail",
            "content": "This campaign should be rejected.",
            "type": "awareness",
        },
        headers=comms_headers,
    )

    assert resp.status_code == 403
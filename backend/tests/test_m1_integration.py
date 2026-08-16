import pytest


@pytest.mark.asyncio
async def test_full_m1_flow(client):
    # 1. Register an admin-track user and a comms_team user
    await client.post("/auth/register", json={
        "email": "admin_test@example.com", "password": "adminpass123"
    })
    await client.post("/auth/register", json={
        "email": "comms_test@example.com", "password": "commspass123"
    })

    # 2. Log in as the first user (will manually promote to admin next)
    login_resp = await client.post(
        "/auth/login",
        data={"username": "admin_test@example.com", "password": "adminpass123"},
    )
    assert login_resp.status_code == 200
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # NOTE: since we can't promote via API yet, this test creates the user
    # via register (defaults to comms_team) then relies on RBAC still blocking
    # correctly. To fully test admin-only paths, we directly patch the role
    # in the test database via a raw SQL update.
    from sqlalchemy import text
    from tests.conftest import TestSessionLocal

    async with TestSessionLocal() as session:
        await session.execute(
            text("UPDATE users SET role = 'ADMIN' WHERE email = 'admin_test@example.com'")
        )
        await session.commit()

    # Re-login to get a fresh token reflecting admin role (role is read at
    # request time via DB lookup, not baked into the token, so this isn't
    # strictly necessary — but re-login mirrors real usage)
    login_resp = await client.post(
        "/auth/login",
        data={"username": "admin_test@example.com", "password": "adminpass123"},
    )
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    login_resp = await client.post(
        "/auth/login",
        data={"username": "comms_test@example.com", "password": "commspass123"},
    )
    comms_token = login_resp.json()["access_token"]
    comms_headers = {"Authorization": f"Bearer {comms_token}"}

    # 3. Create audience members as admin
    await client.post("/audience/", json={
        "name": "Test Member 1", "language": "hi", "geography": "Bihar"
    }, headers=admin_headers)
    await client.post("/audience/", json={
        "name": "Test Member 2", "language": "hi", "geography": "Bihar"
    }, headers=admin_headers)
    await client.post("/audience/", json={
        "name": "Test Member 3", "language": "pa", "geography": "Punjab"
    }, headers=admin_headers)

    # 4. Segment by language=hi -> expect 2 matches
    segment_resp = await client.get(
        "/audience/segment", params={"language": "hi"}, headers=admin_headers
    )
    assert segment_resp.status_code == 200
    assert len(segment_resp.json()) == 2

    count_resp = await client.get(
        "/audience/segment/count", params={"language": "hi"}, headers=admin_headers
    )
    assert count_resp.json()["count"] == 2

    # 5. Create a campaign targeting that segment
    campaign_resp = await client.post(
        "/campaigns/",
        json={
            "title": "Integration Test Campaign",
            "type": "awareness",
            "target_filters": {"language": "hi"},
        },
        headers=admin_headers,
    )
    assert campaign_resp.status_code == 200
    campaign = campaign_resp.json()
    assert campaign["status"] == "draft"
    campaign_id = campaign["id"]

    # 6. Transition draft -> review -> scheduled
    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={"new_status": "review"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "review"

    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={"new_status": "scheduled"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "scheduled"

    # 7. Invalid transition (scheduled -> review) should fail
    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={"new_status": "review"},
        headers=admin_headers,
    )
    assert resp.status_code == 400

    # 8. RBAC: comms_team cannot transition campaigns
    resp = await client.post(
        f"/campaigns/{campaign_id}/transition",
        json={"new_status": "sending"},
        headers=comms_headers,
    )
    assert resp.status_code == 403

    # 9. RBAC: comms_team CAN still view campaigns
    resp = await client.get("/campaigns/", headers=comms_headers)
    assert resp.status_code == 200

    # 10. RBAC: comms_team CAN create templates
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
    assert resp.status_code == 200

    # 11. RBAC: comms_team CANNOT create campaigns
    resp = await client.post(
        "/campaigns/",
        json={"title": "Should Fail", "type": "awareness"},
        headers=comms_headers,
    )
    assert resp.status_code == 403
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models.user import User, Role
from app.core.security import get_password_hash
from app.services.memory import memory_service

def test_long_term_memory_flow(client: TestClient, session: Session):
    # Setup test users
    hashed = get_password_hash("pass123")
    user1 = User(email="user1@example.com", hashed_password=hashed, is_active=True, role=Role.USER)
    user2 = User(email="user2@example.com", hashed_password=hashed, is_active=True, role=Role.USER)
    session.add(user1)
    session.add(user2)
    session.commit()
    session.refresh(user1)
    session.refresh(user2)

    # Login User 1
    login1 = client.post("/api/v1/auth/login", json={"email": "user1@example.com", "password": "pass123"})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Login User 2
    login2 = client.post("/api/v1/auth/login", json={"email": "user2@example.com", "password": "pass123"})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Add memory for User 1
    add_res = client.post(
        "/api/v1/memory/add?fact=I+like+coffee+with+no+sugar",
        headers=headers1
    )
    assert add_res.status_code == 201
    add_data = add_res.json()
    assert add_data["status"] == "success"
    memory_id = add_data["memory_id"]

    # Search memory for User 1 should find it
    search_res = client.get(
        "/api/v1/memory/search?query=coffee",
        headers=headers1
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["results"]) > 0
    assert "coffee" in search_data["results"][0]["content"]

    # Search memory for User 2 should NOT find it (ownership check)
    search_res2 = client.get(
        "/api/v1/memory/search?query=coffee",
        headers=headers2
    )
    assert search_res2.status_code == 200
    search_data2 = search_res2.json()
    assert len(search_data2["results"]) == 0

    # User 2 attempts to delete User 1's memory -> Should be rejected with 403
    delete_fail_res = client.delete(
        f"/api/v1/memory/delete/{memory_id}",
        headers=headers2
    )
    assert delete_fail_res.status_code == 403

    # User 1 deletes their own memory -> Should succeed
    delete_success_res = client.delete(
        f"/api/v1/memory/delete/{memory_id}",
        headers=headers1
    )
    assert delete_success_res.status_code == 200
    assert delete_success_res.json()["status"] == "success"

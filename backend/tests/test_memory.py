import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models.user import User, Role
from app.services.memory import memory_service

def test_long_term_memory_flow(client: TestClient, session: Session):

    # Add memory for the default user
    add_res = client.post(
        "/api/v1/memory/add?fact=I+like+coffee+with+no+sugar"
    )
    assert add_res.status_code == 201
    add_data = add_res.json()
    assert add_data["status"] == "success"
    memory_id = add_data["memory_id"]

    # Search memory should find it
    search_res = client.get(
        "/api/v1/memory/search?query=coffee"
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["results"]) > 0
    assert "coffee" in search_data["results"][0]["content"]

    # Delete memory -> Should succeed
    delete_success_res = client.delete(
        f"/api/v1/memory/delete/{memory_id}"
    )
    assert delete_success_res.status_code == 200
    assert delete_success_res.json()["status"] == "success"

import os
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.user import User, Role
from app.models.file import FileMetadata
from app.core.security import get_password_hash
from app.services.file_ingest import ingest_file_in_background, chunk_text

def test_chunk_text():
    text = "abcdefghij" # 10 chars
    # Size 4, overlap 1
    # Chunk 1: abcd (0 to 4)
    # Chunk 2: defg (3 to 7)
    # Chunk 3: ghij (6 to 10)
    chunks = chunk_text(text, chunk_size=4, overlap=1)
    assert len(chunks) == 3
    assert chunks[0] == "abcd"
    assert chunks[1] == "defg"
    assert chunks[2] == "ghij"

def test_upload_and_status(client: TestClient, session: Session, tmp_path):
    # Setup test user
    hashed = get_password_hash("pass123")
    user = User(email="fileuser@example.com", hashed_password=hashed, is_active=True, role=Role.USER)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Login
    login_res = client.post("/api/v1/auth/login", json={"email": "fileuser@example.com", "password": "pass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload mock text file
    file_content = b"This is a mock text file content for testing semantic ingestion."
    response = client.post(
        "/api/v1/files/upload",
        files={"file": ("mock.txt", file_content, "text/plain")},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "mock.txt"
    assert data["status"] == "pending"
    file_id = data["id"]

    # Verify status via endpoint
    status_res = client.get(f"/api/v1/files/{file_id}/status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] in ("pending", "processing", "completed")

    # Verify listing
    list_res = client.get("/api/v1/files/list", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["filename"] == "mock.txt"

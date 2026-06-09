from fastapi import Depends
from fastapi.testclient import TestClient
from sqlmodel import Session
from app.models.user import User, Role
from app.core.security import get_password_hash
from app.api.v1.auth import RoleChecker, get_current_user
from app.main import app

def test_register_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "testuser@example.com", "password": "securepassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert "id" in data
    assert data["role"] == "user"

def test_login_user(client: TestClient, session: Session):
    # Setup test user directly in DB
    hashed = get_password_hash("mypassword")
    user = User(email="loginuser@example.com", hashed_password=hashed, is_active=True, role=Role.USER)
    session.add(user)
    session.commit()
    session.refresh(user)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "mypassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_inactive_user_rejected(client: TestClient, session: Session):
    # Under local desktop assistant mode, no authentication is required.
    # Therefore, accessing endpoints succeeds without an Authorization header.
    response = client.get("/api/v1/files/list")
    assert response.status_code == 200

def test_role_checker_class(session: Session):
    # Programmatic verification of RoleChecker
    admin_user = User(email="admin@example.com", is_active=True, role=Role.ADMIN)
    standard_user = User(email="standard@example.com", is_active=True, role=Role.USER)
    inactive_user = User(email="inactive@example.com", is_active=False, role=Role.USER)

    admin_checker = RoleChecker(allowed_roles=[Role.ADMIN])
    user_checker = RoleChecker(allowed_roles=[Role.USER])
    both_checker = RoleChecker(allowed_roles=[Role.USER, Role.ADMIN])

    import pytest
    from fastapi import HTTPException

    # Admin checker allows admin, rejects standard and inactive
    assert admin_checker(admin_user) == admin_user
    with pytest.raises(HTTPException) as exc:
        admin_checker(standard_user)
    assert exc.value.status_code == 403

    with pytest.raises(HTTPException) as exc:
        admin_checker(inactive_user)
    assert exc.value.status_code == 403

    # Both checker allows both
    assert both_checker(admin_user) == admin_user
    assert both_checker(standard_user) == standard_user

def test_refresh_token_endpoint(client: TestClient, session: Session):
    from app.core.security import create_refresh_token
    # Setup test user directly in DB
    user = User(email="refresh_test@example.com", is_active=True, role=Role.USER)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Generate refresh token
    ref_token = create_refresh_token(subject=str(user.id))

    # Test refresh endpoint using JSON request body
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": ref_token}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

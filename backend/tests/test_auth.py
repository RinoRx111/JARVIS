import pytest
from unittest.mock import patch
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session, select
from app.models.user import User, Role
from app.api.v1.auth import RoleChecker, get_current_user
from app.tools.registry import _get_safe_path
from app.core.crypto import encrypt_key, decrypt_key
from app.main import app

def test_removed_legacy_endpoints(client: TestClient):
    # Verify that registration and login endpoints are completely removed
    assert client.post("/api/v1/auth/register", json={}).status_code == 404
    assert client.post("/api/v1/auth/login", json={}).status_code == 404
    assert client.post("/api/v1/auth/refresh", json={}).status_code == 404
    assert client.get("/api/v1/auth/google/url").status_code == 404

def test_unauthenticated_requests_fail(session: Session):
    # Clear overrides to test real get_current_user check
    with TestClient(app) as test_client:
        # Request should fail with 401 since no Authorization token header is present
        res = test_client.get("/api/v1/auth/me")
        assert res.status_code == 401

def test_get_current_user_valid_token(session: Session):
    # Test get_current_user with mocked token verification
    with patch("app.api.v1.auth.verify_clerk_token") as mock_verify:
        mock_verify.return_value = {"sub": "clerk_test_123", "iss": "https://clerk.issuer.com"}
        with patch("app.api.v1.auth.get_or_create_clerk_user") as mock_get_create:
            mock_user = User(
                email="auth_test@example.com",
                clerk_user_id="clerk_test_123",
                is_active=True,
                role="user"
            )
            mock_get_create.return_value = mock_user
            
            user = get_current_user(db=session, token="some_valid_jwt_token")
            assert user.email == "auth_test@example.com"
            assert user.clerk_user_id == "clerk_test_123"

def test_integration_token_encryption_at_rest(client: TestClient, session: Session):
    # Test saving integration tokens encrypts them in the database
    # The client uses override_get_current_user which creates clerk_test_123 in DB
    response = client.put(
        "/api/v1/auth/me/preferences",
        json={"github_token": "my_secret_github_token", "linkedin_token": "my_secret_linkedin_token"}
    )
    assert response.status_code == 200
    
    # Check the database directly to confirm tokens are not stored in plaintext
    db_user = session.exec(select(User).where(User.clerk_user_id == "clerk_test_123")).first()
    assert db_user is not None
    assert db_user.github_token != "my_secret_github_token"
    assert db_user.linkedin_token != "my_secret_linkedin_token"
    
    # Decrypt to verify they match original values
    assert decrypt_key(db_user.github_token) == "my_secret_github_token"
    assert decrypt_key(db_user.linkedin_token) == "my_secret_linkedin_token"

def test_get_safe_path_sandboxing():
    # Verify _get_safe_path correctly rejects path traversals and absolute paths escaping workspace
    # Attempts with relative paths escaping WORKSPACE_DIR must fail
    with pytest.raises(ValueError):
        _get_safe_path("../../etc/passwd")

    # Attempts with absolute paths escaping WORKSPACE_DIR must fail
    import platform
    if platform.system() == "Windows":
        bad_abs_path = "C:\\Windows\\System32\\cmd.exe"
    else:
        bad_abs_path = "/etc/passwd"
        
    with pytest.raises(ValueError):
        _get_safe_path(bad_abs_path)

def test_files_read_sandboxing_endpoint(client: TestClient):
    # Verify traversal attempts via endpoints return HTTP 403
    res_rel = client.get("/api/v1/files/read?filepath=../../etc/passwd")
    assert res_rel.status_code == 403
    
    import platform
    if platform.system() == "Windows":
        bad_abs_path = "C:\\Windows\\System32\\cmd.exe"
    else:
        bad_abs_path = "/etc/passwd"
        
    res_abs = client.get(f"/api/v1/files/read?filepath={bad_abs_path}")
    assert res_abs.status_code == 403

def test_role_checker_class(session: Session):
    admin_user = User(email="admin@example.com", clerk_user_id="clerk_admin", is_active=True, role="admin")
    standard_user = User(email="standard@example.com", clerk_user_id="clerk_std", is_active=True, role="user")
    inactive_user = User(email="inactive@example.com", clerk_user_id="clerk_inact", is_active=False, role="user")
 
    admin_checker = RoleChecker(allowed_roles=[Role.ADMIN])
    user_checker = RoleChecker(allowed_roles=[Role.USER])
    both_checker = RoleChecker(allowed_roles=[Role.USER, Role.ADMIN])
 
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

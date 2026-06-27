import socket
import pytest
import httpx

BASE_URL = "http://localhost:8000/api/v1"

def is_server_running() -> bool:
    try:
        with socket.create_connection(("localhost", 8000), timeout=0.5):
            return True
    except OSError:
        return False

pytestmark = pytest.mark.skipif(
    not is_server_running(),
    reason="Backend server must be running at http://localhost:8000 to run blackbox API tests"
)

@pytest.mark.asyncio
async def test_blackbox_setup_status_removed():
    """Verify that setup-status is removed and returns 404."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/auth/setup-status")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_blackbox_protected_routes_without_auth():
    """Verify that hitting endpoints without JWT returns 401 Unauthorized."""
    async with httpx.AsyncClient() as client:
        response_me = await client.get(f"{BASE_URL}/auth/me")
        response_chat = await client.get(f"{BASE_URL}/chat/conversations")
        
        assert response_me.status_code == 401
        assert response_chat.status_code == 401

@pytest.mark.asyncio
async def test_blackbox_invalid_auth_token():
    """Verify that hitting endpoints with an invalid token returns 401 Unauthorized."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": "Bearer not.a.real.jwt"}
        response_chat = await client.get(f"{BASE_URL}/chat/conversations", headers=headers)
        
        assert response_chat.status_code == 401

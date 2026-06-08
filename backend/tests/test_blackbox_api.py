import pytest
import httpx
import os

BASE_URL = "http://localhost:8000/api/v1"

@pytest.mark.asyncio
async def test_blackbox_setup_status():
    """Verify that the setup status endpoint is reachable without authentication."""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/auth/setup-status")
        
        # Black box assertion: it must return 200 OK and have 'needs_setup' key
        assert response.status_code == 200
        data = response.json()
        assert "needs_setup" in data
        assert isinstance(data["needs_setup"], bool)

@pytest.mark.asyncio
async def test_blackbox_protected_routes_without_auth():
    """Verify that hitting protected endpoints without JWT returns 401 Unauthorized."""
    async with httpx.AsyncClient() as client:
        response_me = await client.get(f"{BASE_URL}/auth/me")
        response_chat = await client.get(f"{BASE_URL}/chat/conversations")
        
        # Black box assertion: Must be fully protected
        assert response_me.status_code == 401
        assert response_chat.status_code == 401

@pytest.mark.asyncio
async def test_blackbox_invalid_auth_token():
    """Verify that hitting protected endpoints with garbage token returns 401."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": "Bearer not.a.real.jwt"}
        response_chat = await client.get(f"{BASE_URL}/chat/conversations", headers=headers)
        
        assert response_chat.status_code == 401

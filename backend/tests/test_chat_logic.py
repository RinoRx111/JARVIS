import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage
from app.main import app
from app.core.security import create_access_token
from app.models.user import User

def test_chat_rest_api_valid_input(client, session):
    # Setup mock user
    user = User(email="rest_test@jarvis.os", is_active=True, hashed_password="mock", token_limit=1000)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Generate token
    token = create_access_token(subject=str(user.id))

    # Mock the agent_graph to bypass LangGraph logic
    with patch("app.api.v1.chat.agent_graph") as mock_graph:
        mock_graph.ainvoke = AsyncMock(return_value={"messages": [AIMessage(content="Hello sir.")]})

        response = client.post(
            "/api/v1/chat",
            json={"content": "Hello JARVIS", "voice_output": False},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "Hello sir."
        assert "conversation_id" in data
        mock_graph.ainvoke.assert_called_once()

def test_chat_websocket_authentication(client, session):
    # Setup mock user
    user = User(email="ws_auth@jarvis.os", is_active=True, hashed_password="mock")
    session.add(user)
    session.commit()
    session.refresh(user)

    # Valid token
    token = create_access_token(subject=str(user.id))
    
    # Connect with valid token should accept (we mock the timeout/disconnect to cleanly exit)
    with client.websocket_connect(f"/api/v1/chat/ws?token={token}") as websocket:
        # Just asserting it connects without 1008 violation is enough for auth test
        pass
        
    # Connect with invalid token should be rejected with 1008
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/chat/ws?token=invalid_token") as websocket:
            pass # Should raise WebSocketDisconnect

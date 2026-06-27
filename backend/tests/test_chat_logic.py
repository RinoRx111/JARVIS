import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import WebSocketDisconnect
from langchain_core.messages import AIMessage
from app.main import app
from app.models.user import User

def test_chat_rest_api_valid_input(client, session):
    # Setup mock user
    user = User(email="rest_test@jarvis.os", clerk_user_id="clerk_rest_test", is_active=True, token_limit=1000)
    session.add(user)
    session.commit()
    session.refresh(user)

    # Mock the agent_graph to bypass LangGraph logic
    with patch("app.api.v1.chat.agent_graph") as mock_graph:
        mock_graph.ainvoke = AsyncMock(return_value={"messages": [AIMessage(content="Hello sir.")]})

        response = client.post(
            "/api/v1/chat",
            json={"content": "Hello JARVIS", "voice_output": False},
            headers={"Authorization": "Bearer dummy_token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["response"] == "Hello sir."
        assert "conversation_id" in data
        mock_graph.ainvoke.assert_called_once()

def test_chat_websocket_authentication(client, session):
    # Test valid Clerk token connects successfully
    with patch("app.core.clerk_auth.verify_clerk_token") as mock_verify:
        mock_verify.return_value = {"sub": "clerk_ws_test", "iss": "https://clerk.issuer.com"}
        with patch("app.core.clerk_auth.get_or_create_clerk_user") as mock_get_create:
            mock_user = User(email="ws_auth@jarvis.os", clerk_user_id="clerk_ws_test", is_active=True)
            mock_get_create.return_value = mock_user

            with client.websocket_connect("/api/v1/chat/ws") as websocket:
                websocket.send_json({"token": "valid_mock_token"})
                # Should not raise WebSocketDisconnect on connection / auth
                
    # Test invalid token closes connection with WS_1008_POLICY_VIOLATION
    with patch("app.core.clerk_auth.verify_clerk_token", side_effect=Exception("Invalid signature")):
        with pytest.raises(WebSocketDisconnect) as exc:
            with client.websocket_connect("/api/v1/chat/ws") as websocket:
                websocket.send_json({"token": "invalid_mock_token"})
                websocket.receive_json()
        assert exc.value.code == 1008

    # Test missing token closes connection with WS_1008_POLICY_VIOLATION
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/v1/chat/ws") as websocket:
            websocket.send_json({"not_a_token": "some_value"})
            websocket.receive_json()
    assert exc.value.code == 1008

import pytest
from unittest.mock import patch, AsyncMock
from langchain_core.messages import HumanMessage, AIMessage

from app.services.agent_orchestrator import (
    should_continue,
    intent_classification_node,
    route_after_classification,
    route_after_tools
)
from app.models.user import User

@pytest.mark.asyncio
async def test_intent_classification_node(session):
    # Setup mock user in test db
    user = User(email="test_orchestrator@jarvis.os", is_active=True, hashed_password="mock")
    session.add(user)
    session.commit()
    session.refresh(user)

    state = {
        "messages": [HumanMessage(content="Search the web for python tutorials")],
        "user_id": user.id,
        "task_type": "",
        "plan": [],
        "error_count": 0,
        "tool_call_depth": 0
    }

    # Mock the LLM to return 'tool_task'
    with patch("app.services.agent_orchestrator.route_llm") as mock_route:
        mock_model = AsyncMock()
        mock_model.ainvoke.return_value = AIMessage(content="tool_task")
        mock_route.return_value = mock_model

        result = await intent_classification_node(state)
        
        assert result["task_type"] == "tool_task"
        mock_model.ainvoke.assert_called_once()


def test_should_continue_edge_logic():
    # If error_count > 3, it should halt
    state = {
        "messages": [AIMessage(content="Mock")],
        "error_count": 4,
        "tool_call_depth": 0
    }
    assert should_continue(state) == "__end__"

    # If depth > 10, it should halt
    state["error_count"] = 0
    state["tool_call_depth"] = 11
    assert should_continue(state) == "__end__"

    # If tool calls exist, it should route to tools
    mock_msg = AIMessage(content="", tool_calls=[{"name": "test_tool", "args": {}, "id": "123"}])
    state["tool_call_depth"] = 1
    state["messages"] = [mock_msg]
    assert should_continue(state) == "tools"

    # Otherwise halt
    state["messages"] = [AIMessage(content="Final answer")]
    assert should_continue(state) == "__end__"


def test_route_after_tools_logic():
    # If error_count > 3, halt
    state = {
        "messages": [AIMessage(content="Mock")],
        "error_count": 4,
        "tool_call_depth": 0
    }
    assert route_after_tools(state) == "__end__"

    # If last message contains Error/failed, route back to planner for recovery
    state["error_count"] = 1
    state["messages"] = [AIMessage(content="The tool failed to execute.")]
    assert route_after_tools(state) == "planner"

    # Normal success routes back to agent
    state["messages"] = [AIMessage(content="Success!")]
    assert route_after_tools(state) == "agent"

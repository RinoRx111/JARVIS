import logging
import json
from typing import TypedDict, Annotated, Sequence, List, Dict, Any, Union
from typing_extensions import Required
from sqlalchemy.orm import Session

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from app.core.config import settings
from app.services.llm import route_llm
from app.services.memory import memory_service
from app.tools.registry import (
    agent_tools, 
    invoke_gmail_list, 
    invoke_gmail_send, 
    invoke_calendar_list, 
    invoke_calendar_create
)
from app.models.user import User
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)

# --- AGENT STATE SPECIFICATION ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    task_type: str
    user_id: int
    # We pass the db session as an optional Any object to write audit logs
    db: Any 
    error_count: int

# --- NODE DEFINITIONS ---

async def call_model_node(state: AgentState) -> Dict[str, Any]:
    """
    Orchestrator node that calls the routed LLM, binds tools, 
    and handles plan creation/task reasoning.
    """
    logger.info("Executing Agent reasoning node...")
    messages = state["messages"]
    task_type = state["task_type"]
    user_id = state["user_id"]
    db = state["db"]

    # Retrieve memory context to inject into prompt
    memories = memory_service.search_user_memories(user_id=user_id, query=messages[-1].content, limit=3)
    memory_context = ""
    if memories:
        memory_context = "\n".join([f"- {m['content']}" for m in memories])

    # System instruction context
    system_prompt = (
        "You are JARVIS, a highly advanced AI operating system co-pilot. "
        "You help the user execute files commands, write code, run browsers, and manage email/calendars.\n"
        "Here are facts you remember about the user:\n"
        f"{memory_context or 'No long-term memories stored yet.'}\n\n"
        "If the user asks you to read or send emails, or create/list calendar events, "
        "reply with a clear natural description of your intent, and invoke the respective Google Workspace tool action if present. "
        "If you encounter script errors or file exceptions, self-correct by rewriting code parameters and trying again."
    )

    # Combine instructions
    full_messages = [AIMessage(content=system_prompt)] + list(messages)

    # Route and invoke model
    model = route_llm(task_type=task_type)
    
    # Bind standard LangChain tool schemas
    model_with_tools = model.bind_tools(agent_tools)
    
    # Run prediction
    response = await model_with_tools.ainvoke(full_messages)
    
    return {"messages": [response], "error_count": 0}

async def execute_tools_node(state: AgentState) -> Dict[str, Any]:
    """
    Custom tool execution node. Maps standard tool requests 
    and hooks up private email/calendar OAuth invocations.
    """
    logger.info("Executing Tool caller node...")
    messages = state["messages"]
    last_message = messages[-1]
    user_id = state["user_id"]
    db = state["db"]
    error_count = state["error_count"]

    tool_outputs = []
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        # Load user context from DB to pass to OAuth services
        user = db.query(User).filter(User.id == user_id).first() if db else None

        for tool_call in last_message.tool_calls:
            tool_name = tool_call["name"]
            arguments = tool_call["args"]
            tool_call_id = tool_call["id"]
            
            logger.info(f"Invoking tool '{tool_name}' with arguments: {arguments}")
            
            # 1. Custom Google Workspace Interceptors
            if tool_name == "gmail_list_emails_tool" or "gmail" in tool_name.lower() and "list" in tool_name.lower():
                limit = arguments.get("limit", 5)
                result = await invoke_gmail_list(user, db, limit=limit)
                status = "success"
                
            elif tool_name == "gmail_send_email_tool" or "gmail" in tool_name.lower() and "send" in tool_name.lower():
                result = await invoke_gmail_send(
                    user, db, 
                    to=arguments.get("to"), 
                    subject=arguments.get("subject"), 
                    body=arguments.get("body")
                )
                status = "success" if "success" in result.lower() else "failed"

            elif tool_name == "calendar_list_events_tool" or "calendar" in tool_name.lower() and "list" in tool_name.lower():
                limit = arguments.get("limit", 10)
                result = await invoke_calendar_list(user, db, limit=limit)
                status = "success"

            elif tool_name == "calendar_create_event_tool" or "calendar" in tool_name.lower() and "create" in tool_name.lower():
                result = await invoke_calendar_create(
                    user, db,
                    summary=arguments.get("summary"),
                    start_time=arguments.get("start_time"),
                    end_time=arguments.get("end_time"),
                    description=arguments.get("description")
                )
                status = "success" if "success" in result.lower() else "failed"

            # 2. Standard Registry Tools routing
            else:
                target_tool = next((t for t in agent_tools if t.name == tool_name), None)
                if target_tool:
                    try:
                        # Call standard tool (supports both sync and async runtimes)
                        if target_tool.is_coroutine:
                            result = await target_tool.ainvoke(arguments)
                        else:
                            result = target_tool.invoke(arguments)
                        status = "success"
                    except Exception as err:
                        result = f"Tool Execution Error: {str(err)}"
                        status = "failed"
                        error_count += 1
                else:
                    result = f"Error: Tool '{tool_name}' is not recognized."
                    status = "failed"
                    error_count += 1

            # Save audit logs to database
            if db and user:
                audit = AuditLog(
                    user_id=user.id,
                    agent_name="JARVIS_Orchestrator",
                    action=tool_name,
                    parameters=json.dumps(arguments),
                    status=status,
                    response=str(result)[:1000]
                )
                db.add(audit)
                db.commit()

            # Append structured Tool response message
            tool_outputs.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=tool_call_id,
                    name=tool_name
                )
            )

    return {"messages": tool_outputs, "error_count": error_count}

# --- EDGE ROUTING FUNCTION ---

def should_continue(state: AgentState) -> str:
    """Evaluates state messages to check if tool processing needs to continue."""
    messages = state["messages"]
    last_message = messages[-1]
    error_count = state["error_count"]
    
    # Cap retry/error counts to prevent infinite execution loops
    if error_count > 3:
        logger.warning("Agent execution exceeded maximum self-correcting error threshold. Halting.")
        return END

    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# --- GRAPH BUILD & COMPILATION ---

def build_agent_graph() -> StateGraph:
    workflow = StateGraph(AgentState)

    # Register node processes
    workflow.add_node("agent", call_model_node)
    workflow.add_node("tools", execute_tools_node)

    # Establish routing graph edges
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue)
    workflow.add_edge("tools", "agent")

    return workflow.compile()

# Global Compiled Agent Executable Graph
agent_graph = build_agent_graph()

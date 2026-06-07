import logging
import json
from typing import TypedDict, Annotated, Sequence, Dict, Any

from langchain_core.messages import BaseMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages

from app.services.llm import route_llm
from app.services.memory import memory_service
from app.models.user import User
from app.models.audit import AuditLog
from app.core.database import engine
from sqlmodel import Session, select

logger = logging.getLogger(__name__)

# --- AGENT STATE SPECIFICATION ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    task_type: str
    user_id: int
    error_count: int
    tool_call_depth: int

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
    full_messages = [SystemMessage(content=system_prompt)] + list(messages)

    # Route and invoke model
    model = route_llm(task_type=task_type)
    
    from app.tools.plugin_manager import plugin_manager
    # Bind standard LangChain tool schemas
    model_with_tools = model.bind_tools(plugin_manager.get_all_tools())
    
    # Run prediction
    response = await model_with_tools.ainvoke(full_messages)
    
    return {"messages": [response]}

async def execute_tools_node(state: AgentState) -> Dict[str, Any]:
    """
    Custom tool execution node. Maps standard tool requests 
    and hooks up private email/calendar OAuth invocations.
    """
    logger.info("Executing Tool caller node...")
    messages = state["messages"]
    last_message = messages[-1]
    user_id = state["user_id"]
    error_count = state["error_count"]

    tool_outputs = []
    
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        # Load user context from DB to pass to OAuth services
        with Session(engine) as db:
            user = db.exec(select(User).where(User.id == user_id)).first()

            for tool_call in last_message.tool_calls:
                tool_name = tool_call["name"]
                arguments = tool_call["args"]
                tool_call_id = tool_call["id"]
                
                logger.info(f"Invoking tool '{tool_name}' with arguments: {arguments}")
                
                from app.tools.plugin_manager import plugin_manager
                
                # 1. Custom Context-Aware Handlers (e.g. Google APIs)
                # Normalize common names that the LLM might output
                if "gmail" in tool_name.lower() and "list" in tool_name.lower():
                    tool_name = "gmail_list_emails_tool"
                elif "gmail" in tool_name.lower() and "send" in tool_name.lower():
                    tool_name = "gmail_send_email_tool"
                elif "calendar" in tool_name.lower() and "list" in tool_name.lower():
                    tool_name = "calendar_list_events_tool"
                elif "calendar" in tool_name.lower() and "create" in tool_name.lower():
                    tool_name = "calendar_create_event_tool"

                import time
                import traceback
                start_time = time.time()
                error_details = None
                
                custom_handler = plugin_manager.get_custom_handler(tool_name)
                if custom_handler:
                    try:
                        result = await custom_handler(user, db, **arguments)
                        status = "success" if "failed" not in str(result).lower() else "failed"
                    except Exception as err:
                        error_details = traceback.format_exc()
                        result = f"Custom Handler Error: {str(err)}"
                        status = "failed"
                        error_count += 1
                else:
                    # 2. Standard Registry Tools routing
                    target_tool = plugin_manager.get_tool(tool_name)
                    if target_tool:
                        try:
                            result = await target_tool.ainvoke(arguments)
                            status = "success"
                        except Exception as err:
                            error_details = traceback.format_exc()
                            result = f"Tool Execution Error: {str(err)}"
                            status = "failed"
                            error_count += 1
                    else:
                        result = f"Error: Tool '{tool_name}' is not recognized in PluginManager."
                        status = "failed"
                        error_count += 1

                duration_ms = int((time.time() - start_time) * 1000)

                # Save audit logs to database
                if db and user:
                    audit = AuditLog(
                        user_id=user.id,
                        agent_name="JARVIS_Orchestrator",
                        action=tool_name,
                        parameters=json.dumps(arguments),
                        status=status,
                        response=str(result)[:1000],
                        error_details=error_details,
                        duration_ms=duration_ms
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

    return {"messages": tool_outputs, "error_count": error_count, "tool_call_depth": state.get("tool_call_depth", 0) + 1}

# --- EDGE ROUTING FUNCTION ---

def should_continue(state: AgentState) -> str:
    """Evaluates state messages to check if tool processing needs to continue."""
    messages = state["messages"]
    last_message = messages[-1]
    error_count = state["error_count"]
    depth = state.get("tool_call_depth", 0)
    
    # Cap retry/error counts to prevent infinite execution loops
    if error_count > 3:
        logger.warning("Agent execution exceeded maximum self-correcting error threshold. Halting.")
        return END

    if depth > 10:
        logger.warning("Agent execution exceeded maximum tool call depth. Halting.")
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

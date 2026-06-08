import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from langchain_core.messages import HumanMessage
import asyncio

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.task import AgentTask
from app.models.audit import AuditLog
from app.models.agent import AgentConfig
from app.schemas.agent import TaskCreate, TaskResponse, AuditLogResponse
from pydantic import BaseModel
from app.services.agent_orchestrator import agent_graph

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agents", tags=["Agent Task Management"])

async def run_agent_task_background(task_id: int, user_id: int, prompt: str):
    """Background task runner to execute LangGraph orchestrator on user prompts."""
    # Local session for background task
    from app.core.database import engine
    from sqlmodel import Session
    db = Session(engine)
    
    try:
        task = db.exec(select(AgentTask).where(AgentTask.id == task_id)).first()
        if not task:
            return
            
        task.status = "running"
        db.commit()

        # Run the agent graph
        inputs = {
            "messages": [HumanMessage(content=prompt)],
            "task_type": "planning",
            "user_id": user_id,
            "error_count": 0,
            "tool_call_depth": 0
        }
        
        final_state = await agent_graph.ainvoke(inputs)
        reply = final_state["messages"][-1].content
        
        task.status = "completed"
        task.result = reply
    except Exception as e:
        logger.error(f"Background task {task_id} failed: {e}")
        task.status = "failed"
        task.result = f"Error: {str(e)}"
    finally:
        db.commit()
        db.close()

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_agent_task(
    payload: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dispatches a long-running AI task to be executed in the background."""
    new_task = AgentTask(
        user_id=current_user.id,
        task_type=payload.task_type,
        description=payload.description,
        status="pending"
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    # Launch execution background task via FastAPI BackgroundTasks
    background_tasks.add_task(
        run_agent_task_background,
        new_task.id,
        current_user.id,
        f"Task {payload.task_type}: {payload.description}"
    )

    return new_task

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task_status(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details, execution status, and results of a scheduled background task."""
    task = db.exec(select(AgentTask).where(AgentTask.id == task_id, AgentTask.user_id == current_user.id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/tasks", response_model=List[TaskResponse])
def list_user_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all background tasks triggered by the current user."""
    return db.exec(select(AgentTask).where(AgentTask.user_id == current_user.id)).all()

@router.get("/logs", response_model=List[AuditLogResponse])
def get_agent_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves chronological activity audit logs of tool calls executed by the agents."""
    return db.exec(select(AuditLog).where(AuditLog.user_id == current_user.id).order_by(AuditLog.created_at.desc())).all()

class AgentConfigSchema(BaseModel):
    research_agent_enabled: bool
    coding_agent_enabled: bool
    github_agent_enabled: bool
    email_agent_enabled: bool
    calendar_agent_enabled: bool
    resume_agent_enabled: bool
    linkedin_agent_enabled: bool
    automation_agent_enabled: bool

@router.get("/config", response_model=AgentConfigSchema)
def get_agent_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches the user's agent marketplace configuration."""
    config = db.exec(select(AgentConfig).where(AgentConfig.user_id == current_user.id)).first()
    if not config:
        config = AgentConfig(user_id=current_user.id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/config", response_model=AgentConfigSchema)
def update_agent_config(
    payload: AgentConfigSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates the user's enabled/disabled agents."""
    config = db.exec(select(AgentConfig).where(AgentConfig.user_id == current_user.id)).first()
    if not config:
        config = AgentConfig(user_id=current_user.id)
        db.add(config)

    config.research_agent_enabled = payload.research_agent_enabled
    config.coding_agent_enabled = payload.coding_agent_enabled
    config.github_agent_enabled = payload.github_agent_enabled
    config.email_agent_enabled = payload.email_agent_enabled
    config.calendar_agent_enabled = payload.calendar_agent_enabled
    config.resume_agent_enabled = payload.resume_agent_enabled
    config.linkedin_agent_enabled = payload.linkedin_agent_enabled
    config.automation_agent_enabled = payload.automation_agent_enabled

    db.commit()
    db.refresh(config)
    return config

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.analytics import TokenUsageLog
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics & Usage"])

@router.get("/tokens")
def get_token_usage_stats(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieves aggregated token usage statistics for the user over the specified timeframe."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Raw logs
    logs = db.exec(
        select(TokenUsageLog)
        .where(TokenUsageLog.user_id == current_user.id)
        .where(TokenUsageLog.created_at >= cutoff)
    ).all()
    
    # Aggregate total cost and tokens
    total_cost = sum(log.estimated_cost_usd for log in logs)
    total_prompt = sum(log.prompt_tokens for log in logs)
    total_completion = sum(log.completion_tokens for log in logs)
    
    # Breakdown by model
    model_breakdown = {}
    for log in logs:
        if log.model_name not in model_breakdown:
            model_breakdown[log.model_name] = {"prompt": 0, "completion": 0, "cost": 0.0}
        model_breakdown[log.model_name]["prompt"] += log.prompt_tokens
        model_breakdown[log.model_name]["completion"] += log.completion_tokens
        model_breakdown[log.model_name]["cost"] += log.estimated_cost_usd
        
    # Time-series data (grouped by date)
    time_series = {}
    for log in logs:
        date_str = log.created_at.strftime("%Y-%m-%d")
        if date_str not in time_series:
            time_series[date_str] = {"prompt": 0, "completion": 0, "cost": 0.0}
        time_series[date_str]["prompt"] += log.prompt_tokens
        time_series[date_str]["completion"] += log.completion_tokens
        time_series[date_str]["cost"] += log.estimated_cost_usd

    return {
        "summary": {
            "total_cost_usd": total_cost,
            "total_prompt_tokens": total_prompt,
            "total_completion_tokens": total_completion,
            "total_tokens": total_prompt + total_completion
        },
        "model_breakdown": model_breakdown,
        "time_series": time_series
    }

@router.get("/tools")
def get_tool_usage_stats(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieves tool and agent invocation counts."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    logs = db.exec(
        select(AuditLog)
        .where(AuditLog.user_id == current_user.id)
        .where(AuditLog.created_at >= cutoff)
    ).all()
    
    agent_usage = {}
    tool_usage = {}
    
    for log in logs:
        if log.agent_name:
            agent_usage[log.agent_name] = agent_usage.get(log.agent_name, 0) + 1
        if log.action:
            tool_usage[log.action] = tool_usage.get(log.action, 0) + 1
            
    return {
        "agent_invocations": agent_usage,
        "tool_invocations": tool_usage
    }

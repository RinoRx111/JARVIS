from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TaskCreate(BaseModel):
    task_type: str
    description: str

class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_type: str
    description: str
    status: str
    result: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_name: Optional[str] = None
    action: str
    parameters: Optional[str] = None
    status: str
    response: Optional[str] = None
    error_details: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime

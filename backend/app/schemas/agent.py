from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: str
    result: Optional[str] = None
    errors: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    agent_name: Optional[str] = None
    action: str
    parameters: Optional[str] = None
    status: str
    response: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

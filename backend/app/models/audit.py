from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    agent_name: Optional[str] = Field(default=None, nullable=True) # "Orchestrator", "CodingAgent", etc.
    action: str = Field(nullable=False) # e.g. "execute_python", "read_gmail"
    parameters: Optional[str] = Field(default=None, nullable=True) # JSON dump of parameters passed to the tool
    status: str = Field(nullable=False) # "success", "failure", "pending_user_consent"
    response: Optional[str] = Field(default=None, nullable=True) # Truncated representation of tool result
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="audit_logs")

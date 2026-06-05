from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class AgentTask(SQLModel, table=True):
    __tablename__ = "agent_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    title: str = Field(nullable=False)
    description: Optional[str] = Field(default=None, nullable=True)
    status: str = Field(default="pending") # "pending", "running", "completed", "failed"
    result: Optional[str] = Field(default=None, nullable=True) # JSON or text result summary
    errors: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )

    # Relationships
    user: "User" = Relationship(back_populates="tasks")

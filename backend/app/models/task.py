from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.user import User

class AgentTask(SQLModel, table=True):
    __tablename__ = "agent_tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    task_type: str
    description: str
    status: str = Field(default="pending") # "pending", "running", "completed", "failed"
    result: Optional[str] = Field(default=None)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )

    # Relationships
    user: "User" = Relationship(back_populates="tasks")


class BrowserTask(SQLModel, table=True):
    __tablename__ = "browser_tasks"

    id: str = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    status: str = Field(default="processing")  # "processing", "success", "failed"
    url: Optional[str] = None
    title: Optional[str] = None
    screenshot_url: Optional[str] = None
    actions_log: Optional[str] = None  # JSON serialized list of operations
    extracted_text: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

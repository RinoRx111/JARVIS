from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.conversation import Conversation
    from app.models.task import AgentTask
    from app.models.audit import AuditLog
    from app.models.file import FileMetadata

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, unique=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    role: str = Field(default="user")

    # OAuth credentials
    google_oauth_token: Optional[str] = Field(default=None)
    google_refresh_token: Optional[str] = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships (placeholders for SQLModel)
    conversations: List["Conversation"] = Relationship(back_populates="user")
    tasks: List["AgentTask"] = Relationship(back_populates="user")
    audit_logs: List["AuditLog"] = Relationship(back_populates="user")
    files: List["FileMetadata"] = Relationship(back_populates="user")
    reminders: List["Reminder"] = Relationship(back_populates="user")

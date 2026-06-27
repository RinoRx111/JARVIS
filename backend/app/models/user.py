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
    clerk_user_id: str = Field(index=True, unique=True, nullable=False)
    is_active: bool = Field(default=True)
    role: str = Field(default="user")

    # Profile Details
    full_name: Optional[str] = Field(default=None)
    nickname: Optional[str] = Field(default=None)
    
    github_token: Optional[str] = Field(default=None)
    notion_token: Optional[str] = Field(default=None)
    linkedin_token: Optional[str] = Field(default=None)
    microsoft_token: Optional[str] = Field(default=None)
    slack_token: Optional[str] = Field(default=None)
    discord_token: Optional[str] = Field(default=None)
    jira_token: Optional[str] = Field(default=None)
    trello_token: Optional[str] = Field(default=None)

    # LLM Settings
    preferred_model: str = Field(default="gpt-4o")
    token_limit: int = Field(default=8000)
    openai_api_key: Optional[str] = Field(default=None)
    anthropic_api_key: Optional[str] = Field(default=None)
    gemini_api_key: Optional[str] = Field(default=None)
    groq_api_key: Optional[str] = Field(default=None)
    ollama_model: Optional[str] = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships (placeholders for SQLModel)
    conversations: List["Conversation"] = Relationship(back_populates="user")
    tasks: List["AgentTask"] = Relationship(back_populates="user")
    audit_logs: List["AuditLog"] = Relationship(back_populates="user")
    files: List["FileMetadata"] = Relationship(back_populates="user")
    reminders: List["Reminder"] = Relationship(back_populates="user")

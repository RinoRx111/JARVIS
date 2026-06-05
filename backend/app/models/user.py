from datetime import datetime
from typing import List, Optional
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, unique=True)
    hashed_password: Optional[str] = Field(default=None, nullable=True)
    is_active: bool = Field(default=True)
    role: Role = Field(default=Role.USER)

    # Google OAuth credentials
    google_oauth_token: Optional[str] = Field(default=None, nullable=True)
    google_refresh_token: Optional[str] = Field(default=None, nullable=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships (placeholders for SQLModel)
    conversations: List["Conversation"] = Relationship(back_populates="user")
    tasks: List["AgentTask"] = Relationship(back_populates="user")
    audit_logs: List["AuditLog"] = Relationship(back_populates="user")
    files: List["FileMetadata"] = Relationship(back_populates="user")

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

class FileMetadata(SQLModel, table=True):
    __tablename__ = "files"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False)
    filename: str = Field(nullable=False)
    filepath: str = Field(nullable=False)
    status: str = Field(default="pending") # "pending", "processing", "completed", "failed"
    error: Optional[str] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )

    # Relationships
    user: "User" = Relationship(back_populates="files")

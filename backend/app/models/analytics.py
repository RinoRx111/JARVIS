from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field

class TokenUsageLog(SQLModel, table=True):
    __tablename__ = "token_usage_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    model_name: str = Field(nullable=False)
    
    prompt_tokens: int = Field(default=0)
    completion_tokens: int = Field(default=0)
    total_tokens: int = Field(default=0)
    
    # Optional field to track estimated cost in USD
    estimated_cost_usd: float = Field(default=0.0)
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

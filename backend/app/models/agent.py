from typing import Optional
from sqlmodel import SQLModel, Field

class AgentConfig(SQLModel, table=True):
    __tablename__ = "agent_configs"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    # Boolean flags for enabling/disabling specialized agents
    research_agent_enabled: bool = Field(default=True)
    coding_agent_enabled: bool = Field(default=True)
    github_agent_enabled: bool = Field(default=False)
    email_agent_enabled: bool = Field(default=False)
    calendar_agent_enabled: bool = Field(default=False)
    resume_agent_enabled: bool = Field(default=False)
    linkedin_agent_enabled: bool = Field(default=False)
    automation_agent_enabled: bool = Field(default=True)

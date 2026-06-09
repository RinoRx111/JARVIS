from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import Role

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    role: Role
    created_at: datetime
    
    # Profile details
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    
    # LLM Settings exposed to frontend
    preferred_model: str
    token_limit: int
    ollama_model: Optional[str] = None
    # We do NOT expose the raw API keys in the response for security, but we expose booleans to indicate if they are set
    has_openai_key: bool = False
    has_anthropic_key: bool = False
    has_gemini_key: bool = False
    has_groq_key: bool = False
    
    # Integration tokens
    has_github_token: bool = False
    has_notion_token: bool = False
    has_linkedin_token: bool = False
    has_microsoft_token: bool = False
    has_slack_token: bool = False
    has_discord_token: bool = False
    has_jira_token: bool = False
    has_trello_token: bool = False
    has_google_token: bool = False

    class Config:
        from_attributes = True

class UserPreferencesUpdate(BaseModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    preferred_model: Optional[str] = None
    token_limit: Optional[int] = None
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    ollama_model: Optional[str] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[float] = None
    type: Optional[str] = None

class OAuthLoginRequest(BaseModel):
    code: str

class RefreshRequest(BaseModel):
    refresh_token: str


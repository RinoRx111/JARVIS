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
    
    # LLM Settings exposed to frontend
    preferred_model: str
    token_limit: int
    ollama_model: Optional[str] = None
    # We do NOT expose the raw API keys in the response for security, but we expose booleans to indicate if they are set
    has_openai_key: bool = False
    has_anthropic_key: bool = False
    has_gemini_key: bool = False
    has_groq_key: bool = False

    class Config:
        from_attributes = True

class UserPreferencesUpdate(BaseModel):
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

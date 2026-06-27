import httpx
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, Role
from app.schemas.user import UserResponse
from app.core.crypto import encrypt_key
from app.core.clerk_auth import verify_clerk_token, get_or_create_clerk_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

# Dependency helper to fetch active user
def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided"
        )
    try:
        clerk_data = verify_clerk_token(token)
        clerk_user_id = clerk_data.get("sub")
        if not clerk_user_id:
            raise ValueError("Token is missing sub claim")
        return get_or_create_clerk_user(db, clerk_user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}"
        )

class RoleChecker:
    def __init__(self, allowed_roles: List[Role]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user profile"
            )
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted: insufficient privileges. Required roles: {[r.value for r in self.allowed_roles]}"
            )
        return current_user

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        nickname=current_user.nickname,
        is_active=current_user.is_active,
        role=current_user.role,
        created_at=current_user.created_at,
        preferred_model="groq",
        token_limit=current_user.token_limit,
        ollama_model=None,
        has_openai_key=False,
        has_anthropic_key=False,
        has_gemini_key=False,
        has_groq_key=bool(current_user.groq_api_key),
        has_github_token=bool(current_user.github_token),
        has_notion_token=bool(current_user.notion_token),
        has_linkedin_token=bool(current_user.linkedin_token),
        has_microsoft_token=bool(current_user.microsoft_token),
        has_slack_token=bool(current_user.slack_token),
        has_discord_token=bool(current_user.discord_token),
        has_jira_token=bool(current_user.jira_token),
        has_trello_token=bool(current_user.trello_token)
    )

@router.get("/models/local")
async def get_local_models():
    """Local model discovery disabled - Groq only mode active."""
    return {"models": []}

from app.schemas.user import UserPreferencesUpdate

async def _validate_api_key(provider: str, key: str) -> bool:
    """Helper to validate API keys before saving."""
    if not key:
        return True
    try:
        if provider == "groq":
            async with httpx.AsyncClient() as client:
                res = await client.get("https://api.groq.com/openai/v1/models", headers={"Authorization": f"Bearer {key}"})
                return res.status_code == 200
    except Exception as e:
        logger.error(f"API validation error for {provider}: {e}")
    return False

@router.put("/me/preferences", response_model=UserResponse)
async def update_preferences(
    prefs: UserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates user LLM preferences and validates API keys."""
    if prefs.groq_api_key and prefs.groq_api_key != current_user.groq_api_key:
        if not await _validate_api_key("groq", prefs.groq_api_key):
            raise HTTPException(status_code=400, detail="Invalid Groq API Key")
        current_user.groq_api_key = encrypt_key(prefs.groq_api_key)

    # Force to Groq
    current_user.preferred_model = "groq"
    current_user.ollama_model = None

    if prefs.token_limit is not None:
        current_user.token_limit = prefs.token_limit
    if prefs.full_name is not None:
        current_user.full_name = prefs.full_name
    if prefs.nickname is not None:
        current_user.nickname = prefs.nickname
    if prefs.github_token is not None:
        current_user.github_token = encrypt_key(prefs.github_token)
    if prefs.linkedin_token is not None:
        current_user.linkedin_token = encrypt_key(prefs.linkedin_token)

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        nickname=current_user.nickname,
        is_active=current_user.is_active,
        role=current_user.role,
        created_at=current_user.created_at,
        preferred_model="groq",
        token_limit=current_user.token_limit,
        ollama_model=None,
        has_openai_key=False,
        has_anthropic_key=False,
        has_gemini_key=False,
        has_groq_key=bool(current_user.groq_api_key),
        has_github_token=bool(current_user.github_token),
        has_notion_token=bool(current_user.notion_token),
        has_linkedin_token=bool(current_user.linkedin_token),
        has_microsoft_token=bool(current_user.microsoft_token),
        has_slack_token=bool(current_user.slack_token),
        has_discord_token=bool(current_user.discord_token),
        has_jira_token=bool(current_user.jira_token),
        has_trello_token=bool(current_user.trello_token)
    )

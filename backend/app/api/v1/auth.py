import httpx
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, OAuthLoginRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Dependency helper to fetch active user
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.exec(select(User).where(User.id == int(user_id))).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
        
    return user

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

@router.get("/setup-status")
def setup_status(db: Session = Depends(get_db)):
    """Checks if any user is registered yet to determine if Setup Mode is needed."""
    count = db.exec(select(User)).all()
    return {"needs_setup": len(count) == 0}

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Registers a new email/password user."""
    db_user = db.exec(select(User).where(User.email == user_in.email)).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates email/password and returns authorization JWT tokens."""
    user = db.exec(select(User).where(User.email == user_in.email)).first()
    if not user or not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Validates refresh token and yields new access token."""
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    user = db.exec(select(User).where(User.id == int(user_id))).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
        
    access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/google/url")
def get_google_auth_url():
    """Generates the Google OAuth login url for the frontend client."""
    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar"
    
    # Return auth authorization request URL redirecting user consent
    url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code&client_id={client_id}"
        f"&redirect_uri={redirect_uri}&scope={scope}"
        "&access_type=offline&prompt=consent"
    )
    return {"url": url}

@router.post("/google/callback", response_model=Token)
async def google_callback(payload: OAuthLoginRequest, db: Session = Depends(get_db)):
    """
    Callback capturing authorization code, retrieving access/refresh tokens 
    from Google APIs, and authenticating or registering user.
    """
    token_url = "https://oauth2.googleapis.com/token"
    
    # Request token exchange
    async with httpx.AsyncClient() as client:
        res = await client.post(
            token_url,
            data={
                "code": payload.code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code"
            }
        )
        
        if res.status_code != 200:
            logger.error(f"Google token exchange failed: {res.text}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google code validation failed."
            )
            
        token_data = res.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token") # Provided on prompt=consent consent flow
        
        # Query user profile email
        profile_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if profile_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not retrieve Google profile details."
            )
            
        profile_data = profile_res.json()
        email = profile_data.get("email")
        
        # Check if user exists, otherwise register
        user = db.exec(select(User).where(User.email == email)).first()
        if not user:
            user = User(email=email)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Update user tokens
        user.google_oauth_token = access_token
        if refresh_token:
            user.google_refresh_token = refresh_token
            
        db.commit()
        
        # Generate internal application JWT credentials
        app_access = create_access_token(subject=user.id)
        app_refresh = create_refresh_token(subject=user.id)
        
        return {
            "access_token": app_access,
            "refresh_token": app_refresh,
            "token_type": "bearer"
        }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve details of the currently authenticated user."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        role=current_user.role,
        created_at=current_user.created_at,
        preferred_model=current_user.preferred_model,
        token_limit=current_user.token_limit,
        ollama_model=current_user.ollama_model,
        has_openai_key=bool(current_user.openai_api_key),
        has_anthropic_key=bool(current_user.anthropic_api_key),
        has_gemini_key=bool(current_user.gemini_api_key),
        has_groq_key=bool(current_user.groq_api_key)
    )

from app.schemas.user import UserPreferencesUpdate

async def _validate_api_key(provider: str, key: str) -> bool:
    """Helper to validate API keys before saving."""
    if not key:
        return True
    try:
        if provider == "openai":
            async with httpx.AsyncClient() as client:
                res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"})
                return res.status_code == 200
        elif provider == "anthropic":
            async with httpx.AsyncClient() as client:
                res = await client.get("https://api.anthropic.com/v1/models", headers={"x-api-key": key, "anthropic-version": "2023-06-01"})
                return res.status_code == 200
        elif provider == "gemini":
            async with httpx.AsyncClient() as client:
                res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={key}")
                return res.status_code == 200
        elif provider == "groq":
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
    # Validate keys before saving
    if prefs.openai_api_key and prefs.openai_api_key != current_user.openai_api_key:
        if not await _validate_api_key("openai", prefs.openai_api_key):
            raise HTTPException(status_code=400, detail="Invalid OpenAI API Key")
        current_user.openai_api_key = prefs.openai_api_key
        
    if prefs.anthropic_api_key and prefs.anthropic_api_key != current_user.anthropic_api_key:
        if not await _validate_api_key("anthropic", prefs.anthropic_api_key):
            raise HTTPException(status_code=400, detail="Invalid Anthropic API Key")
        current_user.anthropic_api_key = prefs.anthropic_api_key
        
    if prefs.gemini_api_key and prefs.gemini_api_key != current_user.gemini_api_key:
        if not await _validate_api_key("gemini", prefs.gemini_api_key):
            raise HTTPException(status_code=400, detail="Invalid Gemini API Key")
        current_user.gemini_api_key = prefs.gemini_api_key
        
    if prefs.groq_api_key and prefs.groq_api_key != current_user.groq_api_key:
        if not await _validate_api_key("groq", prefs.groq_api_key):
            raise HTTPException(status_code=400, detail="Invalid Groq API Key")
        current_user.groq_api_key = prefs.groq_api_key

    if prefs.preferred_model is not None:
        current_user.preferred_model = prefs.preferred_model
    if prefs.token_limit is not None:
        current_user.token_limit = prefs.token_limit
    if prefs.ollama_model is not None:
        current_user.ollama_model = prefs.ollama_model

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        is_active=current_user.is_active,
        role=current_user.role,
        created_at=current_user.created_at,
        preferred_model=current_user.preferred_model,
        token_limit=current_user.token_limit,
        ollama_model=current_user.ollama_model,
        has_openai_key=bool(current_user.openai_api_key),
        has_anthropic_key=bool(current_user.anthropic_api_key),
        has_gemini_key=bool(current_user.gemini_api_key),
        has_groq_key=bool(current_user.groq_api_key)
    )

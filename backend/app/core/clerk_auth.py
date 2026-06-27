import jwt
import httpx
from fastapi import HTTPException, status
from sqlmodel import Session, select
from typing import Optional

from app.core.config import settings
from app.models.user import User

_jwk_client: Optional[jwt.PyJWKClient] = None

def get_jwk_client() -> jwt.PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        if not settings.CLERK_JWKS_URL:
            raise ValueError("CLERK_JWKS_URL is not configured")
        _jwk_client = jwt.PyJWKClient(settings.CLERK_JWKS_URL)
    return _jwk_client

def verify_clerk_token(token: str) -> dict:
    """
    Decodes and verifies a Clerk session JWT token against the configured JWKS endpoint.
    Raises 401 HTTPException on any signature or validation failure.
    """
    try:
        jwk_client = get_jwk_client()
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_aud": False,
                "require": ["exp", "iat", "sub"]
            }
        )
        if settings.CLERK_ISSUER and payload.get("iss") != settings.CLERK_ISSUER:
            raise ValueError(f"Issuer mismatch: {payload.get('iss')} != {settings.CLERK_ISSUER}")
        return payload
    except Exception as e:
        import logging
        logging.getLogger("app.core.clerk_auth").error(f"Clerk token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Clerk token: {str(e)}"
        )

def get_or_create_clerk_user(db: Session, clerk_user_id: str) -> User:
    """
    Looks up local User profile by clerk_user_id. If it does not exist,
    fetches user information from Clerk Backend API and syncs details locally.
    """
    # 1. Try to find the user by clerk_user_id
    user = db.exec(select(User).where(User.clerk_user_id == clerk_user_id)).first()
    if user:
        return user

    # 2. Fetch profile from Clerk API
    if not settings.CLERK_SECRET_KEY:
        raise ValueError("CLERK_SECRET_KEY is not configured")

    url = f"https://api.clerk.com/v1/users/{clerk_user_id}"
    headers = {
        "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
        "Accept": "application/json"
    }

    try:
        with httpx.Client() as client:
            res = client.get(url, headers=headers)
            if res.status_code != 200:
                raise ValueError(f"Clerk API error {res.status_code}: {res.text}")
            clerk_profile = res.json()
    except Exception as e:
        import logging
        logging.getLogger("app.core.clerk_auth").error(f"Failed to fetch Clerk profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate: user profile fetch failed"
        )

    email_addresses = clerk_profile.get("email_addresses", [])
    email = None
    if email_addresses:
        primary_email_id = clerk_profile.get("primary_email_address_id")
        for addr in email_addresses:
            if addr.get("id") == primary_email_id:
                email = addr.get("email_address")
                break
        if not email:
            email = email_addresses[0].get("email_address")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate: Clerk user has no email address"
        )

    first_name = clerk_profile.get("first_name") or ""
    last_name = clerk_profile.get("last_name") or ""
    full_name = f"{first_name} {last_name}".strip() or email.split("@")[0]
    nickname = first_name or full_name

    # 3. Check if there's an existing user with that email to link them
    user = db.exec(select(User).where(User.email == email)).first()
    if user:
        user.clerk_user_id = clerk_user_id
        if not user.full_name and full_name:
            user.full_name = full_name
        if not user.nickname and nickname:
            user.nickname = nickname
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    # 4. Create new user
    user = User(
        email=email,
        clerk_user_id=clerk_user_id,
        full_name=full_name,
        nickname=nickname,
        is_active=True,
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

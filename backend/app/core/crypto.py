import base64
from cryptography.fernet import Fernet
from typing import Optional
from app.core.config import settings

def get_fernet() -> Optional[Fernet]:
    if not settings.ENCRYPTION_KEY:
        return None
    # Ensure key is valid base64 (32 bytes)
    try:
        return Fernet(settings.ENCRYPTION_KEY.encode("utf-8"))
    except Exception as e:
        import logging
        logging.error(f"Failed to initialize Fernet encryption: {e}")
        return None

def encrypt_key(plain_text: Optional[str]) -> Optional[str]:
    if not plain_text:
        return None
    f = get_fernet()
    if not f:
        return plain_text # Fallback if no key configured
    return f.encrypt(plain_text.encode("utf-8")).decode("utf-8")

def decrypt_key(cipher_text: Optional[str]) -> Optional[str]:
    if not cipher_text:
        return None
    f = get_fernet()
    if not f:
        return cipher_text
    try:
        return f.decrypt(cipher_text.encode("utf-8")).decode("utf-8")
    except Exception:
        # If decryption fails (e.g., was stored as plain text before encryption was enabled)
        return cipher_text

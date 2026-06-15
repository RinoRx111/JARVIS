import logging
from typing import Optional, Any
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None

from app.core.config import settings
from app.models.user import User
from app.core.crypto import decrypt_key

logger = logging.getLogger(__name__)

# Cache dictionary to store model instances per user to avoid recreating clients
_model_cache = {}

def get_openai_client(user: Optional[User] = None, temperature: float = 0.7) -> BaseChatModel:
    user_id = user.id if user else "global"
    cache_key = f"openai_{user_id}_{temperature}"
    
    if cache_key not in _model_cache:
        # Prioritize user API key
        user_key = decrypt_key(user.openai_api_key) if user and user.openai_api_key else None
        api_key = user_key if user_key else settings.OPENAI_API_KEY
        if api_key:
            _model_cache[cache_key] = ChatOpenAI(
                model="gpt-4o",
                temperature=temperature,
                openai_api_key=api_key
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_gemini_client(user: Optional[User] = None, temperature: float = 0.5) -> BaseChatModel:
    user_id = user.id if user else "global"
    cache_key = f"gemini_{user_id}_{temperature}"
    
    if cache_key not in _model_cache:
        user_key = decrypt_key(user.gemini_api_key) if user and user.gemini_api_key else None
        api_key = user_key if user_key else settings.GEMINI_API_KEY
        if api_key:
            _model_cache[cache_key] = ChatOpenAI(
                model="gemini-2.5-pro",
                temperature=temperature,
                openai_api_key=api_key,
                openai_api_base="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_claude_client(user: Optional[User] = None, temperature: float = 0.2) -> BaseChatModel:
    user_id = user.id if user else "global"
    cache_key = f"claude_{user_id}_{temperature}"
    
    if cache_key not in _model_cache:
        user_key = decrypt_key(user.anthropic_api_key) if user and user.anthropic_api_key else None
        api_key = user_key if user_key else settings.ANTHROPIC_API_KEY
        if api_key:
            _model_cache[cache_key] = ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                temperature=temperature,
                anthropic_api_key=api_key
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_groq_client(user: Optional[User] = None, temperature: float = 0.7) -> BaseChatModel:
    user_id = user.id if user else "global"
    cache_key = f"groq_{user_id}_{temperature}"
    
    if cache_key not in _model_cache:
        user_key = decrypt_key(user.groq_api_key) if user and user.groq_api_key else None
        api_key = user_key if user_key else settings.GROQ_API_KEY
        if api_key:
            _model_cache[cache_key] = ChatOpenAI(
                model="llama-3.3-70b-versatile",
                temperature=temperature,
                openai_api_key=api_key,
                openai_api_base="https://api.groq.com/openai/v1"
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_fast_groq_client(user: Optional[User] = None, temperature: float = 0.0) -> BaseChatModel:
    user_id = user.id if user else "global"
    cache_key = f"groq_fast_{user_id}_{temperature}"
    
    if cache_key not in _model_cache:
        user_key = decrypt_key(user.groq_api_key) if user and user.groq_api_key else None
        api_key = user_key if user_key else settings.GROQ_API_KEY
        if api_key:
            _model_cache[cache_key] = ChatOpenAI(
                model="llama-3.1-8b-instant",
                temperature=temperature,
                openai_api_key=api_key,
                openai_api_base="https://api.groq.com/openai/v1"
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_ollama_client(user: Optional[User] = None, temperature: float = 0.7) -> BaseChatModel:
    user_id = user.id if user else "global"
    model_name = "qwen3.5:9b"
    if user and user.ollama_model:
        model_name = user.ollama_model
        
    cache_key = f"ollama_{user_id}_{model_name}_{temperature}"
    
    if cache_key not in _model_cache:
        # Use ChatOpenAI pointing to Ollama's OpenAI-compatible endpoint.
        # This ensures the model object implements bind_tools for LangGraph.
        base_url = settings.OLLAMA_API_URL.rstrip('/') + '/v1'
        _model_cache[cache_key] = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            openai_api_key="ollama",
            openai_api_base=base_url
        )
    return _model_cache[cache_key]

def route_llm(task_type: Optional[str] = None, temperature: float = 0.7, user: Optional[User] = None) -> BaseChatModel:
    """
    Selects and returns the best available model class based on task metadata.
    Always uses the Groq provider.
    """
    # Route fast tasks to llama-3.1-8b-instant
    if task_type == "fast":
        fast_groq = get_fast_groq_client(user, temperature)
        if fast_groq:
            return fast_groq
            
    # Default routing to llama-3.3-70b-versatile
    groq = get_groq_client(user, temperature)
    if groq:
        return groq
        
    raise ValueError(
        f"Groq LLM provider is not configured. "
        f"GROQ_API_KEY loaded: {bool(settings.GROQ_API_KEY)}. "
        f"Check your .env file — set GROQ_API_KEY directly or ensure GROQ_API_KEY_FILE points to a valid file."
    )
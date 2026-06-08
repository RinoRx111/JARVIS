import logging
from typing import Optional, Any
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
try:
    from langchain_groq import ChatGroq
except ImportError:
    ChatGroq = None

try:
    from langchain_community.chat_models.ollama import ChatOllama
except ImportError:
    try:
        from langchain_community.chat_models import ChatOllama
    except ImportError:
        class ChatOllama:
            def __init__(self, *args, **kwargs):
                pass

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

# Cache dictionary to store model instances per user to avoid recreating clients
_model_cache = {}

def get_openai_client(user: Optional[User] = None, temperature: float = 0.7) -> BaseChatModel:
    user_id = user.id if user else "global"
    cache_key = f"openai_{user_id}_{temperature}"
    
    if cache_key not in _model_cache:
        # Prioritize user API key
        api_key = user.openai_api_key if user and user.openai_api_key else settings.OPENAI_API_KEY
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
        api_key = user.gemini_api_key if user and user.gemini_api_key else settings.GEMINI_API_KEY
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
        api_key = user.anthropic_api_key if user and user.anthropic_api_key else settings.ANTHROPIC_API_KEY
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
        api_key = user.groq_api_key if user and user.groq_api_key else settings.GROQ_API_KEY
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
        api_key = user.groq_api_key if user and user.groq_api_key else settings.GROQ_API_KEY
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
        _model_cache[cache_key] = ChatOllama(
            base_url=settings.OLLAMA_API_URL,
            model=model_name,
            temperature=temperature
        )
    return _model_cache[cache_key]

def route_llm(task_type: Optional[str] = None, temperature: float = 0.7, user: Optional[User] = None) -> BaseChatModel:
    """
    Selects and returns the best available model class based on task metadata and user preferences.
    """
    # 0. Check for explicit LLM provider override from user preferences
    provider = user.preferred_model if user and user.preferred_model else settings.DEFAULT_LLM_PROVIDER
    provider = provider.lower()
    
    # Simple mapping of raw 'provider' string which could be an exact model like 'gpt-4o' or 'claude-3.5-sonnet'
    # to the top-level provider names.
    if "gpt" in provider or "openai" in provider:
        openai = get_openai_client(user, temperature)
        if openai: return openai
    elif "claude" in provider or "anthropic" in provider:
        claude = get_claude_client(user, temperature)
        if claude: return claude
    elif "gemini" in provider:
        gemini = get_gemini_client(user, temperature)
        if gemini: return gemini
    elif "llama" in provider or "groq" in provider:
        groq = get_groq_client(user, temperature)
        if groq: return groq
    elif "ollama" in provider:
        ollama = get_ollama_client(user, temperature)
        if ollama: return ollama

    # 1. Routing by Task Type if preferred provider wasn't available or matched
    if task_type == "fast":
        fast_groq = get_fast_groq_client(user, temperature)
        if fast_groq: return fast_groq
            
    if task_type in ("code", "planning"):
        claude = get_claude_client(user, temperature)
        if claude: return claude
        
    elif task_type in ("vision", "pdf_reading", "multimodal"):
        gemini = get_gemini_client(user, temperature)
        if gemini: return gemini

    # 2. General default fallbacks in order of strength
    openai = get_openai_client(user, temperature)
    if openai: return openai

    gemini = get_gemini_client(user, temperature)
    if gemini: return gemini

    claude = get_claude_client(user, temperature)
    if claude: return claude

    # 3. Local model fallback
    logger.info("No cloud credentials found or failed. Routing to local Ollama runtime.")
    fallback = get_ollama_client(user, temperature)
    if fallback: return fallback
        
    raise ValueError("No LLM provider is configured or available. Please add API keys in the settings or start Ollama.")

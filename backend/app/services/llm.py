import logging
from typing import Optional, Any
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
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

logger = logging.getLogger(__name__)

# Cache dictionary to store model instances
_model_cache = {}

def get_openai_client(temperature: float = 0.7) -> BaseChatModel:
    cache_key = f"openai_{temperature}"
    if cache_key not in _model_cache:
        if settings.OPENAI_API_KEY:
            _model_cache[cache_key] = ChatOpenAI(
                model="gpt-4o",
                temperature=temperature,
                openai_api_key=settings.OPENAI_API_KEY
            )
        else:
            logger.warning("OPENAI_API_KEY is missing. Falls back to mock or exceptions.")
            # Standard fallback dummy model so imports don't crash
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_gemini_client(temperature: float = 0.5) -> BaseChatModel:
    cache_key = f"gemini_{temperature}"
    if cache_key not in _model_cache:
        if settings.GEMINI_API_KEY:
            _model_cache[cache_key] = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                temperature=temperature,
                google_api_key=settings.GEMINI_API_KEY
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_claude_client(temperature: float = 0.2) -> BaseChatModel:
    cache_key = f"claude_{temperature}"
    if cache_key not in _model_cache:
        if settings.ANTHROPIC_API_KEY:
            _model_cache[cache_key] = ChatAnthropic(
                model="claude-3-5-sonnet-20240620",
                temperature=temperature,
                anthropic_api_key=settings.ANTHROPIC_API_KEY
            )
        else:
            _model_cache[cache_key] = None
    return _model_cache[cache_key]

def get_ollama_client(temperature: float = 0.7) -> BaseChatModel:
    cache_key = f"ollama_{temperature}"
    if cache_key not in _model_cache:
        _model_cache[cache_key] = ChatOllama(
            base_url=settings.OLLAMA_API_URL,
            model="llama3",
            temperature=temperature
        )
    return _model_cache[cache_key]

def route_llm(task_type: Optional[str] = None, temperature: float = 0.7) -> BaseChatModel:
    """
    Selects and returns the best available model class based on task metadata.
    - coding/planning: Claude 3.5 Sonnet
    - vision/documents Q&A: Gemini 1.5 Pro
    - default/general: GPT-4o
    - fallback/offline: Ollama
    """
    # 0. Check for explicit LLM provider override
    provider = settings.DEFAULT_LLM_PROVIDER.lower()
    if provider == "ollama":
        return get_ollama_client(temperature)
    elif provider == "gemini":
        gemini = get_gemini_client(temperature)
        if gemini:
            return gemini
    elif provider == "anthropic":
        claude = get_claude_client(temperature)
        if claude:
            return claude

    # 1. Routing by Task Type
    if task_type in ("code", "planning"):
        claude = get_claude_client(temperature)
        if claude:
            return claude
        logger.info("Claude client not initialized, trying OpenAI fallback.")
        
    elif task_type in ("vision", "pdf_reading", "multimodal"):
        gemini = get_gemini_client(temperature)
        if gemini:
            return gemini
        logger.info("Gemini client not initialized, trying OpenAI fallback.")

    # 2. General default is OpenAI GPT-4o
    openai = get_openai_client(temperature)
    if openai:
        return openai

    # Fall back to Gemini if available
    gemini = get_gemini_client(temperature)
    if gemini:
        return gemini

    # Fall back to Claude if available
    claude = get_claude_client(temperature)
    if claude:
        return claude

    # 3. Local model fallback
    logger.info("No cloud credentials found. Routing to local Ollama runtime.")
    return get_ollama_client(temperature)

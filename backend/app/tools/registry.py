import os
import logging
import subprocess
from typing import Optional
from langchain_core.tools import tool
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.sandbox import sandbox_executor
from app.services.browser import browser_service
from app.services.google_workspace import google_workspace_service
from app.models.user import User

logger = logging.getLogger(__name__)

# Helper to verify paths (Must reside within WORKSPACE_DIR)
def _get_safe_path(filepath: str) -> str:
    from pathlib import Path
    base_dir = Path(settings.WORKSPACE_DIR).resolve()
    filepath_expanded = os.path.expanduser(filepath)
    path = Path(filepath_expanded)
    if path.is_absolute():
        target_path = path.resolve()
    else:
        target_path = Path(base_dir / filepath_expanded).resolve()
        
    if not target_path.is_relative_to(base_dir):
        raise ValueError("Access denied: path escapes workspace directory.")
    return str(target_path)

# --- AUTOMATION TOOLS ---

from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _execute_tavily_search(query: str, tavily_key: str) -> str:
    import httpx
    headers = {"content-type": "application/json"}
    data = {"apiKey": tavily_key, "query": query, "searchDepth": "basic", "includeImages": False}
    res = httpx.post("https://api.tavily.com/search", json=data, headers=headers, timeout=10)
    if res.status_code == 200:
        results = res.json().get("results", [])
        results.sort(key=lambda x: x.get("score", 0), reverse=True)
        summary = []
        for idx, r in enumerate(results[:5]):
            summary.append(f"[Source {idx+1}] {r.get('title', 'Untitled')}\nURL: {r.get('url', '')}\nContent: {r.get('content', '')}\n")
        return "\n".join(summary)
    else:
        raise Exception(f"Tavily search API error: {res.text}")

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _execute_ddg_search(query: str) -> str:
    from duckduckgo_search import DDGS
    with DDGS() as ddgs:
        results = list(ddgs.text(query, max_results=5))
        if results:
            summary = []
            for idx, r in enumerate(results):
                summary.append(f"[Source {idx+1}] {r.get('title')}\nURL: {r.get('href')}\nContent: {r.get('body')}\n")
            return "\n".join(summary)
        else:
            return f"No results found for '{query}'."

@tool
def search_web_tool(query: str) -> str:
    """
    Search the web for current information using Tavily or fallback APIs.
    Input should be a search string query.
    """
    logger.info(f"Executing web search for: '{query}'")
    
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        try:
            return _execute_tavily_search(query, tavily_key)
        except Exception as e:
            logger.error(f"Tavily search failed after retries: {e}")
            
    # Fallback to free DuckDuckGo search
    try:
        return _execute_ddg_search(query)
    except Exception as e:
        logger.error(f"DuckDuckGo search failed after retries: {e}")
        return f"Search result for '{query}': Error accessing internet search. ({e})"

@tool
async def browse_website_tool(url: str) -> str:
    """
    Browse a specific website URL, extracts text content, and captures a screenshot.
    Returns page title and visible text.
    """
    logger.info(f"Browsing URL: {url}")
    result = await browser_service.browse_url(url)
    if result.get("status") == "success":
        return f"Title: {result.get('title')}\nURL: {result.get('url')}\nContent Snippet:\n{result.get('text')[:3000]}"
    else:
        return f"Error browsing page: {result.get('message')}"

@tool
def execute_python_tool(code: str) -> str:
    """
    Runs Python code inside a secure sandboxed runner. 
    Code will run in isolation with no internet access. 
    Use this to run calculations, data manipulation, or generate charts.
    """
    logger.info("Executing generated python script...")
    res = sandbox_executor.execute_python_code(code)
    output = f"Status: {res.get('status')}\nStdout:\n{res.get('stdout')}\nStderr:\n{res.get('stderr')}"
    return output

# --- FILE SYSTEM TOOLS ---

@tool
def create_file_tool(filepath: str, content: str) -> str:
    """
    Creates a new text file inside the safe workspace with the specified content.
    """
    try:
        safe_path = _get_safe_path(filepath)
        os.makedirs(os.path.dirname(safe_path), exist_ok=True)
        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"File created successfully at: {filepath}"
    except Exception as e:
        return f"Failed to create file: {e}"

@tool
def read_file_tool(filepath: str) -> str:
    """
    Reads the text content of a file in the workspace.
    Supports reading raw files (.txt, .py, .csv, .json).
    """
    try:
        safe_path = _get_safe_path(filepath)
        if not os.path.exists(safe_path):
            return f"Error: File not found at '{filepath}'"
        with open(safe_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception as e:
        return f"Failed to read file: {e}"

@tool
def list_files_tool(directory: str = ".") -> str:
    """
    Lists files and subdirectories in the specified workspace directory.
    """
    try:
        safe_path = _get_safe_path(directory)
        items = os.listdir(safe_path)
        output = []
        for item in items:
            item_path = os.path.join(safe_path, item)
            is_dir = "DIR" if os.path.isdir(item_path) else "FILE"
            size = os.path.getsize(item_path) if is_dir == "FILE" else 0
            output.append(f"[{is_dir}] {item} ({size} bytes)")
        return "\n".join(output) if output else "Directory is empty."
    except Exception as e:
        return f"Failed to list directory: {e}"

@tool
def read_pdf_tool(filepath: str) -> str:
    """
    Extracts text from a PDF file in the workspace.
    """
    try:
        safe_path = _get_safe_path(filepath)
        # Attempt standard pypdf imports, fall back to plain read
        try:
            from pypdf import PdfReader
            reader = PdfReader(safe_path)
            text = []
            for page in reader.pages[:10]: # Limit reading to first 10 pages for LLM token limits
                text.append(page.extract_text() or "")
            return "\n".join(text)
        except ImportError:
            # Simple fallback parser
            return f"pypdf package is not installed. Unable to parse PDF content directly for {filepath}."
    except Exception as e:
        return f"Failed to read PDF: {e}"

@tool
def open_application_tool(app_name: str) -> str:
    """
    Launches a local system application (e.g. notepad, calc).
    Only valid for local Windows system operations.
    """
    # Restrict to safe Windows apps
    safe_apps = {
        "notepad": "notepad.exe",
        "calculator": "calc.exe",
        "cmd": "cmd.exe"
    }
    
    app_key = app_name.lower().strip()
    if app_key not in safe_apps:
        return f"Error: Application '{app_name}' is not in the system's safe permission list."

    try:
        subprocess.Popen(safe_apps[app_key])
        return f"Successfully opened system application: {safe_apps[app_key]}"
    except Exception as e:
        return f"Failed to open application: {e}"

# --- GOOGLE WORKSPACE WRAPPER FUNCTIONS ---
# These functions require a database session and a User object. 
# They are called dynamically from the orchestrator node.

async def invoke_gmail_list(user: User, db: Session, limit: int = 5) -> str:
    try:
        emails = await google_workspace_service.fetch_gmail_emails(user, db, limit)
        if not emails:
            return "No messages found in Gmail inbox."
        
        output = []
        for em in emails:
            output.append(f"ID: {em['id']}\nFrom: {em['from']}\nSubject: {em['subject']}\nSnippet: {em['snippet']}\n---")
        return "\n".join(output)
    except Exception as e:
        return f"Gmail reading failed: {e}"

async def invoke_gmail_send(user: User, db: Session, to: str, subject: str, body: str) -> str:
    try:
        success = await google_workspace_service.send_gmail_email(user, db, to, subject, body)
        return "Email sent successfully!" if success else "Failed to send email."
    except Exception as e:
        return f"Gmail send error: {e}"

async def invoke_calendar_list(user: User, db: Session, limit: int = 5) -> str:
    try:
        events = await google_workspace_service.fetch_calendar_events(user, db, limit)
        if not events:
            return "No upcoming calendar events found."
        
        output = []
        for ev in events:
            output.append(f"Summary: {ev['summary']}\nStart: {ev['start']}\nEnd: {ev['end']}\nDescription: {ev['description']}\n---")
        return "\n".join(output)
    except Exception as e:
        return f"Calendar fetch error: {e}"

async def invoke_calendar_create(
    user: User, 
    db: Session, 
    summary: str, 
    start_time: str, 
    end_time: str, 
    description: Optional[str] = None
) -> str:
    try:
        event_id = await google_workspace_service.create_calendar_event(
            user, db, summary, start_time, end_time, description
        )
        return f"Calendar event created successfully. Event ID: {event_id}" if event_id else "Failed to create calendar event."
    except Exception as e:
        return f"Calendar creation error: {e}"

@tool
def gmail_list_emails_tool(limit: int = 5) -> str:
    """Lists emails from the connected Gmail account."""
    pass

@tool
def gmail_send_email_tool(to: str, subject: str, body: str) -> str:
    """Sends an email using the connected Gmail account."""
    pass

@tool
def calendar_list_events_tool(limit: int = 5) -> str:
    """Lists upcoming events from the connected Google Calendar."""
    pass

@tool
def calendar_create_event_tool(summary: str, start_time: str, end_time: str, description: Optional[str] = None) -> str:
    """Creates a new event in the connected Google Calendar. Times must be in ISO format."""
    pass

from app.tools.desktop import desktop_tools
from app.tools.reminders import create_reminder_tool, list_reminders_tool, invoke_create_reminder, invoke_list_reminders

# List of LangChain compatible tools for standard Agent LLM bindings
agent_tools = [
    search_web_tool,
    browse_website_tool,
    execute_python_tool,
    create_file_tool,
    read_file_tool,
    list_files_tool,
    read_pdf_tool,
    open_application_tool,
    create_reminder_tool,
    list_reminders_tool
] + desktop_tools

# Register to PluginManager
from app.tools.plugin_manager import plugin_manager
for t in agent_tools:
    plugin_manager.register_tool(t)

# Register custom handlers for reminders
plugin_manager.register_custom_handler("create_reminder_tool", invoke_create_reminder)
plugin_manager.register_custom_handler("list_reminders_tool", invoke_list_reminders)

# Import integrations to trigger their registration
import app.tools.integrations

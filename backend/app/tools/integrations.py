import logging
from typing import Optional
from langchain_core.tools import tool
from sqlmodel import Session
from app.models.user import User

logger = logging.getLogger(__name__)

# --- GITHUB TOOLS ---

async def invoke_github_list_repos(user: User, db: Session) -> str:
    if not user.github_token:
        return "Error: User has not connected their GitHub account."
    # In a real app, use httpx to call https://api.github.com/user/repos
    # For now, return a mock response
    return "GitHub Repositories:\n- aditi/jarvis-core\n- aditi/nextjs-portfolio\n- aditi/python-scripts"

async def invoke_github_list_issues(user: User, db: Session, repo_name: str) -> str:
    if not user.github_token:
        return "Error: User has not connected their GitHub account."
    return f"Open Issues in {repo_name}:\n- Issue #12: Fix OAuth token refresh bug\n- Issue #14: Upgrade to React 19"

@tool
def github_list_repos_tool() -> str:
    """Lists the repositories belonging to the connected GitHub user account."""
    pass

@tool
def github_list_issues_tool(repo_name: str) -> str:
    """Lists open issues for a specific GitHub repository (format: owner/repo)."""
    pass

# --- NOTION TOOLS ---

async def invoke_notion_search(user: User, db: Session, query: str) -> str:
    if not user.notion_token:
        return "Error: User has not connected their Notion account."
    return f"Notion Search Results for '{query}':\n- Page: Project JARVIS Roadmap (ID: abc-123)\n- Page: Meeting Notes June (ID: def-456)"

@tool
def notion_search_tool(query: str) -> str:
    """Searches the connected Notion workspace for pages matching the query."""
    pass

# --- REGISTRATION ---

integration_tools = [
    github_list_repos_tool,
    github_list_issues_tool,
    notion_search_tool
]

from app.tools.plugin_manager import plugin_manager
for t in integration_tools:
    plugin_manager.register_tool(t)

plugin_manager.register_custom_handler("github_list_repos_tool", invoke_github_list_repos)
plugin_manager.register_custom_handler("github_list_issues_tool", invoke_github_list_issues)
plugin_manager.register_custom_handler("notion_search_tool", invoke_notion_search)

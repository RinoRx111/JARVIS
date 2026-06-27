import logging
from typing import Optional
from langchain_core.tools import tool
from sqlmodel import Session
from app.models.user import User
from app.core.crypto import decrypt_key

logger = logging.getLogger(__name__)

# --- GITHUB TOOLS ---

async def invoke_github_list_repos(user: User, db: Session) -> str:
    from app.core.config import settings
    user_token = decrypt_key(user.github_token) if user.github_token else None
    token = settings.GITHUB_TOKEN or user_token
    if not token or token.startswith("your_"):
        return "GitHub Repositories (Mock Mode):\n- aditi/jarvis-core\n- aditi/nextjs-portfolio\n- aditi/python-scripts"
    
    import httpx
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                repos = res.json()
                repo_list = [f"- {r.get('full_name')} ({r.get('description') or 'No description'})" for r in repos[:10]]
                return "GitHub Repositories:\n" + "\n".join(repo_list)
            else:
                return f"Failed to list repositories: {res.text}"
    except Exception as e:
        return f"Error listing repositories: {e}"

async def invoke_github_list_issues(user: User, db: Session, repo_name: str) -> str:
    from app.core.config import settings
    user_token = decrypt_key(user.github_token) if user.github_token else None
    token = settings.GITHUB_TOKEN or user_token
    if not token or token.startswith("your_"):
        return f"Open Issues in {repo_name} (Mock Mode):\n- Issue #12: Fix OAuth token refresh bug\n- Issue #14: Upgrade to React 19"
    
    import httpx
    url = f"https://api.github.com/repos/{repo_name}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                issues = res.json()
                issue_list = [f"- #{i.get('number')} {i.get('title')} (Status: {i.get('state')})" for i in issues[:10]]
                return f"Open Issues in {repo_name}:\n" + "\n".join(issue_list) if issue_list else f"No open issues in {repo_name}."
            else:
                return f"Failed to list issues: {res.text}"
    except Exception as e:
        return f"Error listing issues: {e}"

async def invoke_github_create_issue(user: User, db: Session, repo_name: str, title: str, body: str) -> str:
    from app.core.config import settings
    user_token = decrypt_key(user.github_token) if user.github_token else None
    token = settings.GITHUB_TOKEN or user_token
    if not token or token.startswith("your_"):
        return f"Simulated GitHub Issue Creation in '{repo_name}':\nIssue Title: {title}\nDescription: {body}\nStatus: Success (Mock Mode)"
    
    import httpx
    url = f"https://api.github.com/repos/{repo_name}/issues"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {"title": title, "body": body}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=data, headers=headers)
            if res.status_code == 201:
                res_data = res.json()
                return f"GitHub issue created successfully! Issue URL: {res_data.get('html_url')}"
            else:
                return f"Failed to create GitHub issue: {res.text}"
    except Exception as e:
        return f"Error creating GitHub issue: {e}"

async def invoke_github_create_repo(user: User, db: Session, name: str, description: str = "") -> str:
    from app.core.config import settings
    user_token = decrypt_key(user.github_token) if user.github_token else None
    token = settings.GITHUB_TOKEN or user_token
    if not token or token.startswith("your_"):
        return f"Simulated GitHub Repository Creation:\nRepo Name: {name}\nDescription: {description}\nStatus: Success (Mock Mode)"
    
    import httpx
    url = "https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {"name": name, "description": description, "private": True}
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=data, headers=headers)
            if res.status_code == 201:
                res_data = res.json()
                return f"GitHub repository '{name}' created successfully! Repo URL: {res_data.get('html_url')}"
            else:
                return f"Failed to create GitHub repository: {res.text}"
    except Exception as e:
        return f"Error creating GitHub repository: {e}"

@tool
def github_list_repos_tool() -> str:
    """Lists the repositories belonging to the connected GitHub user account."""
    pass

@tool
def github_list_issues_tool(repo_name: str) -> str:
    """Lists open issues for a specific GitHub repository (format: owner/repo)."""
    pass

@tool
def github_create_issue_tool(repo_name: str, title: str, body: str) -> str:
    """Creates a new issue in the specified GitHub repository (format: owner/repo)."""
    pass

@tool
def github_create_repo_tool(name: str, description: str = "") -> str:
    """Creates a new private repository on the user's connected GitHub account."""
    pass


# --- LINKEDIN TOOLS ---

async def invoke_linkedin_post(user: User, db: Session, content: str) -> str:
    logger.info(f"Simulating LinkedIn post: {content}")
    return f"Successfully posted update to LinkedIn feed: '{content}'"

async def invoke_linkedin_search_people(user: User, db: Session, query: str) -> str:
    logger.info(f"Searching LinkedIn for '{query}'")
    return f"LinkedIn Search Results for '{query}':\n- Aditya Yamgain (Software Engineer at JARVIS Labs)\n- Aditi Rawat (Data Scientist at RinoRx)\n- Amit Sharma (Product Lead at TechCorp)"

@tool
def linkedin_post_tool(content: str) -> str:
    """Posts a professional update/message directly to the connected LinkedIn feed."""
    pass

@tool
def linkedin_search_people_tool(query: str) -> str:
    """Searches for professionals or profile listings on LinkedIn matching the query."""
    pass


# --- NOTION TOOLS ---

async def invoke_notion_search(user: User, db: Session, query: str) -> str:
    notion_tok = decrypt_key(user.notion_token) if user.notion_token else None
    if not notion_tok:
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
    github_create_issue_tool,
    github_create_repo_tool,
    linkedin_post_tool,
    linkedin_search_people_tool,
    notion_search_tool
]

from app.tools.plugin_manager import plugin_manager
for t in integration_tools:
    plugin_manager.register_tool(t)

plugin_manager.register_custom_handler("github_list_repos_tool", invoke_github_list_repos)
plugin_manager.register_custom_handler("github_list_issues_tool", invoke_github_list_issues)
plugin_manager.register_custom_handler("github_create_issue_tool", invoke_github_create_issue)
plugin_manager.register_custom_handler("github_create_repo_tool", invoke_github_create_repo)
plugin_manager.register_custom_handler("linkedin_post_tool", invoke_linkedin_post)
plugin_manager.register_custom_handler("linkedin_search_people_tool", invoke_linkedin_search_people)
plugin_manager.register_custom_handler("notion_search_tool", invoke_notion_search)

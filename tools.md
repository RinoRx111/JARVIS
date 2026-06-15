# JARVIS Tools Catalog Reference

This document catalogs all developer-facing tools registered in the backend **Plugin Manager** that can be dynamically bound to the LLM agent for task execution.

---

## 🔌 Plugin Manager Architecture

The `PluginManager` maps LangChain-style tools to python functions. It supports two execution structures:
1. **Standard LangChain Tools**: Built with the `@tool` decorator, representing functions that don't need database or request context (e.g. math solvers, volume controllers).
2. **Context-Aware Handlers**: Registered using `plugin_manager.register_custom_handler(name, func)`. These receive database sessions and User contexts directly, which is critical for OAuth-based integrations (e.g., Gmail, Google Calendar, GitHub).

---

## 🛠️ Tool Catalog

### 🌐 Automation & Search Tools

| Tool JSON Schema Name | Python Function | Description | Arguments |
| :--- | :--- | :--- | :--- |
| `search_web_tool` | `search_web_tool` | Searches the web using Tavily Search API with fallback to DuckDuckGo. | `query: str` |
| `browse_website_tool` | `browse_website_tool` | Loads a web page via the browser service, extracts text, and returns content. | `url: str` |
| `execute_python_tool` | `execute_python_tool` | Runs python code inside an isolated sandboxed environment. | `code: str` |

### 📂 File System Tools

| Tool JSON Schema Name | Python Function | Description | Arguments |
| :--- | :--- | :--- | :--- |
| `create_file_tool` | `create_file_tool` | Creates a new text file inside the workspace directory. | `filepath: str`, `content: str` |
| `read_file_tool` | `read_file_tool` | Reads the text content of files (.txt, .py, .csv, .json). | `filepath: str` |
| `list_files_tool` | `list_files_tool` | Lists files and subdirectories in a directory path. | `directory: str = "."` |
| `read_pdf_tool` | `read_pdf_tool` | Extracts and parses text contents from a PDF file. | `filepath: str` |

### 🔊 System & Desktop Control (Windows Only)

| Tool JSON Schema Name | Python Function | Description | Arguments |
| :--- | :--- | :--- | :--- |
| `set_system_volume_tool` | `set_system_volume_tool` | Adjusts master system audio volume (0% to 100%). | `level: int` |
| `take_screenshot_tool` | `take_screenshot_tool` | Grabs a screenshot of the active primary display. | *None* |
| `send_notification_tool` | `send_notification_tool` | Displays a native OS toast desktop notification. | `title: str`, `body: str` |
| `get_clipboard_text_tool` | `get_clipboard_text_tool` | Reads the current text contents of the system clipboard. | *None* |
| `open_application_tool` | `open_application_tool` | Launches safe local apps (`notepad`, `calculator`, `cmd`). | `app_name: str` |

### ⏰ Tasks & Reminders

| Tool JSON Schema Name | Python Function | Description | Arguments |
| :--- | :--- | :--- | :--- |
| `create_reminder_tool` | `invoke_create_reminder` | Schedules a new database reminder at an ISO-8601 time. | `message: str`, `scheduled_at_iso: str` |
| `list_reminders_tool` | `invoke_list_reminders` | Lists all pending active reminders for the current user. | *None* |

### 📧 Google Workspace Integration (Context-Aware)

| Tool JSON Schema Name | Context Handler Function | Description | Arguments |
| :--- | :--- | :--- | :--- |
| `gmail_list_emails_tool` | `invoke_gmail_list` | Fetches recent email snippets from Inbox. | `limit: int = 5` |
| `gmail_send_email_tool` | `invoke_gmail_send` | Sends a Gmail message to a target address. | `to: str`, `subject: str`, `body: str` |
| `calendar_list_events_tool`| `invoke_calendar_list` | Fetches upcoming calendar events. | `limit: int = 5` |
| `calendar_create_event_tool`| `invoke_calendar_create` | Schedules a Google Calendar event. | `summary: str`, `start_time: str` (ISO), `end_time: str` (ISO), `description: str` |

### 🔗 External Services (Scaffolding/Mocks)

| Tool JSON Schema Name | Context Handler Function | Description | Arguments |
| :--- | :--- | :--- | :--- |
| `github_list_repos_tool` | `invoke_github_list_repos` | Lists repositories from connected GitHub account. | *None* |
| `github_list_issues_tool` | `invoke_github_list_issues` | Lists open issues on a repository (owner/repo). | `repo_name: str` |
| `github_create_issue_tool`| `invoke_github_create_issue`| Creates an issue on a repository. | `repo_name: str`, `title: str`, `body: str` |
| `github_create_repo_tool` | `invoke_github_create_repo` | Creates a new private GitHub repository. | `name: str`, `description: str` |
| `linkedin_post_tool` | `invoke_linkedin_post` | Posts content to connected LinkedIn feed. | `content: str` |
| `linkedin_search_people_tool`| `invoke_linkedin_search_people`| Searches LinkedIn people directory. | `query: str` |
| `notion_search_tool` | `invoke_notion_search` | Searches page index on connected Notion page. | `query: str` |

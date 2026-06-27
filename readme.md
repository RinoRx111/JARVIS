# JARVIS - Personal AI Operating System

JARVIS (Just A Rather Very Intelligent System) is a highly capable AI Assistant and personal operating system, designed to integrate seamlessly with your local desktop hardware, cloud integrations, and automation environments. 

It features a stunning holographic, glassmorphic dark-mode web console built in Next.js, powered by a fast, robust FastAPI backend, and structured as a self-correcting agent graph using LangGraph.

---

## 🌟 Current Progress & Completed Phases

The following core roadmap milestones and upgrades have been successfully completed:

### 🔴 Phase 1: Critical Stability & Core Integrations
* **LangGraph Recursion Safeguards**: Integrated retry limits, loop detection, explicit `END` node routing, and 120-second execution timeouts to prevent infinite loops.
* **Non-Blocking Interrupt System**: Implemented clean cancel events for the agent execution stream without force-terminating the WebSocket connection.
* **Persistent Vector Store**: Integrated local persistent ChromaDB vector store directory, replacing mock client fallbacks.
* **Redis + Celery Tasks**: Structured broker queues for background processes with fallback modes to handle single-process constraints.
* **Docker Sandboxed Executions**: Implemented dockerized shell environments for running generated code scripts with secure confirmation prompts.
* **Detailed Audit Logger**: Configured full logs for sub-routines tracking input arguments, execution statuses, response content, and error traceback details.
* **External APIs**: Integrated Tavily Web Search and Google OAuth2 consent loops (access/refresh token flows for Gmail & Google Calendar services).

### 🟠 Phase 2: Architecture & Codebase Cleanup
* **Zustand & Service Refactoring**: Extracted monolithic client-side logic into standalone modules (`WebSocketService`, `VoiceManager`, `ToolManager`).
* **SQLModel Query Modernization**: Replaced legacy sqlalchemy query strings with clean, type-safe `Session.exec()` executions.
* **Time & Identity Standards**: Migrated all database timestamps to timezone-aware UTC objects (`datetime.now(UTC)`) and refactored client side identifiers to `crypto.randomUUID()`.
* **Event-Driven Streaming**: Standardized backend-to-frontend communications via structured JSON events (`on_tool_start`, `on_tool_end`, `on_chat_model_stream`).

### 🎨 Phase 13–15: Design, Analytics & Security Hardening
* **Premium Holographic UI**: Implemented dark-mode glassmorphic interfaces with custom visual styles and dynamic Voice Orb CSS micro-animations.
* **Key Encryption**: Added high-strength cryptography for client credentials, encrypting Groq, Google, and GitHub integration tokens before storing them in `jarvis.db`.
* **Network & Wrapper Hardening**: Restrained uvicorn binding strictly to `127.0.0.1` locally, re-enabled Chromium same-origin security boundaries (`webSecurity: true`), and migrated WebSocket handshakes from URL query parameters to secure JSON payload handshakes.

---

## 🧭 Documentation Tour

For detailed deep-dives into specific areas of the JARVIS environment, please check out:
1. **[System Architecture](architecture.md)** — Architectural diagrams, component overview, database models, and agent execution graph flow.
2. **[Tools Reference Catalog](tools.md)** — Comprehensive lists of all developer-facing python tools and custom handler hooks bound to the LLM.
3. **[Agent Skills & Capabilities](skills.md)** — Detailed descriptions of what JARVIS can do, from local system control to Google Workspace and LinkedIn automation.

---

## 🚀 Quickstart Guide

### 📋 Prerequisites
* **Python 3.10 or higher** (tested on 3.11 and 3.12)
* **Node.js 18 or higher** (tested on 20+)
* **Docker Desktop** (optional, for PostgreSQL/Redis support)

### ⚙️ Step 1: Environment Setup
Clone the repository, copy the environment variable template in the root directory, and fill in your keys:
```cmd
copy .env.example .env
```
Open [`.env`](.env) and verify the following key configurations:
* `DEFAULT_LLM_PROVIDER`: Set to `groq` to use Groq Cloud (default) or `openai`, `anthropic`, `gemini` (ensure corresponding API keys are filled).
* `GROQ_API_KEY`: Paste your valid Groq API key (`gsk_...`).
* `DATABASE_URL`: Set to `sqlite:///./jarvis.db` for local standalone setup (or Postgres URL if running in Docker).

### 🖥️ Step 2: Running JARVIS

#### Option A: Running Locally (No Docker)
To run everything directly on your local system using SQLite:
1. Double-click the launcher script in the root directory:
   ```cmd
   JARVIS_local.bat
   ```
2. The script will automatically install Node and Python dependencies, initialize the database tables, install the Playwright browser binaries, and start both backend and frontend servers in separate windows.
3. It will open the browser at `http://localhost:3000`.

#### Option B: Running via Docker Compose
To build and run the entire ecosystem (including PostgreSQL database, ChromaDB vector store, Redis broker, Celery workers, backend API, and React frontend):
1. Make sure Docker Desktop is active.
2. Run the Docker launcher script:
   ```cmd
   JARVIS.bat
   ```
3. This will spin up all containers in detached mode (`docker-compose up -d`) and open the application.

---

## 🛠️ Development & Execution Commands

If you prefer to start or manage individual services manually:

### Python FastAPI Backend
Navigate to the `backend/` directory, activate your virtual environment, and run:
```cmd
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API is served at `http://127.0.0.1:8000`. Swagger API docs are available at `/docs`.

### Next.js Frontend Console
Navigate to the `frontend/` directory and start the dev server:
```cmd
cd frontend
npm install
npm run dev
```
The web dashboard is served at `http://localhost:3000`.

### Running Tests
To run the automated pytest test suite (unit and blackbox API integration tests):
```cmd
cd backend
python -m pytest
```

---

## 🔒 Security Constraints
* **Electron CSP Boundaries**: Re-enabled same-origin policy (`webSecurity: true`) in Electron wrappers. The frontend has strict Content Security Policy (`CSP`) `<meta>` tags to allow scripts only from trusted sources.
* **WebSocket Handshake Auth**: Real-time WebSocket connection URLs no longer expose JWT tokens in query logs; authentication is verified securely through a JSON payload sent immediately upon connection open.
* **Local Binder restriction**: The backend `uvicorn` server binds strictly to `127.0.0.1` locally, preventing external networks from accessing your private API gateway.
* **Code Execution Sandbox Limitation**: Python code sandbox executions run on the host system without process-level container isolation. To mitigate this risk:
  * All agent-initiated code execution tools are gated behind an interactive human-approval prompt in the client UI.
  * If a request is received from a context with no active WebSocket session (e.g., direct REST API calls), the request is aborted immediately with a denial status.
  * *Hardening Roadmap*: Real process isolation (such as executing code in a restricted container or a resource-limited user profile) is planned for future releases.

# Software Requirement Specification (SRS)
## Project Name: JARVIS – AI Operating System
**Version**: 1.0.0  
**Date**: 2026-06-05  

---

## 1. Introduction & Project Goal
JARVIS is a futuristic AI Operating System designed as an advanced AI Assistant + AI Agent. JARVIS is built to run locally and in the cloud, capable of multimodal interaction (voice, text), autonomous web browsing and searching, document analysis, multi-agent execution, local system command execution, Google Workspace (Gmail/Calendar) integration, and persistent memory.

JARVIS aims to move beyond a simple chat interface, functioning as a proactive co-pilot that can execute tasks on behalf of the user, control local files and system commands, and utilize a range of local and cloud-based models.

---

## 2. Requirement Analysis

### 2.1 Functional Requirements

#### FR-1: Multimodal Interaction
- **FR-1.1**: The system MUST support voice-to-text input (transcription) using OpenAI Whisper (local/cloud).
- **FR-1.2**: The system MUST support text-to-speech output (synthesis) using ElevenLabs and local text-to-speech engines.
- **FR-1.3**: The system MUST support real-time audio streaming for low-latency conversational voice mode.
- **FR-1.4**: The system MUST accept text input and output text responses.

#### FR-2: Information Retrieval & Browsing
- **FR-2.1**: The system MUST be able to perform web searches using external search APIs (e.g., Google Search, Brave Search, Tavily).
- **FR-2.2**: The system MUST support headless and headful browsing via Playwright/Selenium to read website content, click buttons, and submit forms dynamically.
- **FR-2.3**: The system MUST parse, index, and query PDF files and office documents (.docx, .txt, .csv) uploaded by the user.

#### FR-3: Memory & Context Management
- **FR-3.1**: The system MUST remember past user conversations using short-term memory (session history).
- **FR-3.2**: The system MUST persist long-term memories using vector databases (ChromaDB) to recall user preferences, facts, and past events.
- **FR-3.3**: The system MUST extract entities and semantic summaries from conversations to update the user's profile continuously.

#### FR-4: Code Execution & Automation
- **FR-4.1**: The system MUST generate clean, valid Python and Bash code based on user instructions.
- **FR-4.2**: The system MUST execute generated Python code within a sandboxed/containerized environment and return stdout, stderr, or visual output (plots, files).
- **FR-4.3**: The system MUST perform local file management (create, read, update, delete files in designated workspaces).

#### FR-5: Third-Party & API Integrations
- **FR-5.1**: The system MUST read, send, search, and delete emails using the Google Gmail API.
- **FR-5.2**: The system MUST read, create, update, and cancel events using the Google Calendar API.
- **FR-5.3**: The system MUST interact with GitHub (list repos, view issues, create commits, pull requests) using the GitHub API.
- **FR-5.4**: The system MUST fetch weather and news forecasts dynamically.

#### FR-6: Multi-Agent Orchestration & Planning
- **FR-6.1**: The system MUST break down complex user prompts into multi-step execution plans.
- **FR-6.2**: The system MUST deploy specialized sub-agents (e.g., Browser Agent, Coding Agent, Workspace Agent) to run tasks in parallel or sequentially.
- **FR-6.3**: The system MUST detect errors, handle retries, and adapt execution plans dynamically when tools fail.

---

### 2.2 Non-Functional Requirements

- **NFR-1 (Latency)**: Voice synthesis/transcription roundtrip latency MUST be under 1.5 seconds. Chat responses should begin streaming within 500ms of input receipt.
- **NFR-2 (Privacy & Security)**: Local storage of memories and databases must be fully encrypted. Sensitive API keys must be encrypted at rest and never returned via frontend APIs.
- **NFR-3 (Scalability)**: The orchestrator must support concurrent execution of multiple agent tasks without blocking user interaction.
- **NFR-4 (Extensibility)**: Adding new tools or agents must require zero modification to the core agent loop (utilizing dynamic plugin registration).
- **NFR-5 (Resilience)**: Network issues during external API calls must fail gracefully with automated retries and clear error feedback to the user.

---

### 2.3 User Stories

1. **Voice-first Workflow**: *As a developer, I want to say "JARVIS, draft a Python script to scrape the latest news on AI and save it as a text file", so that I can generate code hands-free while focusing on another screen.*
2. **Context-Aware Memory**: *As a project manager, I want JARVIS to remember that "My principal developer is Sarah" from a conversation three days ago, so that when I ask "Who should I assign the backend refactoring to?", JARVIS suggests Sarah.*
3. **Autonomous Research**: *As an analyst, I want to upload a 50-page PDF report and ask "Compare the quarterly figures in this document with current market trends on the web", so that JARVIS can combine local PDF reading with live web scraping to output a comparative synthesis.*
4. **Google Workspace Sync**: *As an executive, I want to ask "What is my schedule looking like tomorrow, and do I have any emails from clients regarding the project design?", so that JARVIS handles Gmail and Google Calendar querying in a single voice response.*

---

### 2.4 Use Cases

#### Use Case UC-1: Executing a Custom Script
- **Primary Actor**: User (via Frontend)
- **Preconditions**: Backend sandbox environment (Docker container or local sub-process) is active.
- **Flow**:
  1. User commands JARVIS: "Create a chart showing the trend of Apple's stock price over the last year."
  2. Orchestrator fetches historical data via Search API.
  3. Coding Agent writes a Python script using `matplotlib` and `yfinance`.
  4. Executor runs the script inside a sandboxed environment.
  5. The generated chart image is saved to a shared static folder.
  6. Frontend renders the chart and JARVIS explains the result.

#### Use Case UC-2: Setting a Contextual Calendar Event
- **Primary Actor**: User (via Voice)
- **Preconditions**: Google OAuth credentials loaded; calendar read/write scope approved.
- **Flow**:
  1. User speaks: "JARVIS, schedule a meeting with Sarah about the redesign tomorrow at 3 PM."
  2. Whisper transcribes speech to text.
  3. Memory retrieves Sarah's email from past contacts or database.
  4. Google Calendar service formats the calendar payload.
  5. API call creates the invite.
  6. JARVIS speaks back: "I have scheduled the redesign meeting with Sarah tomorrow from 3 to 4 PM. Invitation sent."

---

### 2.5 Feature Priority Matrix (MoSCoW)

| Must Have (Sprint 1-2) | Should Have (Sprint 3) | Could Have (Sprint 4) | Won't Have (Phase 1 Scope) |
|---|---|---|---|
| Text/Voice Input & Output (Whisper/ElevenLabs) | Multi-Agent Orchestration / Sub-agents | Autonomous Selenium Web Interaction | Custom LLM Fine-Tuning |
| Short-term conversation history | Browser Automation via Playwright | Advanced Git actions (PRs/merge) | Native Operating System Desktop UI |
| Vector DB Memory (ChromaDB) | Google Workspace Sync (Gmail/Calendar) | Local OS Application Control | Virtual avatar rendering |
| Python execution in sandbox | PDF/Document Reading & Q&A | Multi-user support with custom roles | |
| Basic Web Search & Fetch | Local LLM Integration (Ollama) | | |

---

## 3. Technology Selection & Justification

- **Backend (Python + FastAPI)**: FastAPI offers high-performance asynchronous execution, automatic OpenAPI generation, and seamless integration with Python's rich AI ecosystem (LangChain, LangGraph, ChromaDB, PyTorch).
- **Frontend (React + Next.js + TailwindCSS)**: Next.js provides server-side rendering for speed, built-in routing, and full-stack React capabilities. TailwindCSS enables rapid development of a futuristic dashboard utilizing glassmorphism and clean animations.
- **AI Models**:
  - *Cloud models* (OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Gemini 1.5 Pro) are leveraged for complex agent reasoning and tool usage.
  - *Local models* (Ollama - Llama 3/Mistral) provide a fallback for privacy-sensitive offline tasks.
- **Databases**:
  - *PostgreSQL*: For reliable relational storage (users, session configs, execution logs).
  - *ChromaDB*: Embeds and searches past interactions, text documents, and systemic knowledge for long-term memory.
- **Voice**: Whisper handles fast transcription, and ElevenLabs provides highly natural, low-latency vocal responses.
- **Automation**: Playwright is selected for headless web interactions due to its speed, modern API, and strong anti-bot bypassing.

---

## 4. API & Credential Planning

| API | Purpose | Setup Steps | Auth Method | Required Scopes | Env Variables |
|---|---|---|---|---|---|
| **OpenAI API** | GPT-4o Agent Reasoning, Whisper Transcription | Register at platform.openai.com, create API key | API Key Header | N/A | `OPENAI_API_KEY` |
| **Gemini API** | Multimodal reasoning, code translation | Create API Key via Google AI Studio | API Key Header | N/A | `GEMINI_API_KEY` |
| **Claude API** | Complex planning and high-quality coding tasks | Create API Key via Anthropic Console | API Key Header | N/A | `ANTHROPIC_API_KEY` |
| **Google Gmail** | Read, draft, and send emails | Enable Gmail API in Google Cloud Console, set up OAuth Consent screen | OAuth2 Client ID + Refresh Token | `https://www.googleapis.com/auth/gmail.modify` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Google Calendar**| Read, create, and manage calendar events | Enable Calendar API in Google Cloud Console, add to OAuth configuration | OAuth2 Client ID + Refresh Token | `https://www.googleapis.com/auth/calendar` | Shared with Gmail OAuth |
| **GitHub API** | Commit code, search repos, and log issues | Create GitHub Personal Access Token (PAT) or OAuth App | Bearer Token / OAuth Token | `repo`, `user` | `GITHUB_TOKEN` |
| **OpenWeatherMap** | Fetch real-time weather information | Create API key at openweathermap.org | Query Param Key | N/A | `WEATHER_API_KEY` |
| **GNews API** | Retrieve structured current news updates | Create API key at gnews.io | Query Param Key | N/A | `NEWS_API_KEY` |

---

## 5. Security Planning

1. **Authentication Flow**: Users register and log in using OAuth2 (Google) or standard password authentication, returning a signed, short-lived JWT token.
2. **Authorization**: Roles (Admin, User) control access to sensitive execution tools (e.g., executing system commands requires Admin/Local permissions).
3. **Encryption**: All communication is HTTPS. Database passwords and keys in PostgreSQL are encrypted at rest using AES-256.
4. **Permission System**: Agents must seek user approval before modifying local filesystem structures, sending emails, or executing external shell scripts (configurable user prompt interceptors).
5. **Activity Logs**: Every tool call, agent thought, and system command is logged with timestamp, user ID, parameters, and return status to PostgreSQL.
6. **Secrets Management**: Credentials and API tokens are read dynamically from server environment variables or locked vault solutions; secrets are never stored in plain databases or frontend code.

---

## 6. Development Roadmap

### Sprint 1: Foundation, Voice, and Basic Chat (Weeks 1-2)
- Set up Docker environment, FastAPI backend, Next.js frontend template.
- Implement JWT Auth, login page, and user settings panel.
- Setup Whisper voice transcription and ElevenLabs text-to-speech pipelines.
- Establish baseline LLM gateway endpoint connecting to OpenAI/Gemini/Claude.

### Sprint 2: DB, Memory, and File Q&A (Weeks 3-4)
- Integrate PostgreSQL and ChromaDB with Vector search service.
- Implement session saving and conversational history retrieval.
- Build document processing service (extracting text from PDFs, CSVs).
- Create basic vector ingestion pipeline so JARVIS can answer questions about uploaded documents.

### Sprint 3: Web Automation, Google Workspace, and Tools (Weeks 5-6)
- Setup Playwright browser service for web searching and text scraping.
- Implement Gmail and Google Calendar OAuth2 integration.
- Build Tool Executor module (allowing the agent to run web searches, read calendar events, send emails).
- Create Code Sandbox using Docker container sub-executors to run Python safely.

### Sprint 4: Agent Orchestrator & Final Polish (Weeks 7-8)
- Integrate LangGraph/custom state manager to enable multi-agent task planning and retries.
- Build dynamic UI components for showing agent "thought processes" and execution logs.
- Add advanced custom styles (futuristic dark mode, responsive mobile UI, micro-animations).
- Complete comprehensive integration testing and end-to-end security audits.

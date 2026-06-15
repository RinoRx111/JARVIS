# JARVIS AI Skills & Capabilities

This document details the practical skills and user-facing capabilities that **JARVIS** can execute to assist you in your daily work.

---

## 🎭 Conversational & Contextual Skills

### 🗣️ Dry Wit & Formal Tone
JARVIS speaks with precision, confidence, and dry wit. It addresses the user as "Sir" (specifically, you, Aditya), remains slightly formal, avoids fluff or unnecessary questions, and handles system failures calmly.

### 🧠 Persistent Long-Term Memory
JARVIS automatically extracts facts and user preferences from conversations in the background. It uses a Celery task to parse messages and stores them in vector or relational databases:
* *General Memory*: Stores details like favorite tools, occupational tasks, or schedules (e.g. *"Remember that I work on my portfolio on weekends"*).
* *Structured Profile*: Tracks personal parameters such as full name, nickname, communication style, or timezone.

---

## 🧮 Sandbox Calculations & Code Writing

When you ask JARVIS to solve mathematical equations, parse complex datasets, or build graphs:
1. **Write Code**: JARVIS drafts a custom Python script matching your requirements.
2. **Safe Execution**: It passes the script to the sandbox executor which runs the code in an isolated subprocess.
3. **Presents Results**: The stdout output, values, or errors are parsed and printed clearly back to the chat.

---

## 🔍 Smart Web Research & Web Automation

JARVIS can research topic specifications or scrape online data:
* **Tavily Web Search**: Performs targeted information retrieval using Tavily (with automatic fallback to DuckDuckGo if quota is exceeded).
* **Virtual Browser**: Automates Chrome/Chromium using the Playwright engine:
  * Navigates to a target URL.
  * Extracts structural layout content and texts.
  * Takes screenshots of the page to verify UI elements or execution statuses.

---

## 📧 Google Workspace Integration

With your Google Account linked via secure OAuth:
* **Gmail Management**: Lists email headers and snippets from your inbox, and drafts or sends emails directly using your address.
* **Google Calendar Scheduling**: Checks your upcoming schedule, schedules events, and updates timestamps (times are mapped in clean ISO format).

---

## 💻 Hardware & Local Desktop Operations (Windows)

JARVIS has direct bindings to control aspects of your host machine:
* **Volume Adjustment**: Changes the master system speaker volume (0 to 100) using the `pycaw` API.
* **Desktop Screenshots**: Captures a full image grab of your active display screen.
* **Desktop Notifications**: Pushes native OS notifications onto your Windows notification feed using `plyer`.
* **Clipboard Reading**: Pulls text snippets from your local copy clipboard.
* **App Launcher**: Starts safe local system processes (like `notepad`, `calculator`, or `cmd`).

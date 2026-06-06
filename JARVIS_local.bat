@echo off
title JARVIS OS Local Bootstrapper (No Docker)
echo ===================================================
echo         INITIALIZING LOCAL JARVIS OS GRID (NO DOCKER)
echo ===================================================
echo.

:: 1. Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your system PATH.
    echo Please install Python (3.10+) and try again.
    pause
    exit /b
)

:: 2. Check Node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your system PATH.
    echo Please install Node.js and try again.
    pause
    exit /b
)

:: 3. Configure Local Environment Variables
if not exist .env (
    echo [1/4] Generating local environment configuration...
    copy .env.example .env >nul
    
    :: Override settings for SQLite database and local fallbacks
    powershell -Command "(gc .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=sqlite:///jarvis.db' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'CHROMA_HOST=.*', 'CHROMA_HOST=' | Out-File -encoding ASCII .env"
    echo Created local .env configured for SQLite.
) else (
    echo [1/4] Environment configuration active.
)

:: 4. Install & Run Backend
echo [2/4] Initializing Python backend environment...
cd backend
python -m pip install -r requirements.txt >nul 2>&1
echo Installing browser dependencies for Virtual Browser...
python -m playwright install chromium
:: Launch uvicorn backend server in a separate persistent window
start "JARVIS Backend Server" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
cd ..

:: 5. Install & Run Frontend
echo [3/4] Initializing React/Next.js frontend environment...
cd frontend
:: Launch next.js server in a separate persistent window
start "JARVIS Frontend Console" cmd /k "npm run dev"
cd ..

:: 6. Wait for servers to bind
echo [4/4] Activating holographic grid systems...
timeout /t 6 /nobreak >nul

:: Open browser in standalone app mode
where msedge >nul 2>&1
if %errorlevel% eq 0 (
    start msedge --app=http://localhost:3000
    goto end
)

where chrome >nul 2>&1
if %errorlevel% eq 0 (
    start chrome --app=http://localhost:3000
    goto end
)

start http://localhost:3000

:end
echo.
echo ===================================================
echo    JARVIS IS ONLINE LOCALLY. BOOT STAGE CLOSING.
echo ===================================================
timeout /t 2 >nul
exit

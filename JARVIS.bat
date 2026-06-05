@echo off
title JARVIS OS Bootstrapper
echo ===================================================
echo             INITIALIZING JARVIS OS GRID
echo ===================================================
echo.

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running.
    echo Please launch Docker Desktop and try again.
    echo.
    pause
    exit /b
)

echo [1/3] Spinning up database and server containers in background...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers.
    pause
    exit /b
)

echo.
echo [2/3] Waiting for network grids to bind...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Initializing Holographic HUD Console...

:: Try to launch in borderless app window mode using default browsers
where msedge >nul 2>&1
if %errorlevel% eq 0 (
    echo Launching standalone app frame via Microsoft Edge...
    start msedge --app=http://localhost:3000
    goto end
)

where chrome >nul 2>&1
if %errorlevel% eq 0 (
    echo Launching standalone app frame via Google Chrome...
    start chrome --app=http://localhost:3000
    goto end
)

:: Fallback if Edge or Chrome paths aren't registered globally
echo Launching default system browser...
start http://localhost:3000

:end
echo.
echo ===================================================
echo     JARVIS IS ONLINE. LAUNCH TERMINAL STAGE CLOSING.
echo ===================================================
timeout /t 2 >nul
exit

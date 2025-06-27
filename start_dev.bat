@echo off
echo Starting Sentinel Development Environment...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting Backend (Python Flask)...
start "Backend" cmd /c "cd backend & set FLASK_ENV=development & set DEBUG=True & python app.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend (Next.js)...
start "Frontend" cmd /c "cd frontend & npm run dev"

echo.
echo Development servers are starting:
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Press any key to stop all services...
pause >nul

echo Stopping services...
taskkill /fi "windowtitle eq Backend*" /t /f >nul 2>&1
taskkill /fi "windowtitle eq Frontend*" /t /f >nul 2>&1

echo All services stopped. 
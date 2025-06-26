@echo off
title Stopping Sentinel Enhanced

echo 🛑 Stopping Sentinel Enhanced...

REM Stop services on ports
echo 🔧 Stopping backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo 🌐 Stopping frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Stop Neo4j if Docker available
docker --version >nul 2>&1
if not errorlevel 1 (
    echo 🗄️ Stopping Neo4j...
    docker stop sentinel-neo4j >nul 2>&1
)

REM Clean up processes
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo.
echo ✅ Sentinel Enhanced stopped successfully!
echo.
pause 
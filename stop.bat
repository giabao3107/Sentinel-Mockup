@echo off
title Stopping Sentinel Enhanced

echo Stopping Sentinel Enhanced...

REM Stop services on ports
echo 🔧 Stopping backend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping frontend...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)


REM Clean up processes
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1

echo.
echo Sentinel Enhanced stopped successfully!
echo.
pause 
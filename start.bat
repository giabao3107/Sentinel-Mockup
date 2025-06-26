@echo off
title Sentinel Enhanced - Blockchain Threat Intelligence Platform

echo 🛡️ Starting Sentinel Enhanced Platform
echo =======================================

REM Check if setup has been run
if not exist "backend\.env" (
    echo ⚠️ Configuration not found. Running setup...
    python scripts\setup.py
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Start Neo4j if Docker is available
docker --version >nul 2>&1
if not errorlevel 1 (
    echo 🗄️ Starting Neo4j database...
    docker start sentinel-neo4j >nul 2>&1
    if errorlevel 1 (
        echo 📦 Creating Neo4j container...
        docker run --name sentinel-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password -d neo4j:5.13 >nul 2>&1
    )
    echo ✅ Neo4j ready
)

echo 🚀 Starting services...

REM Start backend
echo 🔧 Backend starting...
cd backend
start "Sentinel Backend" python run.py
cd ..

REM Start frontend
echo 🌐 Frontend starting...
cd frontend
start "Sentinel Frontend" cmd /c "npm install --silent && npm run dev"
cd ..

REM Wait for services
timeout /t 3 /nobreak >nul

echo.
echo ✅ Sentinel Enhanced is running!
echo.
echo 🌐 Dashboard: http://localhost:3000
echo 🔗 API: http://localhost:5000
echo 🗄️ Neo4j: http://localhost:7474
echo.
echo 💡 Opening dashboard...
start http://localhost:3000

pause 
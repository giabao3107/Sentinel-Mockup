@echo off
REM Railway Deployment Script for Sentinel (Windows)

echo 🚀 Preparing Sentinel for Railway deployment...

REM Check if we're in the right directory
if not exist "railway.json" (
    echo ❌ Error: railway.json not found. Make sure you're in the project root.
    exit /b 1
)

REM Check if Railway CLI is installed
railway --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Railway CLI...
    npm install -g @railway/cli
)

REM Login to Railway
echo 🔑 Checking Railway authentication...
railway auth

REM Link to Railway project
echo 🔗 Linking to Railway project...
railway link

REM Set environment variables for production
echo ⚙️ Setting environment variables...
railway variables set FLASK_ENV=production
railway variables set PYTHONUNBUFFERED=1
railway variables set PIP_NO_CACHE_DIR=1

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

echo ✅ Deployment complete! Check Railway dashboard for status.
echo 📊 Health check will be available at: https://your-app.railway.app/health
pause 
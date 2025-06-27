#!/bin/bash
# Railway Deployment Script for Sentinel

echo "🚀 Preparing Sentinel for Railway deployment..."

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
    echo "❌ Error: railway.json not found. Make sure you're in the project root."
    exit 1
fi

# Install Railway CLI if not present
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔑 Checking Railway authentication..."
railway auth

# Link to Railway project (if not already linked)
echo "🔗 Linking to Railway project..."
railway link

# Set environment variables for production
echo "⚙️ Setting environment variables..."
railway variables set FLASK_ENV=production
railway variables set PYTHONUNBUFFERED=1
railway variables set PIP_NO_CACHE_DIR=1

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete! Check Railway dashboard for status."
echo "📊 Health check will be available at: https://your-app.railway.app/health" 
#!/bin/bash

# Test Production Deployment Script
echo "🧪 Testing Production Deployment..."

# Get URLs from user
echo "📝 Enter your Backend URL (Railway/Render):"
read BACKEND_URL

echo "📝 Enter your Frontend URL (Vercel):"
read FRONTEND_URL

echo ""
echo "🔍 Testing Backend..."

# Test backend health
echo "Testing: $BACKEND_URL/health"
curl -s "$BACKEND_URL/health" | jq . || echo "❌ Backend health check failed"

echo ""
echo "Testing: $BACKEND_URL/api/info"
curl -s "$BACKEND_URL/api/info" | jq . || echo "❌ Backend API info failed"

echo ""
echo "🔍 Testing Frontend..."

# Test frontend
echo "Testing: $FRONTEND_URL"
curl -s -I "$FRONTEND_URL" | head -1 || echo "❌ Frontend connection failed"

echo ""
echo "🔗 Testing API Integration..."

# Test a sample wallet (if you want to test API integration)
echo "Testing wallet API through frontend..."
echo "Open: $FRONTEND_URL"
echo "Try searching: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"

echo ""
echo "✅ Test completed!"
echo "If all tests pass, your production deployment is working correctly."

# PowerShell version
echo ""
echo "📋 PowerShell commands for Windows:"
echo "Invoke-RestMethod -Uri '$BACKEND_URL/health'"
echo "Invoke-RestMethod -Uri '$BACKEND_URL/api/info'" 
# 🚀 Quick Deploy Guide

## Backend (Railway)

1. **🔗 [railway.app](https://railway.app)** → New Project → Deploy from GitHub
2. **📁 Root Directory:** `backend`
3. **⚙️ Environment Variables:**
   ```
   FLASK_ENV=production
   NEO4J_URI=your_neo4j_uri
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ETHERSCAN_API_KEY=your_key
   ```
4. **🚀 Deploy** → Copy URL: `https://your-app.railway.app`

## Frontend (Vercel)

1. **🔗 [vercel.com](https://vercel.com)** → Import Project
2. **📁 Root Directory:** `frontend`
3. **⚙️ Environment Variables:**
   ```
   BACKEND_URL=https://your-app.railway.app
   NODE_ENV=production
   ```
4. **🚀 Deploy** → Copy URL: `https://your-app.vercel.app`

## ✅ Test

- **Backend:** `https://your-app.railway.app/health`
- **Frontend:** `https://your-app.vercel.app`
- **Integration:** Search a wallet address on frontend

## 🔧 Troubleshooting

- **404 Frontend:** Check `BACKEND_URL` in Vercel environment variables
- **CORS Error:** Add your Vercel domain to Railway `VERCEL_DOMAIN` env var
- **500 Backend:** Check Railway logs for missing environment variables

---

**📖 Full guide:** See `DEPLOY.md` for detailed instructions 
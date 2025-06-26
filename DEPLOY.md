# Hướng dẫn Deploy Production

## Overview
Dự án này bao gồm:
- **Frontend**: Next.js (deploy lên Vercel)
- **Backend**: Python Flask (deploy lên Railway/Render)

## Bước 1: Deploy Backend

### Option A: Deploy lên Railway (Khuyến nghị)

1. **Đăng ký Railway**: Truy cập [railway.app](https://railway.app)

2. **Tạo project mới**:
   - Connect GitHub repository
   - Chọn repository `1matrix`
   - Chọn thư mục `backend/` làm root

3. **Cấu hình Environment Variables**:
   ```
   NEO4J_URI=your_neo4j_uri
   NEO4J_USER=your_neo4j_user  
   NEO4J_PASSWORD=your_neo4j_password
   ETHERSCAN_API_KEY=your_etherscan_key
   FLASK_ENV=production
   ```

4. **Tạo file `backend/railway.json`**:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "python run.py",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

5. **Deploy**: Railway sẽ tự động deploy

### Option B: Deploy lên Render

1. **Đăng ký Render**: Truy cập [render.com](https://render.com)

2. **Tạo Web Service**:
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python run.py`

3. **Cấu hình Environment Variables** (giống Railway)

## Bước 2: Deploy Frontend lên Vercel

1. **Import Project**:
   - Truy cập [vercel.com](https://vercel.com)
   - Import từ GitHub repository

2. **Cấu hình Build Settings**:
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables**:
   ```
   BACKEND_URL=https://your-backend-url.railway.app
   NODE_ENV=production
   ```

4. **Deploy**: Vercel sẽ tự động deploy

## Bước 3: Kết nối Frontend và Backend

1. **Lấy Backend URL**:
   - Railway: `https://your-project.railway.app`
   - Render: `https://your-service.onrender.com`

2. **Cập nhật Environment Variables trên Vercel**:
   - Vào Project Settings → Environment Variables
   - Thêm `BACKEND_URL` với URL backend vừa có

3. **Redeploy Frontend**: Trigger deploy lại để áp dụng env vars

## Bước 4: Test Production

1. **Kiểm tra Backend**: Truy cập `https://your-backend-url/api/health`
2. **Kiểm tra Frontend**: Truy cập Vercel URL
3. **Test tính năng**: Thử search wallet để đảm bảo API calls hoạt động

## Troubleshooting

### Frontend lỗi 404
- Kiểm tra `BACKEND_URL` environment variable
- Đảm bảo backend đang chạy và accessible

### Backend lỗi 500
- Kiểm tra logs trên Railway/Render
- Đảm bảo tất cả environment variables đã được set

### API calls thất bại
- Kiểm tra CORS settings trong backend
- Kiểm tra network tab trong browser devtools

## Custom Domain (Optional)

### Backend
- Railway: Settings → Domains → Add custom domain
- Render: Settings → Custom Domains

### Frontend  
- Vercel: Settings → Domains → Add domain

## Monitoring

### Backend
- Railway: Built-in metrics và logs
- Render: Metrics tab

### Frontend
- Vercel: Analytics và deployment logs

## Security

1. **Environment Variables**: Không commit sensitive data
2. **CORS**: Cấu hình proper CORS trong backend
3. **HTTPS**: Đảm bảo cả frontend và backend dùng HTTPS
4. **Rate Limiting**: Implement trong backend nếu cần 
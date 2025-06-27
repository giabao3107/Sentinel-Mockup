# Environment Setup Guide

## Cách thiết lập file .env

### 1. Copy template file:
```bash
cd backend
cp env.template .env
```

### 2. Cập nhật các giá trị cần thiết:

#### **Bắt buộc phải có:**
```env
# PostgreSQL Database
DATABASE_URL=postgresql://sentinel:sentinel_password@localhost:5432/sentinel

# Redis Cache
REDIS_URL=redis://localhost:6379/0

# Etherscan API (cần để lấy data blockchain)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

#### **Khuyến nghị thiết lập:**
```env
# Flask Security
SECRET_KEY=your-very-secure-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# CORS cho frontend
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Lấy API Keys:

#### **Etherscan API Key (Bắt buộc):**
1. Đăng ký tại: https://etherscan.io/apis
2. Tạo free API key
3. Copy và paste vào `ETHERSCAN_API_KEY`

#### **Optional API Keys:**
- **Infura:** https://infura.io/ (cho Ethereum node access)
- **Alchemy:** https://www.alchemy.com/ (alternative Ethereum API)
- **Moralis:** https://moralis.io/ (multi-chain data)

### 4. Database Configuration:

#### **Development (Local):**
```env
DATABASE_URL=postgresql://sentinel:sentinel_password@localhost:5432/sentinel
REDIS_URL=redis://localhost:6379/0
```

#### **Production:**
```env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://username:password@prod-host:5432/database
REDIS_URL=redis://prod-redis:6379/0
SSL_REQUIRED=True
```

### 5. Alert System (Optional):

#### **Email Alerts:**
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

#### **Telegram Bot:**
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 6. Kiểm tra cấu hình:

```bash
# Test database connection
python -c "from app.database.postgres_graph import PostgreSQLGraphClient; client = PostgreSQLGraphClient(); print('DB OK' if client.connect() else 'DB Failed')"

# Test Redis connection
python -c "import redis; r = redis.from_url('redis://localhost:6379'); r.ping(); print('Redis OK')"

# Test Etherscan API
python -c "from app.services.etherscan_service import EtherscanService; service = EtherscanService(); print('API OK' if service.test_connection() else 'API Failed')"
```

## Migration Notes từ Neo4j

### Thay đổi chính:
- ✅ **Removed:** `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
- ✅ **Added:** `DATABASE_URL` cho PostgreSQL
- ✅ **Enhanced:** Graph settings cho PostgreSQL-based graph operations

### Lợi ích:
- **Đơn giản hóa:** Chỉ cần 1 database thay vì 2
- **Chi phí thấp:** Không cần Neo4j license
- **Performance:** Tối ưu cho use case của Sentinel

## Troubleshooting

### Common Issues:

#### **Database Connection Failed:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check connection string
psql postgresql://sentinel:sentinel_password@localhost:5432/sentinel
```

#### **Redis Connection Failed:**
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
redis-cli ping
```

#### **API Key Invalid:**
```bash
# Test Etherscan API
curl "https://api.etherscan.io/api?module=account&action=balance&address=0x742d35Cc6639Cc30d1F42516914616C0FF1D4eDf&tag=latest&apikey=YOUR_API_KEY"
```

#### **CORS Errors:**
```env
# Make sure frontend URL is in CORS_ORIGINS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Development vs Production:

#### **Development Settings:**
```env
FLASK_ENV=development
FLASK_DEBUG=True
DEVELOPMENT_MODE=True
MOCK_EXTERNAL_APIS=False
```

#### **Production Settings:**
```env
FLASK_ENV=production
FLASK_DEBUG=False
DEVELOPMENT_MODE=False
SSL_REQUIRED=True
SECURE_COOKIES=True
```

## Security Notes

### Quan trọng:
- ⚠️ **Never commit .env files** to git
- ⚠️ **Use strong passwords** in production
- ⚠️ **Rotate API keys** regularly
- ⚠️ **Enable SSL** in production

### Best Practices:
- Sử dụng environment-specific .env files
- Store sensitive values in secure vaults
- Regular security audits
- Monitor API usage và rate limits 
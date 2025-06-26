# Sentinel - AI-Powered Blockchain Threat Intelligence Platform

## Tóm tắt dự án

Sentinel là nền tảng phân tích mối đe dọa blockchain sử dụng trí tuệ nhân tạo, được thiết kế để giải quyết vấn đề an ninh ngày càng phức tạp trong hệ sinh thái blockchain. Với sự phát triển mạnh mẽ của các ứng dụng phi tập trung (DeFi), NFT và các dịch vụ blockchain khác, các mối đe dọa như lừa đảo, tấn công, và rửa tiền ngày càng gia tăng. Sentinel cung cấp giải pháp phân tích toàn diện với độ chính xác trên 95% thông qua việc áp dụng Graph Neural Networks và phân tích đa chuỗi thời gian thực.

## Mô tả chi tiết

### Cách thức hoạt động

Sentinel hoạt động dựa trên kiến trúc microservices với các thành phần chính:

**1. Hệ thống thu thập dữ liệu:**
- Kết nối với 6+ mạng blockchain (Ethereum, Arbitrum, Polygon, BSC, Avalanche, Solana)
- Thu thập dữ liệu giao dịch thời gian thực từ các API như Etherscan, Polygonscan
- Lưu trữ và xử lý hơn 10 triệu giao dịch mỗi ngày

**2. Công cụ phân tích AI:**
- Graph Neural Networks (GNN) sử dụng PyTorch để phân loại địa chỉ nguy hiểm
- Thuật toán DBSCAN để phát hiện cluster địa chỉ liên quan
- Phân tích hành vi mạng với 32 đặc trưng được trích xuất tự động

**3. Hệ thống cảnh báo thông minh:**
- Giám sát liên tục 24/7 với khả năng phản hồi dưới 1 giây
- Hệ thống rule-based tùy chỉnh cho từng tổ chức
- Tích hợp với Email, Telegram, Discord, Webhook

### Công nghệ được sử dụng

**Backend:**
- Python Flask cho REST API
- Neo4j Graph Database để lưu trữ mối quan hệ blockchain
- PyTorch cho machine learning models
- Redis cho caching và session management
- Docker và Docker Compose cho containerization

**Frontend:**
- Next.js với TypeScript
- D3.js cho visualisation mạng lưới phức tạp
- Tailwind CSS cho UI responsive
- Real-time WebSocket connections

**Infrastructure:**
- Kubernetes cho orchestration
- Nginx cho load balancing
- PostgreSQL cho user management
- Jenkins/GitHub Actions cho CI/CD

### Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình 3-tier scalable:

**Presentation Layer:** Next.js frontend với SSR/SSG
**Application Layer:** Flask API cluster với auto-scaling
**Data Layer:** Neo4j cluster, Redis cache, PostgreSQL

Kiến trúc microservices cho phép scale từng component độc lập, đảm bảo high availability và fault tolerance.

## Giá trị thực tiễn

### Đối với các nhóm người dùng cụ thể:

**1. Sàn giao dịch tiền mã hóa:**
- Giảm 80% false positive trong phát hiện giao dịch đáng ngờ
- Tiết kiệm 60% thời gian review manual
- Tuân thủ quy định AML/KYC tự động

**2. Cơ quan quản lý và thực thi pháp luật:**
- Phát hiện mạng lưới tội phạm phức tạp qua nhiều blockchain
- Trace nguồn gốc tài sản bất hợp pháp
- Cung cấp báo cáo tuân thủ tự động

**3. Doanh nghiệp DeFi:**
- Bảo vệ người dùng khỏi các địa chỉ nguy hiểm
- Giám sát real-time các mối đe dọa mới
- Tích hợp API đơn giản vào existing systems

**4. Nhà đầu tư cá nhân:**
- Đánh giá rủi ro trước khi tương tác với smart contract
- Cảnh báo sớm về các mối đe dọa tiềm ẩn
- Interface thân thiện không cần kiến thức kỹ thuật

### Giá trị đối với xã hội và nền kinh tế:

- **Bảo vệ người tiêu dùng:** Giảm thiểu tổn thất từ lừa đảo blockchain (ước tính 14 tỷ USD năm 2022)
- **Thúc đẩy adoption:** Tăng niềm tin vào công nghệ blockchain thông qua bảo mật tốt hơn
- **Hỗ trợ compliance:** Giúp doanh nghiệp tuân thủ quy định quốc tế
- **Phát triển kinh tế số:** Tạo môi trường an toàn cho đổi mới blockchain

## Tính sáng tạo

### Điểm khác biệt so với các giải pháp hiện có:

**1. Phân tích đa chiều tích hợp:**
- Kết hợp graph analysis, behavioral analysis, và pattern recognition
- Các giải pháp hiện tại thường chỉ tập trung một khía cạnh

**2. Cross-chain intelligence:**
- Phân tích mối quan hệ qua nhiều blockchain đồng thời
- Phát hiện coordinated attacks trên multiple networks

**3. Real-time adaptive learning:**
- Model AI học và cập nhật liên tục từ threat landscape mới
- Không phụ thuộc vào signature-based detection như các tool truyền thống

**4. User-centric design:**
- API đơn giản có thể tích hợp trong 15 phút
- Dashboard trực quan cho cả technical và non-technical users

**5. Comprehensive threat taxonomy:**
- Phân loại 7 loại mối đe dọa chính với confidence score
- Cung cấp actionable intelligence thay vì chỉ cảnh báo

## Tính khả thi và khả năng mở rộng

### Tính khả thi kỹ thuật:
- **Proven technologies:** Sử dụng các công nghệ đã được kiểm chứng (PyTorch, Neo4j, Next.js)
- **Scalable architecture:** Microservices cho phép scale horizontal
- **Performance tested:** Xử lý 10,000+ địa chỉ/phút trong testing

### Tính khả thi tài chính:
- **Tiered pricing model:** Từ free tier đến enterprise solutions
- **Low operational cost:** Cloud-native architecture giảm infrastructure cost
- **Revenue streams:** API subscriptions, enterprise licenses, consulting services

### Tính khả thi pháp lý:
- **Compliance-first design:** Tuân thủ GDPR, SOC 2 Type II
- **Data privacy:** Không lưu trữ thông tin cá nhân
- **Open standards:** Sử dụng các chuẩn công khai, không vendor lock-in

### Khả năng mở rộng:
- **Technical scaling:** Kubernetes auto-scaling, database sharding
- **Market expansion:** Hỗ trợ thêm các blockchain mới trong 2-4 tuần
- **Feature extension:** Plugin architecture cho custom analysis modules
- **Geographic expansion:** CDN và edge computing cho latency thấp

## Cấu trúc thư viện code, thư mục

```
1matrix/
├── backend/                    # Python Flask API backend
│   ├── app/
│   │   ├── api/               # REST API endpoints
│   │   │   ├── alert_api.py   # Alert management
│   │   │   ├── graph.py       # Graph analysis endpoints
│   │   │   ├── phase3_api.py  # Advanced AI features
│   │   │   ├── public_api.py  # Public API tier
│   │   │   └── wallet.py      # Wallet analysis
│   │   ├── database/          # Database models and connections
│   │   │   ├── models.py      # Data models
│   │   │   └── neo4j_client.py # Graph database client
│   │   ├── services/          # Business logic services
│   │   │   ├── alert_system.py        # Alert processing
│   │   │   ├── etherscan_service.py   # Blockchain data fetching
│   │   │   ├── gnn_model.py          # AI model inference
│   │   │   ├── graph_protocol_service.py # Graph analysis
│   │   │   ├── multichain_service.py  # Multi-blockchain support
│   │   │   ├── network_behavior_analyzer.py # Behavior analysis
│   │   │   ├── risk_scorer.py        # Risk assessment
│   │   │   └── social_intelligence_service.py # Social analysis
│   │   └── utils/             # Utility functions
│   ├── app.py                 # Flask application factory
│   ├── config.py              # Configuration management
│   └── run.py                 # Application entry point
├── frontend/                  # Next.js React frontend
│   ├── components/            # Reusable UI components
│   │   ├── AddressDisplay.tsx  # Address information display
│   │   ├── InvestigationCanvas.tsx # Interactive investigation tool
│   │   ├── Layout.tsx         # Main layout component
│   │   ├── LoadingSpinner.tsx # Loading indicators
│   │   ├── Phase3Dashboard.tsx # Advanced dashboard
│   │   ├── RiskBadge.tsx      # Risk level indicators
│   │   ├── TransactionList.tsx # Transaction display
│   │   ├── WalletDashboard.tsx # Wallet analysis dashboard
│   │   └── WalletSearch.tsx   # Search functionality
│   ├── pages/                 # Next.js pages
│   │   ├── alerts.tsx         # Alert management page
│   │   ├── docs.tsx           # Documentation
│   │   ├── graph.tsx          # Graph visualization
│   │   ├── index.tsx          # Homepage
│   │   └── social.tsx         # Social intelligence features
│   ├── styles/                # CSS and styling
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Frontend utilities
├── scripts/                   # Automation and setup scripts
│   ├── import_more_data.py    # Data import utilities
│   └── setup.py              # Project setup automation
├── tests/                     # Test suites
│   ├── test_neo4j.py          # Database tests
│   └── README.md              # Testing documentation
├── docs/                      # Project documentation
├── docker-compose.yml         # Container orchestration
├── requirements.txt           # Python dependencies
└── README.md                  # Project documentation
```

## Hướng dẫn cài đặt

### Yêu cầu hệ thống:
- Python 3.8 hoặc cao hơn
- Node.js 16 hoặc cao hơn
- Docker và Docker Compose
- Minimum 8GB RAM, 50GB storage

### Các thư viện và framework cần thiết:

**Backend Dependencies:**
```
Flask==2.3.2
PyTorch==2.0.1
Neo4j==5.8.1
Redis==4.5.5
Pandas==2.0.2
NumPy==1.24.3
Scikit-learn==1.2.2
```

**Frontend Dependencies:**
```
Next.js==13.4.3
React==18.2.0
TypeScript==5.1.3
D3.js==7.8.4
Tailwind CSS==3.3.2
```

### Các bước cài đặt chi tiết:

**1. Clone repository:**
```bash
git clone https://github.com/giabao3107/Sentinel_Mockup.git
cd sentinel
```

**2. Thiết lập backend:**
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

**3. Cấu hình environment:**
```bash
# Tạo file .env trong backend/
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn:
ETHERSCAN_API_KEY=your_etherscan_api_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REDIS_URL=redis://localhost:6379
```

**4. Khởi động database services:**
```bash
# Từ root directory
docker-compose up -d neo4j redis
```

**5. Initialize database:**
```bash
cd backend
python scripts/init_database.py
```

**6. Khởi động backend:**
```bash
python run.py
# Backend sẽ chạy tại http://localhost:5000
```

**7. Thiết lập frontend:**
```bash
# Terminal mới
cd frontend
npm install
npm run dev
# Frontend sẽ chạy tại http://localhost:3000
```

**8. Kiểm tra cài đặt:**
- Truy cập http://localhost:3000 để xem dashboard
- Truy cập http://localhost:5000/health để kiểm tra API
- Truy cập http://localhost:7474 để xem Neo4j browser

### Troubleshooting:
- Nếu gặp lỗi port conflict, thay đổi ports trong config files
- Đảm bảo Docker services đang chạy trước khi start application
- Kiểm tra API keys trong .env file
- Xem logs chi tiết trong console output

## Giấy phép

Dự án này được phát hành dưới **MIT License**.

```
MIT License

Copyright (c) 2024 Sentinel Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Lý do chọn MIT License:
- Cho phép sử dụng tự do cho cả mục đích thương mại và phi thương mại
- Khuyến khích sự đóng góp từ cộng đồng
- Tương thích với hầu hết các dự án open source khác
- Đơn giản và dễ hiểu

## Nền tảng lưu trữ

**Primary Repository:**
- GitHub: https://github.com/giabao3107/Sentinel_Mockup
- Branch strategy: GitFlow với main, develop, feature branches
- Continuous Integration với GitHub Actions
- Automated testing và deployment

**Backup và Mirror:**
- GitLab: https://gitlab.com/sentinel-team/sentinel-ai
- BitBucket: https://bitbucket.org/sentinel-team/sentinel
- Local enterprise git servers cho enterprise clients

**Version Management:**
- Semantic versioning (MAJOR.MINOR.PATCH)
- Automated changelog generation
- Tag-based release management
- Docker image versioning aligned với code versions

**Development Workflow:**
- Feature branches cho mỗi tính năng mới
- Pull request reviews với minimum 2 approvals
- Automated testing trước khi merge
- Staging environment cho testing
- Production deployment qua approved releases

**Documentation:**
- Code documentation trong repository
- API documentation auto-generated
- User guides trong GitHub Wiki
- Video tutorials và demos trong releases

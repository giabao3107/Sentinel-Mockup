# Sentinel Platform - Development Guide

Welcome to the Sentinel On-chain Threat Intelligence Platform development documentation. This guide will help you set up, develop, and extend the platform.

## 🏗️ Project Structure

```
sentinel/
├── frontend/                 # Next.js React Frontend
│   ├── components/          # Reusable React components
│   ├── pages/              # Next.js pages (routing)
│   ├── styles/             # CSS and Tailwind styles
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Frontend utility functions
│   └── package.json        # Frontend dependencies
├── backend/                 # Python Flask Backend
│   ├── app/                # Flask application
│   │   ├── api/           # API endpoints
│   │   ├── services/      # Business logic services
│   │   └── utils/         # Backend utilities
│   ├── requirements.txt    # Python dependencies
│   └── run.py             # Flask application entry point
├── docs/                   # Documentation
├── scripts/                # Setup and utility scripts
└── README.md              # Project overview
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** - Backend development
- **Node.js 18+** - Frontend development
- **npm 8+** - Package management

### Setup

1. **Clone and navigate to the project**:
   ```bash
   cd /path/to/sentinel
   ```

2. **Run the setup script**:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

3. **Configure API keys** in `backend/.env`:
   ```env
   ETHERSCAN_API_KEY=your_etherscan_api_key_here
   ```

4. **Start the development servers**:
   ```bash
   ./scripts/start-dev.sh
   ```

5. **Open your browser** to `http://localhost:3000`

## 🔧 Development Workflow

### Backend Development

The backend is a Flask application providing REST APIs for wallet analysis.

#### Key Components:

- **Services Layer** (`app/services/`):
  - `etherscan_service.py` - Blockchain data provider
  - `risk_scorer.py` - Heuristic risk assessment engine

- **API Layer** (`app/api/`):
  - `wallet.py` - Wallet analysis endpoints

- **Utilities** (`app/utils/`):
  - `helpers.py` - Common utility functions

#### Running Backend Only:
```bash
cd backend
source venv/bin/activate
python run.py
```

#### API Endpoints:
- `GET /api/v1/wallet/{address}` - Full wallet analysis
- `GET /api/v1/wallet/{address}/risk-only` - Risk assessment only
- `GET /health` - Health check

### Frontend Development

The frontend is a Next.js React application with TypeScript and Tailwind CSS.

#### Key Components:

- **Pages** (`pages/`):
  - `index.tsx` - Main dashboard page
  - `_app.tsx` - Application wrapper

- **Components** (`components/`):
  - `Layout.tsx` - Main layout wrapper
  - `WalletSearch.tsx` - Address input component
  - `WalletDashboard.tsx` - Analysis results display
  - `RiskBadge.tsx` - Risk level indicator
  - `TransactionList.tsx` - Transaction display
  - `AddressDisplay.tsx` - Address formatting and actions

#### Running Frontend Only:
```bash
cd frontend
npm run dev
```

#### Available Scripts:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Code linting
- `npm run type-check` - TypeScript checking

## 🧪 Testing

### Backend Testing

Create test files in `backend/tests/`:

```python
# backend/tests/test_risk_scorer.py
import unittest
from app.services.risk_scorer import RiskScorer

class TestRiskScorer(unittest.TestCase):
    def setUp(self):
        self.scorer = RiskScorer()
    
    def test_calculate_risk_score(self):
        # Test risk scoring logic
        pass
```

Run tests:
```bash
cd backend
source venv/bin/activate
python -m pytest tests/
```

### Frontend Testing

Add testing dependencies:
```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

## 📊 Phase Development Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Wallet Forensics Dashboard
- [x] Heuristic-based Risk Scoring
- [x] Real-time Etherscan Integration
- [x] Transaction Analysis
- [x] Professional UI/UX

### 🔄 Phase 2: Seed Prototype (Next)
- [ ] Neo4j Graph Database Integration
- [ ] Investigation Canvas with D3.js
- [ ] The Graph Protocol Integration
- [ ] Off-chain Data Enrichment
- [ ] Advanced Backend Routing

### 🚀 Phase 3: Growth Product (Future)
- [ ] Graph Neural Network (GNN) Integration
- [ ] Network Behavior Analysis
- [ ] Sentinel Alert System
- [ ] Public API with Authentication
- [ ] Multi-chain Support (Solana, Arbitrum)

## 🔌 API Integration

### Adding New Data Sources

1. **Create a new service** in `backend/app/services/`:
   ```python
   # backend/app/services/new_service.py
   class NewDataService:
       def __init__(self, api_key):
           self.api_key = api_key
       
       def fetch_data(self, address):
           # Implementation
           pass
   ```

2. **Update the main analysis** in `backend/app/api/wallet.py`:
   ```python
   # Add to analyze_wallet function
   new_service = NewDataService(current_app.config['NEW_API_KEY'])
   new_data = new_service.fetch_data(address)
   ```

### Adding New Risk Factors

1. **Extend the RiskScorer** in `backend/app/services/risk_scorer.py`:
   ```python
   def _analyze_new_pattern(self, transactions):
       score = 0
       factors = []
       tags = []
       
       # Your analysis logic here
       
       return {'score': score, 'factors': factors, 'tags': tags}
   ```

2. **Call the new analysis** in `calculate_risk_score`:
   ```python
   new_risk = self._analyze_new_pattern(transactions)
   base_score += new_risk['score']
   risk_factors.extend(new_risk['factors'])
   behavioral_tags.extend(new_risk['tags'])
   ```

## 🎨 UI/UX Development

### Design System

The platform uses a comprehensive design system:

- **Colors**: Primary (blue), risk levels (green to red)
- **Typography**: System fonts with monospace for addresses
- **Components**: Consistent card layouts, buttons, badges
- **Animations**: Subtle transitions and loading states

### Adding New Components

1. **Create the component** in `frontend/components/`:
   ```tsx
   // frontend/components/NewComponent.tsx
   interface NewComponentProps {
     // Define props
   }
   
   export default function NewComponent(props: NewComponentProps) {
     return (
       <div className="your-classes">
         {/* Component JSX */}
       </div>
     );
   }
   ```

2. **Add TypeScript types** in `frontend/types/index.ts`:
   ```tsx
   export interface NewComponentProps {
     // Define interface
   }
   ```

3. **Use Tailwind classes** for styling (defined in `frontend/styles/globals.css`)

## 📚 Architecture Decisions

### Why Flask over FastAPI?
- Simpler for MVP development
- Extensive ecosystem
- Easy integration with ML libraries

### Why Next.js over Create React App?
- Built-in SSR/SSG capabilities
- File-based routing
- Excellent TypeScript support
- API routes for future backend integration

### Why Tailwind CSS?
- Rapid prototyping
- Consistent design system
- Small bundle size
- Excellent customization

## 🔒 Security Considerations

### API Security
- Rate limiting on endpoints
- Input validation for addresses
- CORS configuration
- Environment variable management

### Frontend Security
- XSS prevention with React
- Secure external links
- Content Security Policy headers
- Safe clipboard operations

## 🐛 Common Issues & Solutions

### Backend Issues

**Issue**: `ImportError: No module named 'app'`
**Solution**: Make sure you're in the backend directory and virtual environment is activated.

**Issue**: Etherscan API rate limits
**Solution**: Implement backoff strategy in `etherscan_service.py`

### Frontend Issues

**Issue**: TypeScript errors about missing modules
**Solution**: Check import paths and ensure all types are defined

**Issue**: Tailwind classes not applying
**Solution**: Verify `tailwind.config.js` content paths

## 📈 Performance Optimization

### Backend
- Implement response caching
- Use connection pooling for external APIs
- Add database indexing (for Phase 2)
- Implement async processing for heavy operations

### Frontend
- Code splitting with Next.js dynamic imports
- Image optimization
- Bundle analysis with `npm run analyze`
- Implement virtual scrolling for large transaction lists

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow code style**: Use provided ESLint/Prettier configs
4. **Write tests**: Add tests for new functionality
5. **Update documentation**: Keep docs in sync with changes
6. **Submit a Pull Request**

### Code Style

**Python (Backend)**:
- Follow PEP 8
- Use type hints where possible
- Document functions with docstrings

**TypeScript (Frontend)**:
- Use functional components
- Prefer interfaces over types
- Use descriptive component names

## 📞 Support

For development questions or issues:
1. Check this documentation
2. Review existing GitHub issues
3. Create a new issue with detailed information
4. Join our Discord community (link in README)

---

**Happy coding! 🛡️**

# Sentinel Development Guide - Phase 2 Enhanced

## Overview

Sentinel is now a next-generation blockchain threat intelligence platform featuring **Phase 2 Enhanced Analysis** with graph-native architecture, social intelligence, and advanced visualization capabilities.

### Phase 2 Key Features

- 🔍 **Investigation Canvas**: Interactive D3.js graph visualization for network analysis
- 🗄️ **Neo4j Graph Database**: Native graph storage for complex relationship queries
- 📊 **The Graph Protocol Integration**: Historical blockchain data ingestion
- 🌐 **Social Intelligence**: Off-chain threat detection from social media
- 🧠 **Enhanced Risk Scoring**: Multi-source risk assessment with ML preparation
- ⚡ **Intelligent Routing**: Automatic routing between real-time APIs and graph database

## Architecture Overview

```
Phase 2 Sentinel Architecture:
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │ Wallet Dashboard │  │Investigation    │  │ Social Intel  │ │
│  │ (Enhanced)      │  │ Canvas (D3.js)  │  │ Dashboard     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP/WebSocket
                              │
┌─────────────────────────────────────────────────────────────┐
│                Backend (Python/Flask)                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │ Intelligent     │  │ Graph Analytics │  │ Social Intel  │ │
│  │ Router          │  │ Service         │  │ Service       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
           │                      │                      │
    ┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐
    │ Etherscan API │    │ Neo4j Database  │    │ Twitter/Telegram│
    │ (Real-time)   │    │ (Graph Store)   │    │ APIs (Social)   │
    └──────────────┘    └─────────────────┘    └─────────────────┘
                               │
                    ┌─────────────────┐
                    │ The Graph       │
                    │ Protocol        │
                    │ (Historical)    │
                    └─────────────────┘
```

## Quick Start

### Phase 1 (Basic Setup)
```bash
# Backend
cd backend
pip install -r requirements.txt
python run.py

# Frontend
cd frontend
npm install
npm run dev
```

### Phase 2 (Enhanced Setup)
```bash
# 1. Neo4j Database (Docker)
docker run --name sentinel-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  -e NEO4J_PLUGINS='["apoc"]' \
  neo4j:5.13

# 2. Environment Variables
cp backend/.env.example backend/.env
# Add:
# NEO4J_URI=bolt://localhost:7687
# NEO4J_USERNAME=neo4j
# NEO4J_PASSWORD=password
# TWITTER_BEARER_TOKEN=your_token
# TELEGRAM_BOT_TOKEN=your_token

# 3. Install Phase 2 Dependencies
cd backend
pip install -r requirements.txt

# 4. Initialize Database
python scripts/init_database.py

# 5. Start Services
python run.py
```

## Project Structure

```
sentinel/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── wallet.py          # Enhanced with routing
│   │   │   └── graph.py           # New: Graph endpoints
│   │   ├── database/
│   │   │   ├── neo4j_client.py    # New: Graph database
│   │   │   └── models.py          # New: Data models
│   │   └── services/
│   │       ├── etherscan_service.py
│   │       ├── graph_protocol_service.py    # New
│   │       ├── social_intelligence_service.py  # New
│   │       └── risk_scorer.py     # Enhanced
│   ├── scripts/
│   │   └── init_database.py       # New: Setup script
│   └── requirements.txt           # Updated for Phase 2
├── frontend/
│   ├── components/
│   │   ├── WalletDashboard.tsx    # Enhanced with tabs
│   │   ├── InvestigationCanvas.tsx # New: D3.js graph
│   │   └── ...
│   └── package.json               # Updated dependencies
└── docs/
    └── DEVELOPMENT.md             # This file
```

## Development Workflow

### 1. Phase 1 Analysis (Real-time)
- User searches for address
- `etherscan_service` fetches current data
- `risk_scorer` calculates heuristic risk
- Frontend displays basic dashboard

### 2. Phase 2 Upgrade (Enhanced)
- User clicks "Upgrade to Enhanced Analysis"
- `graph_protocol_service` fetches historical data
- Data stored in Neo4j via `neo4j_client`
- Enhanced analysis with graph insights
- `social_intelligence_service` adds off-chain context

### 3. Investigation Canvas
- User navigates to "Network Graph" tab
- Frontend calls `/api/graph/subgraph/{address}`
- `neo4j_client` returns graph data
- `InvestigationCanvas` renders D3.js visualization
- Interactive exploration with expand/collapse

## API Documentation

### Phase 1 Endpoints (Existing)
```
GET /api/v1/wallet/{address}
- Enhanced with intelligent routing
- Returns Phase 1 or Phase 2 analysis based on data availability
```

### Phase 2 Endpoints (New)
```
GET /api/graph/subgraph/{address}
- Returns graph visualization data
- Query params: depth, min_value

POST /api/graph/import-address-data/{address}
- Import historical data from The Graph
- Triggers Phase 2 analysis capabilities

GET /api/graph/database-stats
- Neo4j database statistics

GET /api/graph/transaction-path?from={addr}&to={addr}
- Find transaction paths between addresses

GET /api/graph/high-risk-cluster?min_risk={score}
- Get high-risk address clusters
```

## Database Schema

### Neo4j Graph Model
```cypher
// Nodes
CREATE (a:Address {
  hash: string,
  first_seen: datetime,
  balance: float,
  risk_score: float,
  risk_level: string,
  behavioral_tags: [string]
})

CREATE (t:Transaction {
  hash: string,
  timestamp: datetime,
  value: float,
  gas_used: integer
})

CREATE (s:SmartContract {
  address: string,
  name: string,
  is_verified: boolean
})

// Relationships
CREATE (a1:Address)-[:SENT_TO {
  transaction: string,
  value: float,
  timestamp: datetime
}]->(a2:Address)

CREATE (a:Address)-[:INTERACTED_WITH {
  transaction: string,
  method: string
}]->(s:SmartContract)
```

## Environment Configuration

### Backend (.env)
```env
# Phase 1 (Required)
ETHERSCAN_API_KEY=your_key_here
FLASK_ENV=development

# Phase 2 (Enhanced Features)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Social Intelligence (Optional)
TWITTER_BEARER_TOKEN=your_twitter_token
TELEGRAM_BOT_TOKEN=your_telegram_token

# The Graph Protocol
GRAPH_API_URL=https://api.thegraph.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ETHERSCAN_URL=https://etherscan.io
```

## Development Commands

### Backend
```bash
# Install dependencies
pip install -r requirements.txt

# Initialize database
python scripts/init_database.py

# Run development server
python run.py

# Run with debug
FLASK_ENV=development python run.py

# Database migrations
python scripts/migrate_database.py
```

### Frontend
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Testing

### Backend Tests
```bash
# Unit tests
python -m pytest tests/

# Integration tests
python -m pytest tests/integration/

# Graph database tests
python -m pytest tests/test_neo4j.py
```

### Frontend Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Visual regression tests
npm run test:visual
```

## Performance Optimization

### Neo4j Optimization
```cypher
// Create indexes for performance
CREATE INDEX address_hash FOR (a:Address) ON (a.hash);
CREATE INDEX transaction_timestamp FOR (t:Transaction) ON (t.timestamp);
CREATE INDEX risk_score FOR (a:Address) ON (a.risk_score);
```

### Frontend Optimization
- D3.js visualization uses canvas for large graphs
- Virtual scrolling for transaction lists
- Lazy loading for graph data
- WebSocket connections for real-time updates

## Deployment

### Development
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Database backup
docker exec sentinel-neo4j neo4j-admin dump --database=neo4j
```

## Troubleshooting

### Common Issues

1. **Neo4j Connection Failed**
   ```bash
   # Check if Neo4j is running
   docker ps | grep neo4j
   
   # Check logs
   docker logs sentinel-neo4j
   
   # Restart with correct password
   docker run --rm -e NEO4J_AUTH=neo4j/password neo4j:5.13
   ```

2. **Graph Data Not Loading**
   ```bash
   # Check if data was imported
   curl http://localhost:5000/api/graph/database-stats
   
   # Import data manually
   curl -X POST http://localhost:5000/api/graph/import-address-data/0x...
   ```

3. **D3.js Visualization Issues**
   - Check browser console for JavaScript errors
   - Ensure D3.js v7+ is installed
   - Verify graph data format matches interface

4. **Social Intelligence Not Working**
   - Verify Twitter/Telegram API tokens
   - Check rate limits
   - Review social service logs

### Performance Issues

1. **Large Graph Queries**
   - Limit graph depth to 2-3 hops
   - Use pagination for large result sets
   - Implement graph clustering

2. **Memory Usage**
   - Monitor Neo4j heap size
   - Implement data archiving
   - Use connection pooling

## Contributing

### Development Flow
1. Create feature branch: `git checkout -b feature/graph-analytics`
2. Implement changes with tests
3. Update documentation
4. Submit pull request

### Code Standards
- Backend: PEP 8, type hints, docstrings
- Frontend: ESLint, Prettier, TypeScript strict mode
- Database: Cypher best practices

### Performance Guidelines
- Graph queries should complete in <2 seconds
- Frontend should handle 1000+ nodes smoothly
- API responses should be <500ms for simple queries

## Phase 3 Roadmap

### Planned Features
1. **GNN Implementation**: Custom Graph Neural Network for advanced threat detection
2. **Multi-chain Support**: Extend to Solana, Polygon, BSC
3. **Real-time Alerts**: WebSocket-based monitoring system
4. **API Marketplace**: Public API for third-party integrations
5. **Advanced Visualizations**: 3D graphs, temporal analysis

### Research Areas
- Graph clustering algorithms
- Anomaly detection in transaction patterns
- Cross-chain transaction tracing
- Privacy-preserving analysis

---

For questions or support, please check our [GitHub Issues](https://github.com/sentinel/issues) or join our [Discord community](https://discord.gg/sentinel). 
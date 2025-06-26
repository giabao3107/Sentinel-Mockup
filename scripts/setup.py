#!/usr/bin/env python3
"""
Sentinel Production Setup
Advanced Blockchain Threat Intelligence Platform
"""

import os
import sys
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        logger.error("❌ Python 3.8 or higher is required")
        sys.exit(1)
    logger.info(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def install_dependencies():
    """Install Python dependencies"""
    logger.info("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        logger.error("❌ Failed to install dependencies")
        sys.exit(1)

def check_docker():
    """Check if Docker is available"""
    try:
        subprocess.check_output(["docker", "--version"], stderr=subprocess.STDOUT)
        logger.info("✅ Docker detected")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.warning("⚠️ Docker not found - Neo4j setup will be skipped")
        return False

def setup_neo4j():
    """Setup Neo4j database"""
    if not check_docker():
        return False
    
    logger.info("🗄️ Setting up Neo4j database...")
    try:
        # Check if container already exists
        try:
            subprocess.check_output(["docker", "inspect", "sentinel-neo4j"], stderr=subprocess.STDOUT)
            logger.info("✅ Neo4j container already exists")
            
            # Start if not running
            subprocess.check_call(["docker", "start", "sentinel-neo4j"])
            logger.info("✅ Neo4j container started")
            
        except subprocess.CalledProcessError:
            # Create new container
            subprocess.check_call([
                "docker", "run", "--name", "sentinel-neo4j",
                "-p", "7474:7474", "-p", "7687:7687",
                "-e", "NEO4J_AUTH=neo4j/password",
                "-e", "NEO4J_PLUGINS=[\"apoc\"]",
                "-d", "neo4j:5.13"
            ])
            logger.info("✅ Neo4j container created and started")
        
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to setup Neo4j: {e}")
        return False

def create_env_file():
    """Create .env file if it doesn't exist"""
    env_path = "backend/.env"
    if os.path.exists(env_path):
        logger.info("✅ .env file already exists")
        return
    
    logger.info("📝 Creating .env file...")
    env_content = """# Sentinel Configuration
# Required - Blockchain APIs
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Multi-Chain APIs (Optional)
ARBITRUM_API_KEY=your_arbitrum_key
POLYGON_API_KEY=your_polygon_key
BSC_API_KEY=your_bsc_key
AVALANCHE_API_KEY=your_avalanche_key

# Alert System (Optional)
SENDGRID_API_KEY=your_sendgrid_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# API Security
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production
"""
    
    os.makedirs("backend", exist_ok=True)
    with open(env_path, "w") as f:
        f.write(env_content)
    
    logger.info("✅ .env file created")
    logger.warning("⚠️ Please update .env file with your API keys")

def main():
    """Main setup function"""
    print("🛡️ Sentinel Production Setup")
    print("Advanced Blockchain Threat Intelligence Platform")
    print("-" * 50)
    
    # Check requirements
    check_python_version()
    
    # Install dependencies
    install_dependencies()
    
    # Setup database
    neo4j_success = setup_neo4j()
    
    # Create environment file
    create_env_file()
    
    print("\n" + "="*50)
    print("🎯 SETUP COMPLETE!")
    print("="*50)
    
    print("\n📋 Next Steps:")
    print("1. Update backend/.env with your API keys")
    if neo4j_success:
        print("2. Neo4j is running at http://localhost:7474 (neo4j/password)")
    print("3. Start backend: cd backend && python run.py")
    print("4. Start frontend: cd frontend && npm install && npm run dev")
    print("5. Access Sentinel at http://localhost:3000")
    
    print("\n🌐 API Endpoints:")
    print("- Standard API: http://localhost:5000/api/v1")
    print("- AI Intelligence: http://localhost:5000/api/v3")
    print("- Public API: http://localhost:5000/api/v1/public")
    
    print("\n✨ Features Available:")
    print("🧠 AI-Powered Threat Detection")
    print("⛓️ Multi-Chain Analysis")
    print("🚨 Real-time Alerts")
    print("🌌 Galaxy View Visualization")
    print("💰 Professional API")
    
    if not neo4j_success:
        print("\n⚠️ Note: Install Docker and run setup again for full features")

if __name__ == "__main__":
    main() 
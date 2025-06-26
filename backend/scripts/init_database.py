#!/usr/bin/env python3
"""
Sentinel Database Initialization Script - Phase 2
Initialize Neo4j graph database with proper schema, indexes, and constraints
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables from .env file
load_dotenv()

from app.database.neo4j_client import Neo4jClient
from app.database.models import AddressNode, TransactionNode, SmartContractNode

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_neo4j_database():
    """Initialize Neo4j database with schema and sample data"""
    
    logger.info("🚀 Starting Sentinel Neo4j Database Initialization...")
    
    # Initialize Neo4j client
    neo4j_client = Neo4jClient()
    
    try:
        # Test connection
        logger.info("📡 Testing Neo4j connection...")
        if not neo4j_client.connect():
            logger.error("❌ Failed to connect to Neo4j database")
            logger.error("Please ensure Neo4j is running and credentials are correct")
            return False
        
        logger.info("✅ Successfully connected to Neo4j database")
        
        # Initialize database schema
        logger.info("🏗️  Initializing database schema...")
        neo4j_client.initialize_database()
        logger.info("✅ Database schema initialized")
        
        # Create sample data for testing
        logger.info("📊 Creating sample data...")
        create_sample_data(neo4j_client)
        logger.info("✅ Sample data created")
        
        # Verify database setup
        logger.info("🔍 Verifying database setup...")
        stats = neo4j_client.get_database_stats()
        logger.info(f"📈 Database Statistics:")
        logger.info(f"   - Addresses: {stats.get('address_count', 0)}")
        logger.info(f"   - Transactions: {stats.get('transaction_count', 0)}")
        logger.info(f"   - Smart Contracts: {stats.get('smartcontract_count', 0)}")
        logger.info(f"   - Relationships: {stats.get('sent_to_count', 0) + stats.get('interacted_with_count', 0)}")
        
        logger.info("🎉 Neo4j database initialization completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        return False
    
    finally:
        neo4j_client.close()

def create_sample_data(neo4j_client: Neo4jClient):
    """Create sample data for testing and demonstration"""
    
    # Sample addresses with different risk profiles
    sample_addresses = [
        {
            'hash': '0x1234567890123456789012345678901234567890',
            'first_seen': '2023-01-01T00:00:00Z',
            'last_activity': '2024-01-01T00:00:00Z',
            'balance': 10.5,
            'transaction_count': 150,
            'risk_score': 15.0,
            'risk_level': 'LOW',
            'behavioral_tags': ['DeFi Active', 'Regular Trader'],
            'is_contract': False
        },
        {
            'hash': '0x2345678901234567890123456789012345678901',
            'first_seen': '2023-06-01T00:00:00Z',
            'last_activity': '2024-01-01T00:00:00Z',
            'balance': 100.0,
            'transaction_count': 50,
            'risk_score': 75.0,
            'risk_level': 'HIGH',
            'behavioral_tags': ['High Volume', 'Suspicious Patterns'],
            'is_contract': False
        },
        {
            'hash': '0x3456789012345678901234567890123456789012',
            'first_seen': '2023-03-01T00:00:00Z',
            'last_activity': '2024-01-01T00:00:00Z',
            'balance': 5.2,
            'transaction_count': 25,
            'risk_score': 30.0,
            'risk_level': 'MEDIUM',
            'behavioral_tags': ['Bot-like Activity'],
            'is_contract': False
        },
        {
            'hash': '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            'first_seen': '2018-06-26T00:00:00Z',
            'last_activity': '2025-06-26T18:00:00Z',
            'balance': 202.626,
            'transaction_count': 36324,
            'risk_score': 25.0,
            'risk_level': 'LOW',
            'behavioral_tags': ['DeFi Active', 'High Volume', 'Burn Address'],
            'is_contract': False
        }
    ]
    
    # Sample transactions
    sample_transactions = [
        {
            'hash': '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
            'block_number': 18500000,
            'timestamp': '2024-01-01T12:00:00Z',
            'value': 2.5,
            'gas_used': 21000,
            'gas_price': 20000000000,
            'method_id': None,
            'is_error': False
        },
        {
            'hash': '0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
            'block_number': 18500001,
            'timestamp': '2024-01-01T12:05:00Z',
            'value': 50.0,
            'gas_used': 21000,
            'gas_price': 25000000000,
            'method_id': None,
            'is_error': False
        }
    ]
    
    # Sample smart contracts
    sample_contracts = [
        {
            'address': '0x4567890123456789012345678901234567890123',
            'name': 'Uniswap V3 Router',
            'symbol': None,
            'decimals': None,
            'total_supply': None,
            'contract_type': 'DEX',
            'is_verified': True
        }
    ]
    
    # Insert sample data
    logger.info("   📝 Inserting sample addresses...")
    for addr_data in sample_addresses:
        neo4j_client.create_address_node(addr_data)
    
    logger.info("   📝 Inserting sample transactions...")
    for tx_data in sample_transactions:
        neo4j_client.create_transaction_node(tx_data)
    
    logger.info("   📝 Inserting sample smart contracts...")
    for contract_data in sample_contracts:
        neo4j_client.create_smartcontract_node(contract_data)
    
    # Create sample relationships
    logger.info("   🔗 Creating sample relationships...")
    
    # Transaction relationship: Address 1 -> Address 2
    neo4j_client.create_sent_to_relationship(
        from_hash=sample_addresses[0]['hash'],
        to_hash=sample_addresses[1]['hash'],
        tx_hash=sample_transactions[0]['hash'],
        value=2.5
    )
    
    # High-value transaction: Address 2 -> Address 3
    neo4j_client.create_sent_to_relationship(
        from_hash=sample_addresses[1]['hash'],
        to_hash=sample_addresses[2]['hash'],
        tx_hash=sample_transactions[1]['hash'],
        value=50.0
    )
    
    # Contract interaction: Address 1 -> Uniswap
    neo4j_client.create_interacted_with_relationship(
        address_hash=sample_addresses[0]['hash'],
        contract_address=sample_contracts[0]['address'],
        tx_hash=sample_transactions[0]['hash']
    )

def check_prerequisites():
    """Check if all prerequisites are met"""
    
    logger.info("🔍 Checking prerequisites...")
    
    # Check environment variables
    required_env_vars = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD']
    missing_vars = []
    
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        logger.error("Please set the following in your .env file:")
        for var in missing_vars:
            if var == 'NEO4J_URI':
                logger.error(f"   {var}=bolt://localhost:7687")
            elif var == 'NEO4J_USERNAME':
                logger.error(f"   {var}=neo4j")
            elif var == 'NEO4J_PASSWORD':
                logger.error(f"   {var}=your_password")
        return False
    
    logger.info("✅ All prerequisites met")
    return True

def main():
    """Main initialization function"""
    
    print("=" * 60)
    print("🛡️  SENTINEL PHASE 2 DATABASE INITIALIZATION")
    print("=" * 60)
    print()
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites check failed. Please fix the issues above and try again.")
        sys.exit(1)
    
    # Initialize database
    success = init_neo4j_database()
    
    print()
    if success:
        print("🎉 Database initialization completed successfully!")
        print()
        print("Next steps:")
        print("1. Start the backend server: python run.py")
        print("2. Access Neo4j browser: http://localhost:7474")
        print("3. Import real data: POST /api/graph/import-address-data/{address}")
        print()
        print("Sample addresses created for testing:")
        print("- 0x1234567890123456789012345678901234567890 (Low Risk)")
        print("- 0x2345678901234567890123456789012345678901 (High Risk)")
        print("- 0x3456789012345678901234567890123456789012 (Medium Risk)")
    else:
        print("❌ Database initialization failed!")
        print()
        print("Troubleshooting:")
        print("1. Ensure Neo4j is running: docker ps | grep neo4j")
        print("2. Check Neo4j logs: docker logs sentinel-neo4j")
        print("3. Verify connection settings in .env file")
        print("4. Test connection manually: docker exec -it sentinel-neo4j cypher-shell")
        sys.exit(1)
    
    print("=" * 60)

if __name__ == "__main__":
    main() 
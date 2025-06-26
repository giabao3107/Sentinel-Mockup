# Additional import script
import sys
sys.path.append('backend')

from backend.app.database.neo4j_client import Neo4jClient
from datetime import datetime

print(" Adding more sample data...")

try:
    client = Neo4jClient()
    if client.connect():
        # Add more addresses and transactions
        session = client.driver.session()
        
        # Create additional addresses
        session.run("""
            CREATE (a4:Address {
                hash: "0x1234567890123456789012345678901234567890",
                balance: 500000000000000000,
                transaction_count: 45,
                risk_score: 30,
                created_at: datetime(),
                first_seen: datetime("2023-06-15T10:30:00Z"),
                last_activity: datetime("2024-12-26T10:00:00Z")
            })
        """)
        
        session.run("""
            CREATE (a5:Address {
                hash: "0x9876543210987654321098765432109876543210", 
                balance: 3200000000000000000,
                transaction_count: 156,
                risk_score: 85,
                created_at: datetime(),
                first_seen: datetime("2021-12-01T14:20:00Z"),
                last_activity: datetime("2024-12-26T11:15:00Z")
            })
        """)
        
        # Create relationships between existing and new addresses
        session.run("""
            MATCH (a1:Address {hash: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"})
            MATCH (a4:Address {hash: "0x1234567890123456789012345678901234567890"})
            CREATE (a1)-[:SENT_TO {
                value: 750000000000000000,
                timestamp: datetime("2024-12-26T10:00:00Z"),
                transaction: "0xabc789def123456789012345678901234567890abc123456789012345678901234",
                gas_used: 21000
            }]->(a4)
        """)
        
        print(" Additional data imported!")
        
        # Show updated stats
        result = session.run("MATCH (a:Address) RETURN count(a) as total")
        total = result.single()["total"]
        print(f" Total addresses now: {total}")
        
        client.close()
        
    else:
        print(" Failed to connect to Neo4j")
        
except Exception as e:
    print(f" Error: {str(e)}")

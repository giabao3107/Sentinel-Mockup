import sys
sys.path.append('backend')

from backend.app.database.neo4j_client import Neo4jClient

print(" Testing Neo4j connection...")

try:
    client = Neo4jClient()
    if client.connect():
        print(" Neo4j connected successfully!")
        
        # Test query to get addresses
        result = client.driver.session().run("MATCH (a:Address) RETURN count(a) as address_count")
        count = result.single()["address_count"]
        print(f" Found {count} addresses in database")
        
        # Get sample data
        result = client.driver.session().run("""
            MATCH (a:Address)-[r:SENT_TO]->(b:Address) 
            RETURN a.hash as from_addr, b.hash as to_addr, r.value as value 
            LIMIT 3
        """)
        
        print(" Sample transactions:")
        for record in result:
            from_addr = record["from_addr"][:8] + "..."
            to_addr = record["to_addr"][:8] + "..."
            value_eth = record["value"] / 1e18
            print(f"   {from_addr}  {to_addr} ({value_eth:.4f} ETH)")
            
        client.close()
        print(" Neo4j test completed successfully!")
        
    else:
        print(" Failed to connect to Neo4j")
        
except Exception as e:
    print(f" Error: {str(e)}")

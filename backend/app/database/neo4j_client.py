"""
Sentinel Neo4j Client - Graph Database Operations
"""

import os
import logging
from typing import Dict, List, Optional, Any
from neo4j import GraphDatabase, Driver, Session
from datetime import datetime
import json

class Neo4jClient:
    """Neo4j database client for Sentinel graph operations"""
    
    def __init__(self, uri: str = None, username: str = None, password: str = None):
        """Initialize Neo4j connection"""
        self.uri = uri or os.getenv('NEO4J_URI', 'bolt://localhost:7687')
        self.username = username or os.getenv('NEO4J_USERNAME', 'neo4j')
        self.password = password or os.getenv('NEO4J_PASSWORD', 'password')
        
        self.driver: Optional[Driver] = None
        self.logger = logging.getLogger(__name__)
        
    def connect(self) -> bool:
        """Establish connection to Neo4j database"""
        try:
            self.driver = GraphDatabase.driver(
                self.uri, 
                auth=(self.username, self.password)
            )
            
            # Test connection
            with self.driver.session() as session:
                result = session.run("RETURN 'Connected' as status")
                record = result.single()
                
            self.logger.info("Successfully connected to Neo4j database")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect to Neo4j: {str(e)}")
            return False
    
    def close(self):
        """Close Neo4j connection"""
        if self.driver:
            self.driver.close()
            self.logger.info("Neo4j connection closed")
    
    def create_indexes(self):
        """Create database indexes for optimal performance"""
        indexes = [
            "CREATE INDEX address_hash IF NOT EXISTS FOR (a:Address) ON (a.hash)",
            "CREATE INDEX transaction_hash IF NOT EXISTS FOR (t:Transaction) ON (t.hash)",
            "CREATE INDEX smartcontract_address IF NOT EXISTS FOR (s:SmartContract) ON (s.address)",
            "CREATE INDEX transaction_timestamp IF NOT EXISTS FOR (t:Transaction) ON (t.timestamp)",
            "CREATE INDEX address_risk_score IF NOT EXISTS FOR (a:Address) ON (a.risk_score)"
        ]
        
        with self.driver.session() as session:
            for index in indexes:
                try:
                    session.run(index)
                    self.logger.info(f"Created index: {index}")
                except Exception as e:
                    self.logger.warning(f"Index creation failed: {str(e)}")
    
    def create_constraints(self):
        """Create database constraints for data integrity"""
        constraints = [
            "CREATE CONSTRAINT address_unique IF NOT EXISTS FOR (a:Address) REQUIRE a.hash IS UNIQUE",
            "CREATE CONSTRAINT transaction_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.hash IS UNIQUE",
            "CREATE CONSTRAINT smartcontract_unique IF NOT EXISTS FOR (s:SmartContract) REQUIRE s.address IS UNIQUE"
        ]
        
        with self.driver.session() as session:
            for constraint in constraints:
                try:
                    session.run(constraint)
                    self.logger.info(f"Created constraint: {constraint}")
                except Exception as e:
                    self.logger.warning(f"Constraint creation failed: {str(e)}")
    
    def initialize_database(self):
        """Initialize database with indexes and constraints"""
        self.create_constraints()
        self.create_indexes()
        
    # === Node Operations ===
    
    def create_address_node(self, address_data: Dict) -> Dict:
        """Create or update an Address node"""
        query = """
        MERGE (a:Address {hash: $hash})
        SET a.first_seen = COALESCE(a.first_seen, $first_seen),
            a.last_activity = $last_activity,
            a.balance = $balance,
            a.transaction_count = $transaction_count,
            a.risk_score = $risk_score,
            a.risk_level = $risk_level,
            a.behavioral_tags = $behavioral_tags,
            a.is_contract = $is_contract,
            a.updated_at = datetime()
        RETURN a
        """
        
        with self.driver.session() as session:
            result = session.run(query, address_data)
            return result.single()["a"]
    
    def create_transaction_node(self, tx_data: Dict) -> Dict:
        """Create a Transaction node"""
        query = """
        MERGE (t:Transaction {hash: $hash})
        SET t.block_number = $block_number,
            t.timestamp = $timestamp,
            t.value = $value,
            t.gas_used = $gas_used,
            t.gas_price = $gas_price,
            t.method_id = $method_id,
            t.is_error = $is_error,
            t.created_at = datetime()
        RETURN t
        """
        
        with self.driver.session() as session:
            result = session.run(query, tx_data)
            return result.single()["t"]
    
    def create_smartcontract_node(self, contract_data: Dict) -> Dict:
        """Create a SmartContract node"""
        query = """
        MERGE (s:SmartContract {address: $address})
        SET s.name = $name,
            s.symbol = $symbol,
            s.decimals = $decimals,
            s.total_supply = $total_supply,
            s.contract_type = $contract_type,
            s.is_verified = $is_verified,
            s.created_at = datetime()
        RETURN s
        """
        
        with self.driver.session() as session:
            result = session.run(query, contract_data)
            return result.single()["s"]
    
    # === Relationship Operations ===
    
    def create_sent_to_relationship(self, from_hash: str, to_hash: str, tx_hash: str, value: float):
        """Create SENT_TO relationship between addresses via transaction"""
        query = """
        MATCH (from:Address {hash: $from_hash})
        MATCH (to:Address {hash: $to_hash})
        MATCH (tx:Transaction {hash: $tx_hash})
        MERGE (from)-[r:SENT_TO {transaction: $tx_hash}]->(to)
        SET r.value = $value,
            r.timestamp = tx.timestamp
        MERGE (from)-[:MADE]->(tx)
        MERGE (tx)-[:SENT_TO]->(to)
        RETURN r
        """
        
        with self.driver.session() as session:
            return session.run(query, {
                'from_hash': from_hash,
                'to_hash': to_hash, 
                'tx_hash': tx_hash,
                'value': value
            })
    
    def create_interacted_with_relationship(self, address_hash: str, contract_address: str, tx_hash: str):
        """Create INTERACTED_WITH relationship between address and smart contract"""
        query = """
        MATCH (addr:Address {hash: $address_hash})
        MATCH (contract:SmartContract {address: $contract_address})
        MATCH (tx:Transaction {hash: $tx_hash})
        MERGE (addr)-[r:INTERACTED_WITH {transaction: $tx_hash}]->(contract)
        SET r.timestamp = tx.timestamp
        MERGE (addr)-[:MADE]->(tx)
        MERGE (tx)-[:INTERACTED_WITH]->(contract)
        RETURN r
        """
        
        with self.driver.session() as session:
            return session.run(query, {
                'address_hash': address_hash,
                'contract_address': contract_address,
                'tx_hash': tx_hash
            })
    
    # === Query Operations ===
    
    def get_address_subgraph(self, address_hash: str, depth: int = 2) -> Dict:
        """Get subgraph around an address with specified depth"""
        query = """
        MATCH path = (center:Address {hash: $address_hash})-[*1..$depth]-(connected)
        WITH center, collect(DISTINCT connected) as nodes, 
             collect(DISTINCT relationships(path)) as rels
        RETURN center, nodes, rels
        """
        
        with self.driver.session() as session:
            result = session.run(query, {'address_hash': address_hash, 'depth': depth})
            record = result.single()
            
            if not record:
                return {'nodes': [], 'relationships': []}
                
            # Process nodes and relationships for visualization
            nodes = [self._node_to_dict(record['center'])]
            for node in record['nodes']:
                nodes.append(self._node_to_dict(node))
                
            relationships = []
            for rel_list in record['rels']:
                for rel in rel_list:
                    relationships.append(self._relationship_to_dict(rel))
            
            return {
                'nodes': nodes,
                'relationships': relationships
            }
    
    def find_transaction_path(self, from_hash: str, to_hash: str, max_depth: int = 5) -> List[Dict]:
        """Find transaction paths between two addresses"""
        query = """
        MATCH path = shortestPath((from:Address {hash: $from_hash})-[*1..$max_depth]-(to:Address {hash: $to_hash}))
        WHERE from <> to
        RETURN path
        LIMIT 10
        """
        
        with self.driver.session() as session:
            result = session.run(query, {
                'from_hash': from_hash,
                'to_hash': to_hash,
                'max_depth': max_depth
            })
            
            paths = []
            for record in result:
                path_data = {
                    'nodes': [self._node_to_dict(node) for node in record['path'].nodes],
                    'relationships': [self._relationship_to_dict(rel) for rel in record['path'].relationships]
                }
                paths.append(path_data)
            
            return paths
    
    def get_high_risk_cluster(self, min_risk_score: float = 60) -> Dict:
        """Get cluster of high-risk addresses and their connections"""
        query = """
        MATCH (risky:Address)
        WHERE risky.risk_score >= $min_risk_score
        MATCH path = (risky)-[r:SENT_TO|INTERACTED_WITH]-(connected:Address)
        WITH risky, connected, r
        RETURN collect(DISTINCT risky) as risky_nodes,
               collect(DISTINCT connected) as connected_nodes,
               collect(DISTINCT r) as relationships
        """
        
        with self.driver.session() as session:
            result = session.run(query, {'min_risk_score': min_risk_score})
            record = result.single()
            
            if not record:
                return {'nodes': [], 'relationships': []}
            
            nodes = []
            for node in record['risky_nodes'] + record['connected_nodes']:
                nodes.append(self._node_to_dict(node))
            
            relationships = []
            for rel in record['relationships']:
                relationships.append(self._relationship_to_dict(rel))
            
            return {
                'nodes': nodes,
                'relationships': relationships
            }
    
    def get_address_analytics(self, address_hash: str) -> Dict:
        """Get comprehensive analytics for an address"""
        query = """
        MATCH (addr:Address {hash: $address_hash})
        OPTIONAL MATCH (addr)-[sent:SENT_TO]->(to_addr:Address)
        OPTIONAL MATCH (from_addr:Address)-[received:SENT_TO]->(addr)
        OPTIONAL MATCH (addr)-[interacted:INTERACTED_WITH]->(contract:SmartContract)
        
        RETURN addr,
               count(DISTINCT sent) as outgoing_count,
               count(DISTINCT received) as incoming_count,
               count(DISTINCT interacted) as contract_interactions,
               sum(sent.value) as total_sent,
               sum(received.value) as total_received,
               collect(DISTINCT to_addr.hash) as sent_to_addresses,
               collect(DISTINCT from_addr.hash) as received_from_addresses,
               collect(DISTINCT contract.address) as interacted_contracts
        """
        
        with self.driver.session() as session:
            result = session.run(query, {'address_hash': address_hash})
            record = result.single()
            
            if not record:
                return None
            
            return {
                'address': self._node_to_dict(record['addr']),
                'outgoing_count': record['outgoing_count'],
                'incoming_count': record['incoming_count'],
                'contract_interactions': record['contract_interactions'],
                'total_sent': record['total_sent'] or 0,
                'total_received': record['total_received'] or 0,
                'sent_to_addresses': record['sent_to_addresses'],
                'received_from_addresses': record['received_from_addresses'],
                'interacted_contracts': record['interacted_contracts']
            }
    
    # === Utility Methods ===
    
    def _node_to_dict(self, node) -> Dict:
        """Convert Neo4j node to dictionary"""
        result = dict(node)
        result['id'] = node.element_id
        result['labels'] = list(node.labels)
        return result
    
    def _relationship_to_dict(self, rel) -> Dict:
        """Convert Neo4j relationship to dictionary"""
        result = dict(rel)
        result['id'] = rel.element_id
        result['type'] = rel.type
        result['start_node'] = rel.start_node.element_id
        result['end_node'] = rel.end_node.element_id
        return result
    
    def execute_custom_query(self, query: str, parameters: Dict = None) -> List[Dict]:
        """Execute custom Cypher query"""
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
    
    # === Data Import Operations ===
    
    def bulk_import_addresses(self, addresses: List[Dict]):
        """Bulk import address data"""
        query = """
        UNWIND $addresses as addr_data
        MERGE (a:Address {hash: addr_data.hash})
        SET a += addr_data,
            a.updated_at = datetime()
        """
        
        with self.driver.session() as session:
            session.run(query, {'addresses': addresses})
    
    def bulk_import_transactions(self, transactions: List[Dict]):
        """Bulk import transaction data"""
        query = """
        UNWIND $transactions as tx_data
        MERGE (t:Transaction {hash: tx_data.hash})
        SET t += tx_data,
            t.created_at = datetime()
        """
        
        with self.driver.session() as session:
            session.run(query, {'transactions': transactions})
    
    def get_database_stats(self) -> Dict:
        """Get database statistics"""
        queries = {
            'address_count': "MATCH (a:Address) RETURN count(a) as count",
            'transaction_count': "MATCH (t:Transaction) RETURN count(t) as count",
            'smartcontract_count': "MATCH (s:SmartContract) RETURN count(s) as count",
            'sent_to_count': "MATCH ()-[r:SENT_TO]->() RETURN count(r) as count",
            'interacted_with_count': "MATCH ()-[r:INTERACTED_WITH]->() RETURN count(r) as count"
        }
        
        stats = {}
        with self.driver.session() as session:
            for key, query in queries.items():
                result = session.run(query)
                stats[key] = result.single()['count']
        
        return stats 
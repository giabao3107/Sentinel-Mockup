"""
Sentinel The Graph Protocol Service - Historical Blockchain Data Provider
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import httpx
from gql import gql, Client
from gql.transport.httpx import HTTPXTransport
import os

class GraphProtocolService:
    """Service for querying The Graph Protocol subgraphs"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # The Graph endpoints
        self.subgraph_endpoints = {
            'ethereum': 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
            'ethereum_blocks': 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
            'ethereum_erc20': 'https://api.thegraph.com/subgraphs/name/ianlapham/erc20-transfers',
            # Add more subgraphs as needed
        }
        
        # HTTP client for API calls
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()
    
    def _get_transport(self, endpoint: str):
        """Get GraphQL transport for endpoint"""
        return HTTPXTransport(url=endpoint)
    
    async def query_subgraph(self, subgraph_name: str, query: str, variables: Dict = None) -> Dict:
        """Execute GraphQL query on subgraph"""
        if subgraph_name not in self.subgraph_endpoints:
            raise ValueError(f"Unknown subgraph: {subgraph_name}")
        
        endpoint = self.subgraph_endpoints[subgraph_name]
        transport = self._get_transport(endpoint)
        
        try:
            async with Client(transport=transport) as client:
                result = await client.execute_async(gql(query), variable_values=variables or {})
                return result
        except Exception as e:
            self.logger.error(f"Error querying subgraph {subgraph_name}: {str(e)}")
            raise
    
    async def get_address_transactions(self, address: str, limit: int = 1000, skip: int = 0) -> List[Dict]:
        """Get historical transactions for an address"""
        
        # Query for ERC20 transfers involving the address
        erc20_query = """
        query GetERC20Transfers($address: String!, $limit: Int!, $skip: Int!) {
            transfers(
                where: {
                    or: [
                        { from: $address },
                        { to: $address }
                    ]
                }
                first: $limit
                skip: $skip
                orderBy: timestamp
                orderDirection: desc
            ) {
                id
                transaction {
                    id
                    blockNumber
                    timestamp
                    gasUsed
                    gasPrice
                }
                token {
                    id
                    name
                    symbol
                    decimals
                }
                from
                to
                value
                timestamp
            }
        }
        """
        
        variables = {
            'address': address.lower(),
            'limit': limit,
            'skip': skip
        }
        
        try:
            result = await self.query_subgraph('ethereum_erc20', erc20_query, variables)
            return result.get('transfers', [])
        except Exception as e:
            self.logger.error(f"Error fetching transactions for {address}: {str(e)}")
            return []
    
    async def get_address_interactions(self, address: str, limit: int = 500) -> List[Dict]:
        """Get smart contract interactions for an address"""
        
        # Query for smart contract interactions
        interactions_query = """
        query GetContractInteractions($address: String!, $limit: Int!) {
            transactions(
                where: {
                    or: [
                        { from: $address },
                        { to: $address }
                    ]
                }
                first: $limit
                orderBy: timestamp
                orderDirection: desc
            ) {
                id
                blockNumber
                timestamp
                from
                to
                value
                gasUsed
                gasPrice
                input
            }
        }
        """
        
        variables = {
            'address': address.lower(),
            'limit': limit
        }
        
        try:
            result = await self.query_subgraph('ethereum_blocks', interactions_query, variables)
            return result.get('transactions', [])
        except Exception as e:
            self.logger.error(f"Error fetching interactions for {address}: {str(e)}")
            return []
    
    async def get_token_transfers_in_range(self, start_timestamp: int, end_timestamp: int, limit: int = 1000) -> List[Dict]:
        """Get token transfers within a timestamp range"""
        
        transfers_query = """
        query GetTransfersInRange($startTime: Int!, $endTime: Int!, $limit: Int!) {
            transfers(
                where: {
                    timestamp_gte: $startTime,
                    timestamp_lte: $endTime
                }
                first: $limit
                orderBy: timestamp
                orderDirection: asc
            ) {
                id
                transaction {
                    id
                    blockNumber
                    timestamp
                    gasUsed
                    gasPrice
                }
                token {
                    id
                    name
                    symbol
                    decimals
                    totalSupply
                }
                from
                to
                value
                timestamp
            }
        }
        """
        
        variables = {
            'startTime': start_timestamp,
            'endTime': end_timestamp,
            'limit': limit
        }
        
        try:
            result = await self.query_subgraph('ethereum_erc20', transfers_query, variables)
            return result.get('transfers', [])
        except Exception as e:
            self.logger.error(f"Error fetching transfers in range: {str(e)}")
            return []
    
    async def get_high_value_transactions(self, min_value_eth: float = 100, limit: int = 500) -> List[Dict]:
        """Get high-value transactions for analysis"""
        
        # Convert ETH to Wei
        min_value_wei = str(int(min_value_eth * 10**18))
        
        high_value_query = """
        query GetHighValueTransactions($minValue: String!, $limit: Int!) {
            transactions(
                where: {
                    value_gte: $minValue
                }
                first: $limit
                orderBy: timestamp
                orderDirection: desc
            ) {
                id
                blockNumber
                timestamp
                from
                to
                value
                gasUsed
                gasPrice
                input
            }
        }
        """
        
        variables = {
            'minValue': min_value_wei,
            'limit': limit
        }
        
        try:
            result = await self.query_subgraph('ethereum_blocks', high_value_query, variables)
            return result.get('transactions', [])
        except Exception as e:
            self.logger.error(f"Error fetching high-value transactions: {str(e)}")
            return []
    
    async def get_contract_creations(self, limit: int = 100) -> List[Dict]:
        """Get recent contract creations"""
        
        contract_query = """
        query GetContractCreations($limit: Int!) {
            transactions(
                where: {
                    to: null
                }
                first: $limit
                orderBy: timestamp
                orderDirection: desc
            ) {
                id
                blockNumber
                timestamp
                from
                value
                gasUsed
                gasPrice
                input
            }
        }
        """
        
        variables = {'limit': limit}
        
        try:
            result = await self.query_subgraph('ethereum_blocks', contract_query, variables)
            return result.get('transactions', [])
        except Exception as e:
            self.logger.error(f"Error fetching contract creations: {str(e)}")
            return []
    
    async def get_address_network(self, address: str, depth: int = 2, min_value: float = 1.0) -> Dict:
        """Get transaction network around an address"""
        
        network_data = {
            'center_address': address,
            'nodes': set(),
            'edges': []
        }
        
        # Start with the center address
        current_addresses = {address}
        all_addresses = {address}
        
        for current_depth in range(depth):
            next_addresses = set()
            
            for addr in current_addresses:
                # Get transactions involving this address
                transactions = await self.get_address_transactions(addr, limit=200)
                
                for tx in transactions:
                    tx_value = float(tx.get('value', 0)) / 10**18  # Convert to ETH
                    
                    if tx_value >= min_value:
                        from_addr = tx.get('from', '').lower()
                        to_addr = tx.get('to', '').lower()
                        
                        # Add addresses to network
                        if from_addr and from_addr not in all_addresses:
                            next_addresses.add(from_addr)
                            all_addresses.add(from_addr)
                        
                        if to_addr and to_addr not in all_addresses:
                            next_addresses.add(to_addr)
                            all_addresses.add(to_addr)
                        
                        # Add edge to network
                        network_data['edges'].append({
                            'from': from_addr,
                            'to': to_addr,
                            'value': tx_value,
                            'transaction': tx.get('transaction', {}).get('id'),
                            'timestamp': tx.get('timestamp'),
                            'token': tx.get('token', {})
                        })
            
            current_addresses = next_addresses
            
            # Limit network size to prevent explosion
            if len(all_addresses) > 1000:
                break
        
        network_data['nodes'] = list(all_addresses)
        return network_data
    
    async def analyze_address_patterns(self, address: str) -> Dict:
        """Analyze transaction patterns for an address"""
        
        # Get comprehensive transaction data
        transactions = await self.get_address_transactions(address, limit=2000)
        
        if not transactions:
            return {
                'address': address,
                'patterns': {},
                'analysis': 'No transaction data available'
            }
        
        analysis = {
            'address': address,
            'total_transactions': len(transactions),
            'patterns': {},
            'temporal_analysis': {},
            'value_analysis': {},
            'network_analysis': {}
        }
        
        # Temporal patterns
        timestamps = [int(tx.get('timestamp', 0)) for tx in transactions]
        if timestamps:
            time_diffs = [timestamps[i] - timestamps[i+1] for i in range(len(timestamps)-1)]
            avg_interval = sum(time_diffs) / len(time_diffs) if time_diffs else 0
            
            analysis['temporal_analysis'] = {
                'average_interval_seconds': avg_interval,
                'first_transaction': datetime.fromtimestamp(min(timestamps)).isoformat(),
                'last_transaction': datetime.fromtimestamp(max(timestamps)).isoformat(),
                'time_span_days': (max(timestamps) - min(timestamps)) / 86400,
                'activity_frequency': len(transactions) / ((max(timestamps) - min(timestamps)) / 86400) if max(timestamps) != min(timestamps) else 0
            }
        
        # Value patterns
        values = [float(tx.get('value', 0)) / 10**18 for tx in transactions]
        if values:
            analysis['value_analysis'] = {
                'total_volume': sum(values),
                'average_value': sum(values) / len(values),
                'max_value': max(values),
                'min_value': min(values),
                'round_number_ratio': sum(1 for v in values if v == int(v)) / len(values)
            }
        
        # Network patterns
        counterparts = set()
        for tx in transactions:
            from_addr = tx.get('from', '').lower()
            to_addr = tx.get('to', '').lower()
            
            if from_addr != address.lower():
                counterparts.add(from_addr)
            if to_addr != address.lower():
                counterparts.add(to_addr)
        
        analysis['network_analysis'] = {
            'unique_counterparts': len(counterparts),
            'network_diversity': len(counterparts) / len(transactions) if transactions else 0,
            'top_counterparts': list(counterparts)[:10]  # Top 10 for brevity
        }
        
        # Pattern detection
        patterns = []
        
        # Regular interval pattern
        if analysis['temporal_analysis'].get('average_interval_seconds', 0) > 0:
            regular_intervals = sum(1 for diff in time_diffs if abs(diff - avg_interval) < avg_interval * 0.1)
            if regular_intervals > len(time_diffs) * 0.7:
                patterns.append('regular_intervals')
        
        # Round value pattern
        if analysis['value_analysis'].get('round_number_ratio', 0) > 0.7:
            patterns.append('round_values')
        
        # Low diversity pattern (potential circular activity)
        if analysis['network_analysis'].get('network_diversity', 1) < 0.1:
            patterns.append('low_diversity')
        
        analysis['patterns'] = {
            'detected_patterns': patterns,
            'pattern_count': len(patterns),
            'suspicion_score': min(len(patterns) * 25, 100)  # Simple scoring
        }
        
        return analysis
    
    # === Data Processing for Neo4j ===
    
    def process_transactions_for_neo4j(self, transactions: List[Dict]) -> Dict:
        """Process Graph Protocol transaction data for Neo4j insertion"""
        
        processed_data = {
            'addresses': {},
            'transactions': [],
            'relationships': []
        }
        
        for tx in transactions:
            # Process transaction
            tx_data = {
                'hash': tx.get('transaction', {}).get('id', tx.get('id')),
                'block_number': int(tx.get('transaction', {}).get('blockNumber', tx.get('blockNumber', 0))),
                'timestamp': datetime.fromtimestamp(int(tx.get('timestamp', 0))),
                'value': float(tx.get('value', 0)) / 10**18,  # Convert to ETH
                'gas_used': int(tx.get('transaction', {}).get('gasUsed', tx.get('gasUsed', 0))),
                'gas_price': int(tx.get('transaction', {}).get('gasPrice', tx.get('gasPrice', 0))),
                'is_error': False  # The Graph typically only shows successful transactions
            }
            processed_data['transactions'].append(tx_data)
            
            # Process addresses
            from_addr = tx.get('from', '').lower()
            to_addr = tx.get('to', '').lower()
            
            for addr in [from_addr, to_addr]:
                if addr and addr not in processed_data['addresses']:
                    processed_data['addresses'][addr] = {
                        'hash': addr,
                        'first_seen': tx_data['timestamp'],
                        'last_activity': tx_data['timestamp'],
                        'balance': 0.0,  # Will be updated later
                        'transaction_count': 0,
                        'is_contract': False  # Will be determined later
                    }
            
            # Create relationship
            if from_addr and to_addr:
                relationship = {
                    'from_hash': from_addr,
                    'to_hash': to_addr,
                    'transaction': tx_data['hash'],
                    'value': tx_data['value'],
                    'timestamp': tx_data['timestamp']
                }
                processed_data['relationships'].append(relationship)
        
        return processed_data
    
    async def bulk_fetch_address_data(self, addresses: List[str], batch_size: int = 10) -> Dict:
        """Bulk fetch data for multiple addresses"""
        
        all_data = {
            'addresses': {},
            'transactions': [],
            'relationships': []
        }
        
        # Process addresses in batches to avoid overwhelming The Graph
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            # Fetch data for each address in the batch
            batch_tasks = []
            for address in batch:
                task = self.get_address_transactions(address, limit=500)
                batch_tasks.append(task)
            
            # Execute batch
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            
            # Process results
            for address, transactions in zip(batch, batch_results):
                if isinstance(transactions, Exception):
                    self.logger.error(f"Error fetching data for {address}: {transactions}")
                    continue
                
                # Process transaction data
                processed = self.process_transactions_for_neo4j(transactions)
                
                # Merge with all_data
                all_data['addresses'].update(processed['addresses'])
                all_data['transactions'].extend(processed['transactions'])
                all_data['relationships'].extend(processed['relationships'])
            
            # Rate limiting - wait between batches
            await asyncio.sleep(1)
        
        return all_data 
"""
Sentinel Etherscan Service - Blockchain Data Provider
"""

import requests
import time
from datetime import datetime
from typing import Dict, List, Optional
from app.utils.helpers import format_wei_to_ether

class EtherscanService:
    """Service for interacting with Etherscan API"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or 'YourApiKeyToken'  # Demo key for testing
        self.base_url = 'https://api.etherscan.io/api'
        self.rate_limit_delay = 0.2  # 200ms between requests
        
    def _make_request(self, params: Dict) -> Dict:
        """Make a request to Etherscan API with rate limiting"""
        
        # Add API key to parameters
        params['apikey'] = self.api_key
        
        # Rate limiting
        time.sleep(self.rate_limit_delay)
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Check for API errors
            if data.get('status') == '0' and 'rate limit' in data.get('message', '').lower():
                raise Exception(f"Etherscan API rate limit exceeded: {data.get('message')}")
            
            if data.get('status') == '0':
                raise Exception(f"Etherscan API error: {data.get('message', 'Unknown error')}")
                
            return data
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error when calling Etherscan API: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing Etherscan API response: {str(e)}")
    
    def get_balance(self, address: str) -> Dict:
        """Get ETH balance for an address"""
        
        params = {
            'module': 'account',
            'action': 'balance',
            'address': address,
            'tag': 'latest'
        }
        
        response = self._make_request(params)
        balance_wei = int(response.get('result', '0'))
        
        return {
            'balance': balance_wei,
            'balance_ether': format_wei_to_ether(balance_wei),
            'address': address,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_transactions(self, address: str, limit: int = 10000) -> Dict:
        """Get transaction history for an address"""
        
        params = {
            'module': 'account',
            'action': 'txlist',
            'address': address,
            'startblock': 0,
            'endblock': 99999999,
            'page': 1,
            'offset': min(limit, 10000),  # Etherscan max is 10k
            'sort': 'desc'
        }
        
        response = self._make_request(params)
        transactions = response.get('result', [])
        
        # Process transactions
        processed_transactions = []
        total_sent = 0
        total_received = 0
        
        for tx in transactions:
            # Convert to more readable format
            processed_tx = {
                'hash': tx.get('hash'),
                'from': tx.get('from'),
                'to': tx.get('to'),
                'value_wei': int(tx.get('value', '0')),
                'value_ether': format_wei_to_ether(int(tx.get('value', '0'))),
                'timestamp': datetime.fromtimestamp(int(tx.get('timeStamp', '0'))).isoformat(),
                'block_number': int(tx.get('blockNumber', '0')),
                'gas_used': int(tx.get('gasUsed', '0')),
                'gas_price': int(tx.get('gasPrice', '0')),
                'transaction_fee': format_wei_to_ether(int(tx.get('gasUsed', '0')) * int(tx.get('gasPrice', '0'))),
                'is_error': tx.get('isError') == '1',
                'method_id': tx.get('input', '')[:10] if tx.get('input') else None
            }
            
            # Calculate volume statistics
            value_wei = int(tx.get('value', '0'))
            if tx.get('from', '').lower() == address.lower():
                total_sent += value_wei
            if tx.get('to', '').lower() == address.lower():
                total_received += value_wei
            
            processed_transactions.append(processed_tx)
        
        # Calculate date range
        first_tx_date = None
        last_tx_date = None
        
        if processed_transactions:
            first_tx_date = processed_transactions[-1]['timestamp'] if processed_transactions else None
            last_tx_date = processed_transactions[0]['timestamp'] if processed_transactions else None
        
        return {
            'transactions': processed_transactions,
            'total_count': len(processed_transactions),
            'first_tx_date': first_tx_date,
            'last_tx_date': last_tx_date,
            'volume_stats': {
                'total_sent_wei': total_sent,
                'total_received_wei': total_received,
                'total_sent_ether': format_wei_to_ether(total_sent),
                'total_received_ether': format_wei_to_ether(total_received),
                'net_balance_change_wei': total_received - total_sent,
                'net_balance_change_ether': format_wei_to_ether(total_received - total_sent)
            },
            'timestamp': datetime.now().isoformat()
        }
    
    def get_token_balances(self, address: str) -> Dict:
        """Get ERC-20 token balances for an address"""
        
        # Get ERC-20 token transfers to identify tokens
        params = {
            'module': 'account',
            'action': 'tokentx',
            'address': address,
            'page': 1,
            'offset': 100,  # Limited for performance
            'sort': 'desc'
        }
        
        try:
            response = self._make_request(params)
            token_transfers = response.get('result', [])
            
            # Extract unique tokens
            unique_tokens = {}
            
            for transfer in token_transfers:
                contract_address = transfer.get('contractAddress', '')
                token_name = transfer.get('tokenName', 'Unknown')
                token_symbol = transfer.get('tokenSymbol', 'UNKNOWN')
                token_decimal = int(transfer.get('tokenDecimal', '18'))
                
                if contract_address and contract_address not in unique_tokens:
                    unique_tokens[contract_address] = {
                        'contract_address': contract_address,
                        'name': token_name,
                        'symbol': token_symbol,
                        'decimals': token_decimal,
                        'latest_transfer': transfer.get('timeStamp')
                    }
            
            # Convert to list
            tokens = list(unique_tokens.values())
            
            return {
                'tokens': tokens,
                'token_count': len(tokens),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            # Return empty result if token data fails (non-critical)
            return {
                'tokens': [],
                'token_count': 0,
                'timestamp': datetime.now().isoformat(),
                'error': f"Failed to fetch token data: {str(e)}"
            }
    
    def get_internal_transactions(self, address: str, limit: int = 1000) -> Dict:
        """Get internal transactions for an address"""
        
        params = {
            'module': 'account',
            'action': 'txlistinternal',
            'address': address,
            'page': 1,
            'offset': limit,
            'sort': 'desc'
        }
        
        try:
            response = self._make_request(params)
            internal_txs = response.get('result', [])
            
            processed_internals = []
            for tx in internal_txs:
                processed_tx = {
                    'hash': tx.get('hash'),
                    'from': tx.get('from'),
                    'to': tx.get('to'),
                    'value_wei': int(tx.get('value', '0')),
                    'value_ether': format_wei_to_ether(int(tx.get('value', '0'))),
                    'timestamp': datetime.fromtimestamp(int(tx.get('timeStamp', '0'))).isoformat(),
                    'type': tx.get('type', 'call'),
                    'is_error': tx.get('isError') == '1'
                }
                processed_internals.append(processed_tx)
            
            return {
                'internal_transactions': processed_internals,
                'count': len(processed_internals),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'internal_transactions': [],
                'count': 0,
                'timestamp': datetime.now().isoformat(),
                'error': f"Failed to fetch internal transactions: {str(e)}"
            } 
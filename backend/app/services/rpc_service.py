"""
Sentinel RPC Service - Direct Blockchain Node Access
Alternative to API-based services using RPC endpoints
"""

import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from app.utils.helpers import format_wei_to_ether
import os

class RPCService:
    """Service for direct blockchain interaction via RPC endpoints"""
    
    def __init__(self, rpc_url: Optional[str] = None):
        # Default RPC URLs (free public endpoints)
        self.rpc_urls = {
            'ethereum': rpc_url or os.getenv('ETHEREUM_RPC_URL', 'https://eth.llamarpc.com'),
            'polygon': os.getenv('POLYGON_RPC_URL', 'https://polygon-rpc.com'),
            'bsc': os.getenv('BSC_RPC_URL', 'https://bsc-dataseed.binance.org'),
            'arbitrum': os.getenv('ARBITRUM_RPC_URL', 'https://arb1.arbitrum.io/rpc'),
            'optimism': os.getenv('OPTIMISM_RPC_URL', 'https://mainnet.optimism.io'),
            'avalanche': os.getenv('AVALANCHE_RPC_URL', 'https://api.avax.network/ext/bc/C/rpc')
        }
        
        self.current_rpc = self.rpc_urls['ethereum']  # Default to Ethereum
        
    def _make_rpc_call(self, method: str, params: List[Any], rpc_url: str = None) -> Dict:
        """Make RPC call to blockchain node"""
        
        url = rpc_url or self.current_rpc
        
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1
        }
        
        headers = {
            'Content-Type': 'application/json',
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'error' in data:
                raise Exception(f"RPC Error: {data['error']}")
                
            return data.get('result')
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"RPC Network error: {str(e)}")
        except Exception as e:
            raise Exception(f"RPC call failed: {str(e)}")
    
    def set_chain(self, chain: str):
        """Switch to different blockchain"""
        if chain.lower() in self.rpc_urls:
            self.current_rpc = self.rpc_urls[chain.lower()]
        else:
            raise Exception(f"Unsupported chain: {chain}")
    
    def get_balance(self, address: str, chain: str = 'ethereum') -> Dict:
        """Get native token balance via RPC"""
        
        try:
            # Set chain RPC URL
            rpc_url = self.rpc_urls.get(chain.lower(), self.rpc_urls['ethereum'])
            
            # Get balance in wei
            balance_hex = self._make_rpc_call('eth_getBalance', [address, 'latest'], rpc_url)
            balance_wei = int(balance_hex, 16)
            
            return {
                'balance': balance_wei,
                'balance_ether': format_wei_to_ether(balance_wei),
                'address': address,
                'chain': chain,
                'rpc_url': rpc_url,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'balance': 0,
                'balance_ether': 0.0,
                'address': address,
                'chain': chain,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_transaction_count(self, address: str, chain: str = 'ethereum') -> Dict:
        """Get transaction count (nonce) via RPC"""
        
        try:
            self.set_chain(chain)
            
            # Get transaction count
            count_hex = self._make_rpc_call('eth_getTransactionCount', [address, 'latest'])
            tx_count = int(count_hex, 16)
            
            return {
                'transaction_count': tx_count,
                'address': address,
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'transaction_count': 0,
                'address': address,
                'chain': chain,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def get_transaction_by_hash(self, tx_hash: str, chain: str = 'ethereum') -> Dict:
        """Get transaction details by hash"""
        
        try:
            self.set_chain(chain)
            
            # Get transaction
            tx = self._make_rpc_call('eth_getTransactionByHash', [tx_hash])
            
            if not tx:
                return {
                    'transaction': None,
                    'error': 'Transaction not found',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Get transaction receipt for gas used
            receipt = self._make_rpc_call('eth_getTransactionReceipt', [tx_hash])
            
            # Process transaction data
            processed_tx = {
                'hash': tx.get('hash'),
                'from': tx.get('from'),
                'to': tx.get('to'),
                'value_wei': int(tx.get('value', '0x0'), 16),
                'value_ether': format_wei_to_ether(int(tx.get('value', '0x0'), 16)),
                'gas_limit': int(tx.get('gas', '0x0'), 16),
                'gas_price': int(tx.get('gasPrice', '0x0'), 16),
                'gas_used': int(receipt.get('gasUsed', '0x0'), 16) if receipt else 0,
                'block_number': int(tx.get('blockNumber', '0x0'), 16),
                'transaction_index': int(tx.get('transactionIndex', '0x0'), 16),
                'nonce': int(tx.get('nonce', '0x0'), 16),
                'input': tx.get('input', '0x'),
                'status': int(receipt.get('status', '0x1'), 16) if receipt else 1
            }
            
            # Calculate transaction fee
            if receipt:
                tx_fee_wei = processed_tx['gas_used'] * processed_tx['gas_price']
                processed_tx['transaction_fee_wei'] = tx_fee_wei
                processed_tx['transaction_fee_ether'] = format_wei_to_ether(tx_fee_wei)
            
            return {
                'transaction': processed_tx,
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'transaction': None,
                'error': str(e),
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
    
    def get_block_by_number(self, block_number: str = 'latest', chain: str = 'ethereum') -> Dict:
        """Get block information"""
        
        try:
            self.set_chain(chain)
            
            # Convert block number if it's an integer
            if isinstance(block_number, int):
                block_number = hex(block_number)
            
            # Get block
            block = self._make_rpc_call('eth_getBlockByNumber', [block_number, False])
            
            if not block:
                return {
                    'block': None,
                    'error': 'Block not found',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Process block data
            processed_block = {
                'number': int(block.get('number', '0x0'), 16),
                'hash': block.get('hash'),
                'parent_hash': block.get('parentHash'),
                'timestamp': int(block.get('timestamp', '0x0'), 16),
                'gas_limit': int(block.get('gasLimit', '0x0'), 16),
                'gas_used': int(block.get('gasUsed', '0x0'), 16),
                'transaction_count': len(block.get('transactions', [])),
                'miner': block.get('miner'),
                'difficulty': int(block.get('difficulty', '0x0'), 16),
                'size': int(block.get('size', '0x0'), 16)
            }
            
            return {
                'block': processed_block,
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'block': None,
                'error': str(e),
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
    
    def get_code(self, address: str, chain: str = 'ethereum') -> Dict:
        """Check if address is a contract by getting code"""
        
        try:
            self.set_chain(chain)
            
            # Get code
            code = self._make_rpc_call('eth_getCode', [address, 'latest'])
            
            is_contract = code != '0x' and len(code) > 2
            
            return {
                'address': address,
                'is_contract': is_contract,
                'code_size': len(code) - 2,  # Remove 0x prefix
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'address': address,
                'is_contract': False,
                'error': str(e),
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
    
    def get_chain_info(self, chain: str = 'ethereum') -> Dict:
        """Get blockchain network information"""
        
        try:
            self.set_chain(chain)
            
            # Get chain ID
            chain_id_hex = self._make_rpc_call('eth_chainId', [])
            chain_id = int(chain_id_hex, 16)
            
            # Get latest block
            latest_block = self._make_rpc_call('eth_getBlockByNumber', ['latest', False])
            
            # Get gas price
            gas_price_hex = self._make_rpc_call('eth_gasPrice', [])
            gas_price = int(gas_price_hex, 16)
            
            return {
                'chain': chain,
                'chain_id': chain_id,
                'rpc_url': self.current_rpc,
                'latest_block': int(latest_block.get('number', '0x0'), 16),
                'gas_price_wei': gas_price,
                'gas_price_gwei': gas_price / 1e9,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'chain': chain,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def batch_get_balances(self, addresses: List[str], chain: str = 'ethereum') -> Dict:
        """Get balances for multiple addresses in batch"""
        
        results = []
        
        for address in addresses:
            balance_result = self.get_balance(address, chain)
            results.append(balance_result)
        
        return {
            'balances': results,
            'total_addresses': len(addresses),
            'chain': chain,
            'timestamp': datetime.now().isoformat()
        }
    
    def estimate_gas(self, from_address: str, to_address: str, value: str = '0x0', data: str = '0x', chain: str = 'ethereum') -> Dict:
        """Estimate gas for a transaction"""
        
        try:
            self.set_chain(chain)
            
            # Prepare transaction object
            tx_obj = {
                'from': from_address,
                'to': to_address,
                'value': value,
                'data': data
            }
            
            # Estimate gas
            gas_hex = self._make_rpc_call('eth_estimateGas', [tx_obj])
            gas_estimate = int(gas_hex, 16)
            
            # Get current gas price
            gas_price_hex = self._make_rpc_call('eth_gasPrice', [])
            gas_price = int(gas_price_hex, 16)
            
            # Calculate estimated fee
            estimated_fee_wei = gas_estimate * gas_price
            
            return {
                'gas_estimate': gas_estimate,
                'gas_price_wei': gas_price,
                'gas_price_gwei': gas_price / 1e9,
                'estimated_fee_wei': estimated_fee_wei,
                'estimated_fee_ether': format_wei_to_ether(estimated_fee_wei),
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'chain': chain,
                'timestamp': datetime.now().isoformat()
            }
    
    def get_available_chains(self) -> Dict:
        """Get list of available RPC endpoints"""
        
        chains = []
        for chain_name, rpc_url in self.rpc_urls.items():
            chains.append({
                'name': chain_name,
                'rpc_url': rpc_url,
                'available': True
            })
        
        return {
            'chains': chains,
            'total_chains': len(chains),
            'timestamp': datetime.now().isoformat()
        } 
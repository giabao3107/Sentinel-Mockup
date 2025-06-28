"""
Sentinel Hybrid Service - Combines API and RPC for comprehensive data
Uses best of both worlds: API for detailed data + RPC for real-time/multi-chain
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from .etherscan_service import EtherscanService
from .rpc_service import RPCService
from ..utils.helpers import is_valid_ethereum_address

logger = logging.getLogger(__name__)

class HybridService:
    """
    Hybrid service that intelligently combines API and RPC data sources
    - API: For detailed transaction history, token data, comprehensive analysis
    - RPC: For real-time balance, multi-chain support, no API key limitations
    """
    
    def __init__(self, etherscan_api_key: Optional[str] = None):
        self.etherscan_service = EtherscanService(etherscan_api_key)
        self.rpc_service = RPCService()
        self.logger = logging.getLogger(__name__)
        
    def analyze_wallet_comprehensive(self, address: str, chain: str = 'ethereum', prefer_source: str = 'hybrid') -> Dict:
        """
        Comprehensive wallet analysis using both API and RPC
        
        Args:
            address: Wallet address to analyze
            chain: Blockchain network
            prefer_source: 'api', 'rpc', or 'hybrid' (default)
        """
        
        if not is_valid_ethereum_address(address):
            return {
                'error': 'Invalid Ethereum address format',
                'address': address
            }
        
        analysis_result = {
            'address': address,
            'chain': chain,
            'analysis_timestamp': datetime.now().isoformat(),
            'data_sources_used': [],
            'analysis_mode': prefer_source
        }
        
        # Get RPC data (always available, real-time)
        rpc_data = self._get_rpc_data(address, chain)
        analysis_result['rpc_data'] = rpc_data
        analysis_result['data_sources_used'].append('RPC')
        
        # Get API data (detailed but may fail)
        api_data = None
        if chain.lower() == 'ethereum':  # Etherscan only supports Ethereum
            api_data = self._get_api_data(address)
            if api_data and not api_data.get('error'):
                analysis_result['api_data'] = api_data
                analysis_result['data_sources_used'].append('Etherscan API')
        
        # Combine data intelligently
        combined_analysis = self._combine_data_sources(rpc_data, api_data, prefer_source)
        analysis_result.update(combined_analysis)
        
        return analysis_result
    
    def _get_rpc_data(self, address: str, chain: str) -> Dict:
        """Get data from RPC endpoints"""
        try:
            balance_data = self.rpc_service.get_balance(address, chain)
            return {
                'success': True,
                'balance': balance_data,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"RPC data fetch failed for {address}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_api_data(self, address: str) -> Optional[Dict]:
        """Get data from Etherscan API"""
        try:
            balance_data = self.etherscan_service.get_balance(address)
            transaction_data = self.etherscan_service.get_transactions(address, limit=50)
            
            return {
                'success': True,
                'balance': balance_data,
                'transactions': transaction_data,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.warning(f"API data fetch failed for {address}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
    
    def _combine_data_sources(self, rpc_data: Dict, api_data: Optional[Dict], prefer_source: str) -> Dict:
        """Intelligently combine RPC and API data"""
        
        combined = {
            'wallet_info': {},
            'data_quality': {},
            'recommendations': []
        }
        
        # Balance: Use API if available, fallback to RPC
        if api_data and api_data.get('success') and prefer_source != 'rpc':
            balance_source = api_data['balance']
            combined['wallet_info']['balance'] = {
                'wei': balance_source.get('balance', 0),
                'ether': balance_source.get('balance_ether', 0),
                'source': 'API (Etherscan)',
                'confidence': 'high'
            }
        elif rpc_data.get('success'):
            balance_source = rpc_data['balance']
            combined['wallet_info']['balance'] = {
                'wei': balance_source.get('balance', 0),
                'ether': balance_source.get('balance_ether', 0),
                'source': 'RPC',
                'confidence': 'high'
            }
        
        # Transaction history (only from API)
        if api_data and api_data.get('success'):
            transactions = api_data.get('transactions', {})
            combined['wallet_info']['transaction_history'] = {
                'recent_transactions': transactions.get('transactions', [])[:5],
                'total_count': len(transactions.get('transactions', [])),
                'source': 'API (Etherscan)'
            }
        
        return combined
    
    def get_data_source_status(self) -> Dict:
        """Check status of all data sources"""
        
        status = {
            'timestamp': datetime.now().isoformat(),
            'sources': {}
        }
        
        # Test RPC
        try:
            chains = self.rpc_service.get_available_chains()
            status['sources']['rpc'] = {
                'status': 'available',
                'chains': len(chains.get('chains', [])),
                'details': chains
            }
        except Exception as e:
            status['sources']['rpc'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Test API
        try:
            # Test with a known address
            test_result = self.etherscan_service.get_balance('0x742d35Cc6634C0532925a3b8D09f5f56F8c4C0e5')
            status['sources']['etherscan_api'] = {
                'status': 'available',
                'api_key_configured': bool(self.etherscan_service.api_key != 'YourApiKeyToken')
            }
        except Exception as e:
            status['sources']['etherscan_api'] = {
                'status': 'error',
                'error': str(e),
                'api_key_configured': bool(self.etherscan_service.api_key != 'YourApiKeyToken')
            }
        
        return status 
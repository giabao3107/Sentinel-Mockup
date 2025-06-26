"""
Sentinel Multi-chain Service - Support for Multiple Blockchain Networks
Extends Sentinel's capabilities beyond Ethereum to support Solana, Arbitrum, and other chains
"""

import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass
import requests
import base64
import base58

logger = logging.getLogger(__name__)

class ChainType(Enum):
    ETHEREUM = "ethereum"
    BITCOIN = "bitcoin"
    SOLANA = "solana"
    ARBITRUM = "arbitrum"
    POLYGON = "polygon"
    AVALANCHE = "avalanche"
    BSC = "bsc"
    OPTIMISM = "optimism"

@dataclass
class ChainConfig:
    """Configuration for blockchain networks"""
    name: str
    chain_type: ChainType
    rpc_url: str
    explorer_api_url: str
    api_key_required: bool = False
    api_key: Optional[str] = None
    native_token: str = "ETH"
    decimals: int = 18

@dataclass
class MultiChainTransaction:
    """Standardized transaction data across chains"""
    hash: str
    from_address: str
    to_address: str
    value: str  # In native token units
    value_usd: Optional[float]
    fee: str
    timestamp: datetime
    block_number: int
    chain: ChainType
    token_transfers: List[Dict[str, Any]] = None
    method: Optional[str] = None

@dataclass
class MultiChainAddress:
    """Standardized address data across chains"""
    address: str
    chain: ChainType
    balance: str  # In native token units
    balance_usd: Optional[float]
    transaction_count: int
    first_seen: Optional[datetime]
    last_activity: Optional[datetime]
    tokens: List[Dict[str, Any]] = None

class MultiChainService:
    """
    Service for analyzing addresses and transactions across multiple blockchains
    Provides unified interface for cross-chain threat intelligence
    """
    
    def __init__(self):
        self.chains = self._initialize_chain_configs()
        self.clients = {}
        self._initialize_clients()
    
    def _initialize_chain_configs(self) -> Dict[ChainType, ChainConfig]:
        """Initialize configuration for supported chains"""
        
        return {
            ChainType.ETHEREUM: ChainConfig(
                name="Ethereum",
                chain_type=ChainType.ETHEREUM,
                rpc_url="https://eth-mainnet.alchemyapi.io/v2/your-api-key",
                explorer_api_url="https://api.etherscan.io/api",
                api_key_required=True,
                native_token="ETH",
                decimals=18
            ),
            ChainType.ARBITRUM: ChainConfig(
                name="Arbitrum One",
                chain_type=ChainType.ARBITRUM,
                rpc_url="https://arb1.arbitrum.io/rpc",
                explorer_api_url="https://api.arbiscan.io/api",
                api_key_required=True,
                native_token="ETH",
                decimals=18
            ),
            ChainType.POLYGON: ChainConfig(
                name="Polygon",
                chain_type=ChainType.POLYGON,
                rpc_url="https://polygon-rpc.com",
                explorer_api_url="https://api.polygonscan.com/api",
                api_key_required=True,
                native_token="MATIC",
                decimals=18
            ),
            ChainType.BSC: ChainConfig(
                name="Binance Smart Chain",
                chain_type=ChainType.BSC,
                rpc_url="https://bsc-dataseed.binance.org",
                explorer_api_url="https://api.bscscan.com/api",
                api_key_required=True,
                native_token="BNB",
                decimals=18
            ),
            ChainType.AVALANCHE: ChainConfig(
                name="Avalanche C-Chain",
                chain_type=ChainType.AVALANCHE,
                rpc_url="https://api.avax.network/ext/bc/C/rpc",
                explorer_api_url="https://api.snowtrace.io/api",
                api_key_required=True,
                native_token="AVAX",
                decimals=18
            ),
            ChainType.SOLANA: ChainConfig(
                name="Solana",
                chain_type=ChainType.SOLANA,
                rpc_url="https://api.mainnet-beta.solana.com",
                explorer_api_url="https://public-api.solscan.io",
                api_key_required=False,
                native_token="SOL",
                decimals=9
            )
        }
    
    def _initialize_clients(self):
        """Initialize blockchain clients"""
        
        # Initialize basic HTTP clients for now
        # In production, would use proper blockchain clients
        pass
    
    def get_supported_chains(self) -> List[Dict[str, Any]]:
        """Get list of supported blockchain networks"""
        
        supported = []
        for chain_type, config in self.chains.items():
            supported.append({
                'chain_type': chain_type.value,
                'name': config.name,
                'native_token': config.native_token,
                'available': True
            })
        
        return supported
    
    def detect_address_chain(self, address: str) -> List[ChainType]:
        """Detect which blockchain networks an address could belong to"""
        
        possible_chains = []
        
        # Ethereum-like addresses (EVM chains)
        if self._is_ethereum_address(address):
            possible_chains.extend([
                ChainType.ETHEREUM,
                ChainType.ARBITRUM,
                ChainType.POLYGON,
                ChainType.BSC,
                ChainType.AVALANCHE
            ])
        
        # Solana addresses
        if self._is_solana_address(address):
            possible_chains.append(ChainType.SOLANA)
        
        # Bitcoin addresses
        if self._is_bitcoin_address(address):
            possible_chains.append(ChainType.BITCOIN)
        
        return possible_chains
    
    def _is_ethereum_address(self, address: str) -> bool:
        """Check if address is valid Ethereum format"""
        return (len(address) == 42 and 
                address.startswith('0x') and 
                all(c in '0123456789abcdefABCDEF' for c in address[2:]))
    
    def _is_solana_address(self, address: str) -> bool:
        """Check if address is valid Solana format"""
        try:
            if len(address) < 32 or len(address) > 44:
                return False
            # Try to decode as base58
            decoded = base58.b58decode(address)
            return len(decoded) == 32
        except:
            return False
    
    def _is_bitcoin_address(self, address: str) -> bool:
        """Check if address is valid Bitcoin format"""
        # Simplified Bitcoin address validation
        return (address.startswith('1') or 
                address.startswith('3') or 
                address.startswith('bc1'))
    
    def analyze_address_multichain(self, address: str, 
                                 chains: Optional[List[ChainType]] = None) -> Dict[ChainType, MultiChainAddress]:
        """
        Analyze an address across multiple blockchain networks
        
        Args:
            address: The address to analyze
            chains: Specific chains to check (if None, auto-detect)
            
        Returns:
            Dictionary mapping chains to address data
        """
        
        if chains is None:
            chains = self.detect_address_chain(address)
        
        results = {}
        
        # For demo, return basic analysis for detected chains
        for chain in chains:
            if chain in self.chains:
                try:
                    # Basic mock analysis - in production would call actual APIs
                    address_data = MultiChainAddress(
                        address=address,
                        chain=chain,
                        balance="0.0",
                        balance_usd=0.0,
                        transaction_count=0,
                        first_seen=None,
                        last_activity=None,
                        tokens=[]
                    )
                    results[chain] = address_data
                except Exception as e:
                    logger.error(f"Error analyzing {address} on {chain.value}: {str(e)}")
                    continue
        
        return results
    
    def calculate_cross_chain_risk(self, multichain_data: Dict[ChainType, MultiChainAddress]) -> Dict[str, Any]:
        """
        Calculate risk score considering cross-chain activity patterns
        
        Args:
            multichain_data: Address data from multiple chains
            
        Returns:
            Cross-chain risk assessment
        """
        
        risk_factors = []
        risk_score = 0
        
        # Base analysis
        total_chains = len(multichain_data)
        total_balance_usd = 0
        total_transactions = 0
        
        for chain, address_data in multichain_data.items():
            total_transactions += address_data.transaction_count
            if address_data.balance_usd:
                total_balance_usd += address_data.balance_usd
        
        # Multi-chain presence risk factors
        if total_chains >= 5:
            risk_factors.append("Active on 5+ blockchain networks")
            risk_score += 20
        elif total_chains >= 3:
            risk_factors.append("Active on 3+ blockchain networks")
            risk_score += 10
        
        # High activity across chains
        if total_transactions > 10000:
            risk_factors.append("Very high cross-chain transaction volume")
            risk_score += 25
        elif total_transactions > 1000:
            risk_factors.append("High cross-chain transaction volume")
            risk_score += 15
        
        # Chain diversity patterns
        has_privacy_chains = any(chain in [ChainType.SOLANA] for chain in multichain_data.keys())
        has_layer2 = any(chain in [ChainType.ARBITRUM, ChainType.POLYGON] for chain in multichain_data.keys())
        
        if has_privacy_chains:
            risk_factors.append("Activity on privacy-focused chains")
            risk_score += 10
        
        if has_layer2:
            risk_factors.append("Layer 2 / Sidechain activity")
            risk_score += 5
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "CRITICAL"
        elif risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 30:
            risk_level = "MEDIUM"
        elif risk_score >= 15:
            risk_level = "LOW"
        else:
            risk_level = "MINIMAL"
        
        return {
            'cross_chain_risk_score': min(100, risk_score),
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'chain_summary': {
                'total_chains': total_chains,
                'total_transactions': total_transactions,
                'total_balance_usd': total_balance_usd,
                'chains_active': [chain.value for chain in multichain_data.keys()]
            },
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def get_chain_config(self, chain: ChainType) -> Optional[ChainConfig]:
        """Get configuration for a specific chain"""
        return self.chains.get(chain)
    
    def update_api_key(self, chain: ChainType, api_key: str) -> bool:
        """Update API key for a specific chain"""
        
        if chain in self.chains:
            self.chains[chain].api_key = api_key
            logger.info(f"Updated API key for {chain.value}")
            return True
        
        return False

# Global instance
multichain_service = MultiChainService()
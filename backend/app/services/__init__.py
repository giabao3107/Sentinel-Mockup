"""
Sentinel Services - Business Logic Layer
Phase 3: Enhanced services with GNN, Multi-chain, Network Analysis, and Alert System
"""

# Phase 2 Services
from .etherscan_service import EtherscanService
from .risk_scorer import RiskScorer
from .graph_protocol_service import GraphProtocolService
from .social_intelligence_service import SocialIntelligenceService

# Phase 3 Services - Advanced Threat Intelligence
from .gnn_model import gnn_engine, GNNIntelligenceEngine
from .network_behavior_analyzer import NetworkBehaviorAnalyzer
from .alert_system import AlertSystem
from .multichain_service import multichain_service, MultiChainService

__all__ = [
    # Phase 2
    'EtherscanService', 
    'RiskScorer',
    'GraphProtocolService',
    'SocialIntelligenceService',
    
    # Phase 3
    'gnn_engine',
    'GNNIntelligenceEngine',
    'NetworkBehaviorAnalyzer',
    'AlertSystem',
    'multichain_service',
    'MultiChainService'
] 
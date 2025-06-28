"""
Sentinel API - Wallet Analysis Endpoints
"""

import re
import logging
from datetime import datetime
from typing import Dict, List, Optional
from flask import jsonify, current_app, request
from app.api import wallet_bp
from app.services.etherscan_service import EtherscanService
from app.services.rpc_service import RPCService
from app.services.hybrid_service import HybridService
from app.services.risk_scorer import RiskScorer
from app.utils.helpers import is_valid_ethereum_address, format_wei_to_ether
from ..database.postgres_graph import PostgreSQLGraphClient
from ..services.graph_protocol_service import GraphProtocolService
from ..services.social_intelligence_service import SocialIntelligenceService

# Initialize logger
logger = logging.getLogger(__name__)

# Add service instances for Phase 2
graph_client: PostgreSQLGraphClient = None
graph_service: GraphProtocolService = None
social_service: SocialIntelligenceService = None

def init_services(graph_db: PostgreSQLGraphClient, graph: GraphProtocolService, social: SocialIntelligenceService):
    """Initialize Phase 2 services"""
    global graph_client, graph_service, social_service
    graph_client = graph_db
    graph_service = graph
    social_service = social

@wallet_bp.route('/wallet/<address>', methods=['GET'])
def analyze_wallet(address):
    """
    Analyze a wallet address and return comprehensive forensics data
    
    Args:
        address (str): Ethereum wallet address to analyze
        
    Returns:
        JSON response with wallet analysis data
    """
    
    # Validate Ethereum address format
    if not is_valid_ethereum_address(address):
        return jsonify({
            'error': 'Invalid Ethereum address format',
            'address': address
        }), 400
    
    try:
        # Initialize services
        etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
        risk_scorer = RiskScorer()
        
        # Fetch wallet data from Etherscan
        balance_data = etherscan_service.get_balance(address)
        transaction_data = etherscan_service.get_transactions(address)
        token_data = etherscan_service.get_token_balances(address)
        
        # Calculate risk score using heuristics
        risk_analysis = risk_scorer.calculate_risk_score(
            address=address,
            transactions=transaction_data['transactions'],
            balance=balance_data['balance']
        )
        
        # Prepare response
        response_data = {
            'address': address,
            'analysis_timestamp': transaction_data.get('timestamp'),
            'wallet_info': {
                'balance': {
                    'wei': balance_data['balance'],
                    'ether': format_wei_to_ether(balance_data['balance']),
                    'usd_value': balance_data.get('usd_value', 0)
                },
                'transaction_count': len(transaction_data['transactions']),
                'token_count': len(token_data.get('tokens', [])),
                'first_transaction': transaction_data.get('first_tx_date'),
                'last_transaction': transaction_data.get('last_tx_date')
            },
            'risk_assessment': {
                'risk_score': risk_analysis['risk_score'],
                'risk_level': risk_analysis['risk_level'],
                'risk_factors': risk_analysis['risk_factors'],
                'behavioral_tags': risk_analysis['behavioral_tags']
            },
            'transactions': {
                'recent': transaction_data['transactions'][:10],  # Last 10 transactions
                'total_count': len(transaction_data['transactions']),
                'volume_stats': transaction_data.get('volume_stats', {})
            },
            'tokens': token_data.get('tokens', [])[:20],  # Top 20 tokens
            'metadata': {
                'data_sources': ['Etherscan'],
                'analysis_engine': 'Heuristic v1.0',
                'chain': 'Ethereum Mainnet'
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error analyzing wallet {address}: {str(e)}")
        return jsonify({
            'error': 'Internal server error during wallet analysis',
            'address': address,
            'message': str(e)
        }), 500

@wallet_bp.route('/wallet/<address>/rpc', methods=['GET'])
def analyze_wallet_rpc(address):
    """
    Analyze wallet using RPC endpoints instead of API keys
    
    Args:
        address (str): Ethereum wallet address to analyze
        
    Returns:
        JSON response with wallet analysis using RPC data
    """
    
    # Validate Ethereum address format
    if not is_valid_ethereum_address(address):
        return jsonify({
            'error': 'Invalid Ethereum address format',
            'address': address
        }), 400
    
    try:
        # Initialize RPC service
        rpc_service = RPCService()
        
        # Get chain from query parameter (default: ethereum)
        chain = request.args.get('chain', 'ethereum')
        
        # Fetch wallet data via RPC
        balance_data = rpc_service.get_balance(address, chain)
        tx_count_data = rpc_service.get_transaction_count(address, chain)
        contract_check = rpc_service.get_code(address, chain)
        chain_info = rpc_service.get_chain_info(chain)
        
        # Basic risk assessment based on available RPC data
        risk_score = 10  # Base score
        risk_factors = []
        
        # Risk factors based on RPC data
        if contract_check.get('is_contract', False):
            risk_score += 20
            risk_factors.append("Smart contract address")
        
        if tx_count_data.get('transaction_count', 0) > 1000:
            risk_score += 15
            risk_factors.append("High transaction count")
        
        if balance_data.get('balance_ether', 0) > 100:
            risk_score += 10
            risk_factors.append("High balance")
        
        # Determine risk level
        if risk_score >= 60:
            risk_level = "high"
        elif risk_score >= 30:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Prepare response
        response_data = {
            'address': address,
            'chain': chain,
            'analysis_timestamp': datetime.now().isoformat(),
            'data_source': 'RPC',
            'rpc_url': balance_data.get('rpc_url'),
            
            'wallet_info': {
                'balance': {
                    'wei': balance_data.get('balance', 0),
                    'ether': balance_data.get('balance_ether', 0),
                    'native_token': chain_info.get('chain', 'ETH').upper()
                },
                'transaction_count': tx_count_data.get('transaction_count', 0),
                'is_contract': contract_check.get('is_contract', False),
                'code_size': contract_check.get('code_size', 0)
            },
            
            'risk_assessment': {
                'risk_score': min(risk_score, 100),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'confidence': 'medium'  # RPC data has medium confidence
            },
            
            'chain_info': {
                'name': chain,
                'chain_id': chain_info.get('chain_id'),
                'latest_block': chain_info.get('latest_block'),
                'gas_price_gwei': chain_info.get('gas_price_gwei')
            },
            
            'metadata': {
                'analysis_engine': 'RPC v1.0',
                'data_sources': ['RPC Node'],
                'limitations': [
                    'No transaction history available via RPC',
                    'Limited risk assessment without historical data',
                    'Basic analysis only'
                ],
                'advantages': [
                    'No API key required',
                    'Direct blockchain access',
                    'Real-time data',
                    'Multi-chain support'
                ]
            }
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        current_app.logger.error(f"Error analyzing wallet {address} via RPC: {str(e)}")
        return jsonify({
            'error': 'Internal server error during RPC wallet analysis',
            'address': address,
            'chain': chain,
            'message': str(e)
        }), 500

@wallet_bp.route('/wallet/<address>/hybrid', methods=['GET'])
def analyze_wallet_hybrid(address):
    """
    Hybrid analysis combining both API and RPC data sources
    Best of both worlds: API detailed data + RPC real-time data
    
    Args:
        address (str): Ethereum wallet address to analyze
        
    Returns:
        JSON response with comprehensive hybrid analysis
    """
    
    # Validate Ethereum address format
    if not is_valid_ethereum_address(address):
        return jsonify({
            'error': 'Invalid Ethereum address format',
            'address': address
        }), 400
    
    try:
        # Initialize hybrid service
        api_key = current_app.config.get('ETHERSCAN_API_KEY')
        hybrid_service = HybridService(api_key)
        
        # Get parameters
        chain = request.args.get('chain', 'ethereum')
        prefer_source = request.args.get('source', 'hybrid')  # 'api', 'rpc', 'hybrid'
        
        # Perform hybrid analysis
        analysis_result = hybrid_service.analyze_wallet_comprehensive(
            address=address,
            chain=chain,
            prefer_source=prefer_source
        )
        
        # Add metadata
        analysis_result['metadata'] = {
            'analysis_engine': 'Hybrid v1.0',
            'prefer_source': prefer_source,
            'chain': chain,
            'features': {
                'real_time_balance': True,
                'transaction_history': 'api_dependent',
                'multi_chain_support': True,
                'fallback_mechanism': True
            },
            'usage_tips': {
                'for_real_time': 'Use ?source=rpc for fastest real-time data',
                'for_detailed': 'Use ?source=api for comprehensive transaction history',
                'for_best': 'Use ?source=hybrid (default) for intelligent combination'
            }
        }
        
        return jsonify(analysis_result), 200
        
    except Exception as e:
        current_app.logger.error(f"Error in hybrid analysis for {address}: {str(e)}")
        return jsonify({
            'error': 'Internal server error during hybrid analysis',
            'address': address,
            'chain': chain,
            'message': str(e)
        }), 500

@wallet_bp.route('/wallet/data-sources/status', methods=['GET'])
def get_data_sources_status():
    """
    Check status of all available data sources
    
    Returns:
        JSON response with data source availability
    """
    
    try:
        api_key = current_app.config.get('ETHERSCAN_API_KEY')
        hybrid_service = HybridService(api_key)
        
        status = hybrid_service.get_data_source_status()
        
        # Add usage recommendations
        status['recommendations'] = {
            'rpc_only': 'Use /wallet/{address}/rpc for API-key-free analysis',
            'api_only': 'Use /api/v1/wallet/{address} for detailed Ethereum analysis',
            'hybrid': 'Use /wallet/{address}/hybrid for best of both worlds',
            'multi_chain': 'Use RPC endpoints for non-Ethereum chains'
        }
        
        return jsonify(status), 200
        
    except Exception as e:
        current_app.logger.error(f"Error checking data sources status: {str(e)}")
        return jsonify({
            'error': 'Internal server error checking data sources',
            'message': str(e)
        }), 500

@wallet_bp.route('/wallet/rpc/chains', methods=['GET'])
def get_rpc_chains():
    """
    Get list of available RPC chains
    
    Returns:
        JSON response with available blockchain networks
    """
    
    try:
        rpc_service = RPCService()
        chains_data = rpc_service.get_available_chains()
        
        return jsonify({
            'available_chains': chains_data['chains'],
            'total_chains': chains_data['total_chains'],
            'usage': {
                'endpoint_format': '/wallet/{address}/rpc?chain={chain_name}',
                'supported_chains': [chain['name'] for chain in chains_data['chains']],
                'example': '/wallet/0x742d35Cc6634C0532925a3b8D09f5f56F8c4C0e5/rpc?chain=polygon'
            },
            'timestamp': chains_data['timestamp']
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching RPC chains: {str(e)}")
        return jsonify({
            'error': 'Internal server error fetching RPC chains',
            'message': str(e)
        }), 500

@wallet_bp.route('/wallet/<address>/risk-only', methods=['GET'])
def get_wallet_risk_only(address):
    """
    Get only the risk assessment for a wallet (faster endpoint)
    
    Args:
        address (str): Ethereum wallet address
        
    Returns:
        JSON response with risk assessment only
    """
    
    if not is_valid_ethereum_address(address):
        return jsonify({
            'error': 'Invalid Ethereum address format',
            'address': address
        }), 400
    
    try:
        # Initialize services
        etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
        risk_scorer = RiskScorer()
        
        # Get minimal data for risk scoring
        balance_data = etherscan_service.get_balance(address)
        transaction_data = etherscan_service.get_transactions(address, limit=100)  # Limited for speed
        
        # Calculate risk score
        risk_analysis = risk_scorer.calculate_risk_score(
            address=address,
            transactions=transaction_data['transactions'],
            balance=balance_data['balance']
        )
        
        return jsonify({
            'address': address,
            'risk_assessment': risk_analysis,
            'metadata': {
                'analysis_type': 'risk_only',
                'data_sources': ['Etherscan'],
                'analysis_engine': 'Heuristic v1.0'
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error calculating risk for wallet {address}: {str(e)}")
        return jsonify({
            'error': 'Internal server error during risk calculation',
            'address': address,
            'message': str(e)
        }), 500

@wallet_bp.route('/api/v1/wallet/<address>/simple', methods=['GET'])
def get_wallet_analysis_simple(address):
    """Simple wallet analysis for debugging"""
    try:
        # Validate address
        if not is_valid_ethereum_address(address):
            return jsonify({"error": "Invalid Ethereum address format"}), 400
        
        # Return mock data immediately without external API calls
        mock_result = {
            "address": address,
            "analysis_mode": "mock",
            "data_sources": ["mock"],
            "balance": 1234567890123456789,  # ~1.23 ETH
            "balance_ether": 1.234567890123456789,
            "transaction_count": 42,
            "transactions": [
                {
                    "hash": "0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
                    "from": "0x742d35cc6634c0532925a3b8d09f5f56f8c4c0e5",
                    "to": address,
                    "value_ether": 0.5,
                    "timestamp": "2024-01-15T10:30:00Z",
                    "block_number": 19000001
                }
            ],
            "tokens": [],
            "risk_assessment": {
                "risk_score": 25.5,
                "risk_level": "low",
                "confidence": "high"
            },
            "behavioral_analysis": {
                "tags": ["Normal Activity", "Low Risk"],
                "patterns": ["regular_usage"]
            },
            "metadata": {
                "analysis_timestamp": datetime.now().isoformat(),
                "analysis_version": "1.0-mock",
                "note": "This is mock data for debugging"
            }
        }
        
        return jsonify(mock_result), 200
        
    except Exception as e:
        return jsonify({
            "error": "Simple analysis failed", 
            "message": str(e),
            "address": address
        }), 500

@wallet_bp.route('/api/v1/wallet/<address>', methods=['GET'])
def get_wallet_analysis(address):
    """
    Enhanced wallet analysis with proper risk scoring
    """
    try:
        # Validate Ethereum address format
        if not is_valid_ethereum_address(address):
            return jsonify({"error": "Invalid Ethereum address format"}), 400
        
        # Initialize services
        etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
        risk_scorer = RiskScorer()
        
        # Get wallet information from Etherscan (will use mock data if API fails)
        try:
            wallet_info = etherscan_service.get_wallet_info(address)
            
            if not wallet_info:
                # Return minimal error response
                return jsonify({
                    "error": "Could not retrieve wallet information",
                    "address": address,
                    "suggestion": "Try again later or use /simple endpoint for basic analysis"
                }), 500
        except Exception as service_error:
            # If even the service fails, return a basic error
            return jsonify({
                "error": "Service initialization failed",
                "address": address,
                "message": str(service_error),
                "suggestion": "Check API configuration"
            }), 500
        
        # Calculate risk score using RiskScorer
        risk_analysis = risk_scorer.calculate_risk_score(
            address=address,
            transactions=wallet_info.get('transactions', []),
            balance=wallet_info.get('balance', 0)
        )
        
        # Create comprehensive response
        analysis_result = {
            "address": address,
            "analysis_mode": "enhanced",
            "data_sources": ["etherscan_or_mock"],
            
            # Wallet information
            "balance": wallet_info.get('balance', 0),
            "balance_ether": wallet_info.get('balance_ether', 0.0),
            "transaction_count": wallet_info.get('transaction_count', 0),
            "transactions": wallet_info.get('transactions', [])[:10],  # Last 10 transactions
            "tokens": wallet_info.get('tokens', []),
            "token_count": wallet_info.get('token_count', 0),
            "first_transaction": wallet_info.get('first_transaction'),
            "last_transaction": wallet_info.get('last_transaction'),
            "volume_stats": wallet_info.get('volume_stats', {}),
            
            # Risk assessment from RiskScorer
            "risk_assessment": {
                "risk_score": risk_analysis.get('risk_score', 0),
                "risk_level": risk_analysis.get('risk_level', 'MINIMAL'),
                "risk_factors": risk_analysis.get('risk_factors', []),
                "confidence": "high"
            },
            
            # Behavioral analysis
            "behavioral_analysis": {
                "tags": risk_analysis.get('behavioral_tags', []),
                "patterns": ["heuristic_analysis"],
                "analysis_details": risk_analysis.get('analysis_details', {})
            },
            
            # Recommendations based on risk level
            "recommendations": _generate_recommendations(risk_analysis),
            
            # Metadata
            "metadata": {
                "analysis_timestamp": datetime.now().isoformat(),
                "analysis_version": "2.0-enhanced",
                "analysis_engine": "Heuristic Risk Scorer",
                "data_quality": "high" if not wallet_info.get('error') else "mock"
            }
        }
        
        return jsonify(analysis_result), 200
        
    except Exception as e:
        logger.error(f"Error analyzing wallet {address}: {str(e)}")
        return jsonify({
            "error": "Internal server error during wallet analysis", 
            "message": str(e),
            "address": address
        }), 500

def _generate_recommendations(risk_analysis: Dict) -> List[str]:
    """Generate recommendations based on risk analysis"""
    recommendations = []
    risk_level = risk_analysis.get('risk_level', 'MINIMAL')
    risk_factors = risk_analysis.get('risk_factors', [])
    
    if risk_level == 'CRITICAL':
        recommendations.append("🚨 HIGH RISK: Exercise extreme caution with this address")
        recommendations.append("Avoid any transactions with this wallet")
        recommendations.append("Report to relevant authorities if involved in suspicious activity")
    elif risk_level == 'HIGH':
        recommendations.append("⚠️ HIGH RISK: Proceed with extreme caution")
        recommendations.append("Verify all transaction details carefully")
        recommendations.append("Consider additional verification before interacting")
    elif risk_level == 'MEDIUM':
        recommendations.append("⚠️ MEDIUM RISK: Additional verification recommended")
        recommendations.append("Monitor transaction patterns before proceeding")
    elif risk_level == 'LOW':
        recommendations.append("✅ LOW RISK: Generally safe but continue monitoring")
        recommendations.append("Standard security practices apply")
    else:
        recommendations.append("✅ MINIMAL RISK: Address appears safe to interact with")
        recommendations.append("Continue normal security practices")
    
    # Add specific recommendations based on risk factors
    if any('mixer' in factor.lower() for factor in risk_factors):
        recommendations.append("🔍 Address has interacted with mixers - enhanced due diligence required")
    
    if any('bot' in factor.lower() for factor in risk_factors):
        recommendations.append("🤖 Potential automated activity detected - verify legitimacy")
    
    if any('dust' in factor.lower() for factor in risk_factors):
        recommendations.append("💨 Dust activity detected - may be part of spam/airdrop campaigns")
    
    return recommendations

# === Enhanced Analysis Helper Functions ===

def _get_risk_level(risk_score: float) -> str:
    """Convert risk score to risk level"""
    if risk_score >= 80:
        return "very_high"
    elif risk_score >= 60:
        return "high"
    elif risk_score >= 40:
        return "medium"
    elif risk_score >= 20:
        return "low"
    else:
        return "very_low"

def _calculate_enhanced_risk_score(etherscan_data: Dict, graph_analytics: Dict, social_intel: Dict) -> float:
    """Calculate enhanced risk score using multiple data sources"""
    
    # Initialize risk scorer
    risk_scorer = RiskScorer()
    
    # Phase 1 base score - fix to extract score from returned dictionary
    base_risk_analysis = risk_scorer.calculate_risk_score(
        address=etherscan_data.get('address', ''),
        transactions=etherscan_data.get('transactions', []),
        balance=etherscan_data.get('balance', 0)
    )
    base_score = base_risk_analysis.get('risk_score', 0)
    
    # Graph-based risk factors
    graph_score = 0
    if graph_analytics:
        # High outgoing ratio
        outgoing = graph_analytics.get('outgoing_count', 0)
        incoming = graph_analytics.get('incoming_count', 0)
        if incoming > 0 and outgoing / incoming > 10:
            graph_score += 20
        
        # High-risk connections
        high_risk_connections = sum(1 for addr in graph_analytics.get('sent_to_addresses', []) 
                                  if addr in ['0x' + '0' * 40])  # Placeholder for known bad addresses
        graph_score += high_risk_connections * 5
        
        # Contract interaction patterns
        if graph_analytics.get('contract_interactions', 0) > 100:
            graph_score += 15
    
    # Social intelligence risk factors
    social_score = 0
    if social_intel:
        social_score += social_intel.get('scam_alerts', 0) * 25
        social_score += len(social_intel.get('risk_indicators', [])) * 10
        
        # Negative sentiment
        sentiment = social_intel.get('sentiment_summary', {})
        total_mentions = sum(sentiment.values())
        if total_mentions > 0:
            negative_ratio = sentiment.get('negative', 0) / total_mentions
            social_score += negative_ratio * 30
    
    # Weighted combination
    enhanced_score = (base_score * 0.5) + (graph_score * 0.3) + (social_score * 0.2)
    
    return min(round(enhanced_score, 2), 100.0)

def _generate_enhanced_tags(graph_analytics: Dict, social_intel: Dict) -> List[str]:
    """Generate enhanced behavioral tags"""
    
    tags = []
    
    if graph_analytics:
        # Network patterns
        total_volume = graph_analytics.get('total_sent', 0) + graph_analytics.get('total_received', 0)
        if total_volume > 1000:
            tags.append("High Volume Trader")
        
        connections = graph_analytics.get('outgoing_count', 0) + graph_analytics.get('incoming_count', 0)
        if connections > 500:
            tags.append("Highly Connected")
        
        # Contract interactions
        if graph_analytics.get('contract_interactions', 0) > 50:
            tags.append("DeFi Active")
        
        # Distribution patterns
        if graph_analytics.get('outgoing_count', 0) > graph_analytics.get('incoming_count', 0) * 5:
            tags.append("Distribution Wallet")
    
    if social_intel:
        # Social media flags
        if social_intel.get('scam_alerts', 0) > 0:
            tags.append("Social Media Flagged")
        
        if social_intel.get('total_mentions', 0) > 10:
            tags.append("Publicly Discussed")
    
    return tags

def _identify_risk_factors(graph_analytics: Dict, social_intel: Dict) -> List[str]:
    """Identify specific risk factors"""
    
    risk_factors = []
    
    if graph_analytics:
        # Graph-based risk factors
        if graph_analytics.get('outgoing_count', 0) > 1000:
            risk_factors.append("Extremely high transaction count")
        
        if graph_analytics.get('contract_interactions', 0) > 200:
            risk_factors.append("Excessive smart contract interactions")
    
    if social_intel:
        # Social risk factors
        risk_factors.extend(social_intel.get('risk_indicators', []))
        
        if social_intel.get('scam_alerts', 0) > 0:
            risk_factors.append(f"{social_intel['scam_alerts']} scam alerts in social media")
    
    return risk_factors

def _calculate_confidence(graph_analytics: Dict) -> str:
    """Calculate confidence level of the analysis"""
    
    if not graph_analytics:
        return "low"
    
    data_points = 0
    
    # Count available data points
    if graph_analytics.get('outgoing_count', 0) > 0:
        data_points += 1
    if graph_analytics.get('incoming_count', 0) > 0:
        data_points += 1
    if graph_analytics.get('contract_interactions', 0) > 0:
        data_points += 1
    if graph_analytics.get('total_sent', 0) > 0:
        data_points += 1
    if graph_analytics.get('total_received', 0) > 0:
        data_points += 1
    
    if data_points >= 4:
        return "high"
    elif data_points >= 2:
        return "medium"
    else:
        return "low"

def _analyze_transaction_patterns(graph_analytics: Dict) -> Dict:
    """Analyze transaction patterns from graph data"""
    
    if not graph_analytics:
        return {"pattern": "no_data"}
    
    outgoing = graph_analytics.get('outgoing_count', 0)
    incoming = graph_analytics.get('incoming_count', 0)
    total_sent = graph_analytics.get('total_sent', 0)
    total_received = graph_analytics.get('total_received', 0)
    
    patterns = {
        "direction_bias": "balanced",
        "volume_pattern": "normal",
        "activity_level": "low"
    }
    
    # Direction bias
    if outgoing > incoming * 3:
        patterns["direction_bias"] = "outgoing_heavy"
    elif incoming > outgoing * 3:
        patterns["direction_bias"] = "incoming_heavy"
    
    # Volume pattern
    total_volume = total_sent + total_received
    if total_volume > 10000:
        patterns["volume_pattern"] = "whale"
    elif total_volume > 1000:
        patterns["volume_pattern"] = "high_volume"
    
    # Activity level
    total_txs = outgoing + incoming
    if total_txs > 1000:
        patterns["activity_level"] = "very_high"
    elif total_txs > 100:
        patterns["activity_level"] = "high"
    elif total_txs > 10:
        patterns["activity_level"] = "medium"
    
    return patterns

def _summarize_network_analysis(graph_analytics: Dict) -> Dict:
    """Summarize network analysis"""
    
    if not graph_analytics:
        return {"summary": "no_network_data"}
    
    unique_counterparts = len(set(
        graph_analytics.get('sent_to_addresses', []) + 
        graph_analytics.get('received_from_addresses', [])
    ))
    
    return {
        "unique_counterparts": unique_counterparts,
        "contract_interactions": graph_analytics.get('contract_interactions', 0),
        "network_diversity": "high" if unique_counterparts > 100 else "medium" if unique_counterparts > 20 else "low",
        "primary_activity": "defi" if graph_analytics.get('contract_interactions', 0) > 50 else "transfer"
    }

def _analyze_temporal_patterns(graph_analytics: Dict) -> Dict:
    """Analyze temporal patterns (placeholder for future enhancement)"""
    
    return {
        "pattern": "analysis_pending",
        "note": "Temporal analysis requires transaction timestamp data"
    }

def _generate_enhanced_recommendations(graph_analytics: Dict, social_intel: Dict) -> List[str]:
    """Generate enhanced recommendations"""
    
    recommendations = []
    
    if graph_analytics:
        if graph_analytics.get('contract_interactions', 0) > 100:
            recommendations.append("Verify all smart contract interactions for legitimacy")
        
        if graph_analytics.get('outgoing_count', 0) > 500:
            recommendations.append("High transaction volume - monitor for unusual patterns")
    
    if social_intel and social_intel.get('scam_alerts', 0) > 0:
        recommendations.append("Address flagged in social media - exercise extreme caution")
    
    if not recommendations:
        recommendations.append("Continue monitoring for new patterns and social media mentions")
    
    return recommendations

def _suggest_next_actions(address: str, graph_analytics: Dict) -> List[str]:
    """Suggest next analytical actions"""
    
    actions = []
    
    if not graph_analytics:
        actions.append(f"Import historical data for {address}")
    else:
        actions.append(f"Explore transaction subgraph for {address}")
        actions.append(f"Analyze transaction paths from {address}")
        
        if graph_analytics.get('outgoing_count', 0) > 50:
            actions.append("Investigate receiving addresses for patterns")
    
    actions.append("Monitor for new social media mentions")
    actions.append("Set up alerts for new transactions")
    
    return actions

def _assess_data_freshness(graph_analytics: Dict) -> str:
    """Assess how fresh the graph data is"""
    
    if not graph_analytics:
        return "no_data"
    
    # For now, assume graph data is recent if it exists
    # In production, you'd check timestamps
    return "recent" 
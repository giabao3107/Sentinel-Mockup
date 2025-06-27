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

@wallet_bp.route('/api/v1/wallet/<address>', methods=['GET'])
def get_wallet_analysis(address):
    """
    Phase 2 Enhanced: Intelligent routing between real-time API and graph database
    """
    try:
        # Validate Ethereum address format
        if not is_valid_ethereum_address(address):
            return jsonify({"error": "Invalid Ethereum address format"}), 400
        
        # Check if we have enhanced graph data for this address
        has_graph_data = False
        graph_analytics = None
        
        if graph_client:
            try:
                graph_analytics = graph_client.get_address_analytics(address)
                has_graph_data = graph_analytics is not None
            except Exception as e:
                logger.warning(f"Could not fetch graph data for {address}: {str(e)}")
        
        # Route to appropriate data source
        if has_graph_data and request.args.get('source') != 'realtime':
            # Use enhanced graph database analysis
            return _get_enhanced_wallet_analysis(address, graph_analytics)
        else:
            # Use real-time API analysis (Phase 1 behavior)
            return _get_realtime_wallet_analysis(address)
            
    except Exception as e:
        logger.error(f"Error analyzing wallet {address}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

def _get_enhanced_wallet_analysis(address: str, graph_analytics: Dict) -> Dict:
    """Enhanced analysis using graph database and social intelligence"""
    
    # Initialize services
    etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
    risk_scorer = RiskScorer()
    
    # Get real-time balance and basic info
    etherscan_data = etherscan_service.get_wallet_info(address)
    
    # Get social intelligence (async call made sync for now)
    social_intel = None
    if social_service:
        try:
            # For demo, create a simplified social intelligence result
            social_intel = {
                "total_mentions": 0,
                "scam_alerts": 0,
                "sentiment_summary": {"positive": 0, "negative": 0, "neutral": 0},
                "risk_indicators": []
            }
        except Exception as e:
            logger.warning(f"Could not fetch social intelligence: {str(e)}")
    
    # Enhanced risk scoring
    enhanced_risk_score = _calculate_enhanced_risk_score(
        etherscan_data, 
        graph_analytics, 
        social_intel
    )
    
    # Enhanced behavioral tags
    enhanced_tags = _generate_enhanced_tags(graph_analytics, social_intel)
    
    # Combine all data sources
    analysis_result = {
        "address": address,
        "analysis_mode": "enhanced",
        "data_sources": ["etherscan", "neo4j", "social_media"],
        
        # Real-time data
        "balance": etherscan_data.get("balance", 0),
        "transactions": etherscan_data.get("transactions", []),
        "tokens": etherscan_data.get("tokens", []),
        
        # Enhanced analytics
        "risk_assessment": {
            "risk_score": enhanced_risk_score,
            "risk_level": _get_risk_level(enhanced_risk_score),
            "risk_factors": _identify_risk_factors(graph_analytics, social_intel),
            "confidence": _calculate_confidence(graph_analytics)
        },
        
        "behavioral_analysis": {
            "tags": enhanced_tags,
            "transaction_patterns": _analyze_transaction_patterns(graph_analytics),
            "network_analysis": _summarize_network_analysis(graph_analytics),
            "temporal_patterns": _analyze_temporal_patterns(graph_analytics)
        },
        
        # Graph insights
        "graph_insights": {
            "total_connections": graph_analytics.get('outgoing_count', 0) + graph_analytics.get('incoming_count', 0),
            "network_centrality": graph_analytics.get('network_centrality'),
            "cluster_info": graph_analytics.get('cluster_id'),
            "path_analysis_available": True
        },
        
        # Social intelligence
        "social_intelligence": social_intel,
        
        "recommendations": _generate_enhanced_recommendations(graph_analytics, social_intel),
        "next_actions": _suggest_next_actions(address, graph_analytics),
        
        "metadata": {
            "analysis_timestamp": datetime.now().isoformat(),
            "data_freshness": _assess_data_freshness(graph_analytics),
            "analysis_version": "2.0"
        }
    }
    
    return jsonify(analysis_result)

def _get_realtime_wallet_analysis(address: str) -> Dict:
    """Original Phase 1 real-time analysis"""
    
    # Initialize services
    etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
    risk_scorer = RiskScorer()
    
    # Get wallet information from Etherscan
    wallet_info = etherscan_service.get_wallet_info(address)
    
    if wallet_info is None:
        return jsonify({"error": "Could not retrieve wallet information"}), 500
    
    # Calculate risk score using Phase 1 heuristics
    risk_score = risk_scorer.calculate_risk_score(wallet_info)
    risk_level = _get_risk_level(risk_score)
    
    # Generate behavioral tags
    behavioral_tags = risk_scorer.generate_behavioral_tags(wallet_info, risk_score)
    
    analysis_result = {
        "address": address,
        "analysis_mode": "realtime",
        "data_sources": ["etherscan"],
        
        "balance": wallet_info.get("balance", 0),
        "transaction_count": len(wallet_info.get("transactions", [])),
        "transactions": wallet_info.get("transactions", [])[:10],  # Last 10 transactions
        "tokens": wallet_info.get("tokens", []),
        
        "risk_assessment": {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "confidence": "medium"  # Phase 1 has medium confidence
        },
        
        "behavioral_analysis": {
            "tags": behavioral_tags,
            "patterns": ["realtime_analysis_limited"]
        },
        
        "recommendations": [
            "Upgrade to enhanced analysis for deeper insights",
            "Import historical data for graph analysis"
        ],
        
        "metadata": {
            "analysis_timestamp": datetime.now().isoformat(),
            "analysis_version": "1.0",
            "upgrade_available": True
        }
    }
    
    return jsonify(analysis_result)

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
    
    # Phase 1 base score
    base_score = risk_scorer.calculate_risk_score(etherscan_data)
    
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
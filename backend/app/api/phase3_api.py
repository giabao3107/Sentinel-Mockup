"""
Sentinel Phase 3 API - Advanced Threat Intelligence Platform
Integrates GNN, Network Behavior Analysis, Alert System, and Multi-chain capabilities
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Dict, List, Optional, Any
import asyncio
import logging
from datetime import datetime, timedelta
import numpy as np

from ..database.postgres_graph import PostgreSQLGraphClient
try:
    from ..services.gnn_model import gnn_engine
    GNN_AVAILABLE = True
except ImportError:
    gnn_engine = None
    GNN_AVAILABLE = False

try:
    from ..services.network_behavior_analyzer import NetworkBehaviorAnalyzer
    NETWORK_ANALYZER_AVAILABLE = True
except ImportError:
    NetworkBehaviorAnalyzer = None
    NETWORK_ANALYZER_AVAILABLE = False

try:
    from ..services.alert_system import AlertSystem, AlertSeverity
    ALERT_SYSTEM_AVAILABLE = True
except ImportError:
    AlertSystem = None
    AlertSeverity = None
    ALERT_SYSTEM_AVAILABLE = False

try:
    from ..services.multichain_service import multichain_service
    MULTICHAIN_AVAILABLE = True
except ImportError:
    multichain_service = None
    MULTICHAIN_AVAILABLE = False
from ..services.etherscan_service import EtherscanService
from ..services.risk_scorer import RiskScorer
from ..utils.helpers import validate_ethereum_address, handle_errors

# Create Blueprint
phase3_bp = Blueprint('phase3', __name__, url_prefix='/api/v3')
logger = logging.getLogger(__name__)

# Service instances (initialized in app factory)
graph_client: PostgreSQLGraphClient = None
network_analyzer: NetworkBehaviorAnalyzer = None
alert_system: AlertSystem = None

def init_phase3_services(graph_db: PostgreSQLGraphClient, analyzer: NetworkBehaviorAnalyzer, alerts: AlertSystem):
    """Initialize Phase 3 service instances"""
    global graph_client, network_analyzer, alert_system
    graph_client = graph_db
    network_analyzer = analyzer
    alert_system = alerts

# === Core Intelligence Endpoints ===

@phase3_bp.route('/intelligence/<address>', methods=['GET'])
@handle_errors
def get_comprehensive_intelligence(address: str):
    """
    Get comprehensive threat intelligence using all Phase 3 capabilities
    
    Args:
        address: The address to analyze
        
    Query Parameters:
        - include_multichain: Include multi-chain analysis (default: true)
        - include_network: Include network behavior analysis (default: true)
        - gnn_analysis: Use GNN for risk assessment (default: true)
        
    Returns:
        Complete threat intelligence profile
    """
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    # Parse query parameters
    include_multichain = request.args.get('include_multichain', 'true').lower() == 'true'
    include_network = request.args.get('include_network', 'true').lower() == 'true'
    use_gnn = request.args.get('gnn_analysis', 'true').lower() == 'true'
    
    try:
        # Initialize analysis result
        analysis_result = {
            "address": address,
            "analysis_timestamp": datetime.now().isoformat(),
            "analysis_version": "3.0",
            "services_used": [],
            "intelligence_summary": {},
            "detailed_analysis": {}
        }
        
        # === 1. GNN-Based Risk Assessment ===
        gnn_analysis = None
        if use_gnn and GNN_AVAILABLE and gnn_engine:
            try:
                gnn_analysis = gnn_engine.analyze_address_with_gnn(address)
                analysis_result["services_used"].append("gnn_engine")
                analysis_result["detailed_analysis"]["gnn_assessment"] = gnn_analysis
                
                # Extract key intelligence
                analysis_result["intelligence_summary"]["gnn_risk_score"] = gnn_analysis.get("risk_score", 0)
                analysis_result["intelligence_summary"]["gnn_classification"] = gnn_analysis.get("classification", "Unknown")
                analysis_result["intelligence_summary"]["gnn_confidence"] = gnn_analysis.get("confidence", 0.0)
                
            except Exception as e:
                logger.error(f"GNN analysis failed for {address}: {str(e)}")
                analysis_result["detailed_analysis"]["gnn_assessment"] = {"error": "GNN analysis unavailable"}
        
        # === 2. Multi-chain Analysis ===
        multichain_analysis = None
        if include_multichain and MULTICHAIN_AVAILABLE and multichain_service:
            try:
                # Detect possible chains for this address
                possible_chains = multichain_service.detect_address_chain(address)
                
                # Analyze address across detected chains
                multichain_data = multichain_service.analyze_address_multichain(address, possible_chains)
                
                # Calculate cross-chain risk
                cross_chain_risk = multichain_service.calculate_cross_chain_risk(multichain_data)
                
                multichain_analysis = {
                    "supported_chains": multichain_service.get_supported_chains(),
                    "detected_chains": [chain.value for chain in possible_chains],
                    "cross_chain_risk": cross_chain_risk
                }
                
                analysis_result["services_used"].append("multichain_service")
                analysis_result["detailed_analysis"]["multichain_analysis"] = multichain_analysis
                
                # Extract key intelligence
                analysis_result["intelligence_summary"]["cross_chain_risk_score"] = cross_chain_risk.get("cross_chain_risk_score", 0)
                analysis_result["intelligence_summary"]["total_chains"] = cross_chain_risk.get("chain_summary", {}).get("total_chains", 0)
                
            except Exception as e:
                logger.error(f"Multi-chain analysis failed for {address}: {str(e)}")
                analysis_result["detailed_analysis"]["multichain_analysis"] = {"error": "Multi-chain analysis unavailable"}
        
        # === 3. Network Behavior Analysis ===
        network_analysis = None
        if include_network and NETWORK_ANALYZER_AVAILABLE and network_analyzer:
            try:
                # Get network data from Neo4j
                network_data = graph_client.get_address_subgraph(address, depth=3)
                
                if network_data and network_data.get('nodes'):
                    # Analyze clusters
                    cluster_analysis = network_analyzer.detect_clusters(network_data)
                    
                    # Analyze suspicious patterns
                    pattern_analysis = network_analyzer.analyze_suspicious_patterns(network_data)
                    
                    # Galaxy view for visualization
                    galaxy_data = network_analyzer.prepare_galaxy_view_data(network_data, address)
                    
                    network_analysis = {
                        "cluster_analysis": cluster_analysis,
                        "pattern_analysis": pattern_analysis,
                        "galaxy_visualization": galaxy_data,
                        "suspicious_clusters": [
                            cluster for cluster in cluster_analysis.get("clusters", [])
                            if cluster.get("risk_score", 0) > 70
                        ]
                    }
                    
                    analysis_result["services_used"].append("network_behavior_analyzer")
                    analysis_result["detailed_analysis"]["network_analysis"] = network_analysis
                    
                    # Extract key intelligence
                    analysis_result["intelligence_summary"]["suspicious_patterns"] = len(pattern_analysis.get("patterns", []))
                    analysis_result["intelligence_summary"]["high_risk_clusters"] = len(network_analysis["suspicious_clusters"])
                
            except Exception as e:
                logger.error(f"Network behavior analysis failed for {address}: {str(e)}")
                analysis_result["detailed_analysis"]["network_analysis"] = {"error": "Network analysis unavailable"}
        
        # === 4. Aggregate Risk Assessment ===
        aggregate_assessment = _calculate_aggregate_risk_assessment(
            gnn_analysis, 
            multichain_analysis, 
            network_analysis
        )
        
        analysis_result["intelligence_summary"]["aggregate_risk_score"] = aggregate_assessment["risk_score"]
        analysis_result["intelligence_summary"]["aggregate_risk_level"] = aggregate_assessment["risk_level"]
        analysis_result["intelligence_summary"]["confidence_score"] = aggregate_assessment["confidence"]
        analysis_result["detailed_analysis"]["aggregate_assessment"] = aggregate_assessment
        
        # === 5. Actionable Intelligence ===
        actionable_intelligence = _generate_actionable_intelligence(
            address, gnn_analysis, multichain_analysis, network_analysis
        )
        
        analysis_result["actionable_intelligence"] = actionable_intelligence
        
        return jsonify({
            "status": "success",
            "data": analysis_result
        })
        
    except Exception as e:
        logger.error(f"Comprehensive intelligence analysis failed for {address}: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Failed to generate comprehensive intelligence",
            "message": str(e)
        }), 500

@phase3_bp.route('/alerts/create', methods=['POST'])
@handle_errors
def create_alert_rule():
    """Create a new alert rule using the Sentinel Alert System"""
    
    try:
        if not ALERT_SYSTEM_AVAILABLE or not alert_system:
            return jsonify({
                "status": "error",
                "error": "Alert system not available"
            }), 503
            
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        # Validate required fields
        required_fields = ['name', 'rule_type', 'conditions']  # Fixed field name
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Use the alert_system.create_alert_rule method
        rule_id = alert_system.create_alert_rule(data)
        
        return jsonify({
            "status": "success",
            "data": {
                "rule_id": rule_id,
                "message": "Alert rule created successfully"
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to create alert rule: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Failed to create alert rule",
            "message": str(e)
        }), 500

@phase3_bp.route('/multichain/detect/<address>', methods=['GET'])
@handle_errors
def detect_address_chains(address: str):
    """Detect which blockchain networks an address could belong to"""
    
    try:
        if not MULTICHAIN_AVAILABLE or not multichain_service:
            return jsonify({
                "status": "error",
                "error": "Multichain service not available"
            }), 503
            
        # Detect possible chains
        possible_chains = multichain_service.detect_address_chain(address)
        
        # Get supported chains info
        supported_chains = multichain_service.get_supported_chains()
        
        return jsonify({
            "status": "success",
            "data": {
                "address": address,
                "possible_chains": [chain.value for chain in possible_chains],
                "supported_chains": supported_chains,
                "detection_timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to detect chains for {address}: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Failed to detect address chains",
            "message": str(e)
        }), 500

@phase3_bp.route('/gnn/classify/<address>', methods=['GET'])
@handle_errors
def classify_address_with_gnn(address: str):
    """Get GNN-based classification for an address"""
    
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    try:
        if not GNN_AVAILABLE or not gnn_engine:
            return jsonify({
                "status": "error",
                "error": "GNN engine not available"
            }), 503
            
        # Get graph data and transaction data for GNN analysis
        graph_data = {}
        transaction_data = []
        
        if graph_client:
            try:
                graph_data = graph_client.get_address_analytics(address) or {}
            except Exception as e:
                logger.warning(f"Could not fetch graph data: {str(e)}")
        
        # Get transaction data from etherscan for feature engineering
        try:
            etherscan_service = EtherscanService()
            tx_result = etherscan_service.get_transactions(address, limit=100)
            transaction_data = tx_result.get('transactions', [])
        except Exception as e:
            logger.warning(f"Could not fetch transaction data: {str(e)}")
        
        # Get GNN analysis
        gnn_result = gnn_engine.predict_single_wallet(address, graph_data, transaction_data)
        
        return jsonify({
            "status": "success",
            "data": {
                "address": address,
                "gnn_analysis": gnn_result,
                "model_version": gnn_result.get('model_version', 'GNN_v1.0'),
                "analysis_timestamp": datetime.now().isoformat(),
                "features_used": {
                    "graph_data_available": bool(graph_data),
                    "transaction_count": len(transaction_data),
                    "feature_engineering": "32-dimensional feature vector"
                }
            }
        })
        
    except Exception as e:
        logger.error(f"GNN classification failed for {address}: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "GNN classification failed",
            "message": str(e)
        }), 500

# === Helper Functions ===

def _calculate_aggregate_risk_assessment(gnn_analysis: Optional[Dict], 
                                        multichain_analysis: Optional[Dict], 
                                        network_analysis: Optional[Dict]) -> Dict:
    """Calculate aggregate risk assessment from all sources"""
    
    risk_scores = []
    confidence_scores = []
    risk_factors = []
    
    # GNN contribution
    if gnn_analysis and 'risk_score' in gnn_analysis:
        risk_scores.append(gnn_analysis['risk_score'])
        confidence_scores.append(gnn_analysis.get('confidence', 0.5))
        if gnn_analysis.get('classification') in ['Phishing_Scam', 'General_Scam', 'Sanctions_Related']:
            risk_factors.append(f"GNN classified as {gnn_analysis['classification']}")
    
    # Multi-chain contribution
    if multichain_analysis and 'cross_chain_risk' in multichain_analysis:
        cross_chain_risk = multichain_analysis['cross_chain_risk']
        risk_scores.append(cross_chain_risk.get('cross_chain_risk_score', 0))
        confidence_scores.append(0.8)  # Multi-chain analysis is generally reliable
        risk_factors.extend(cross_chain_risk.get('risk_factors', []))
    
    # Network analysis contribution
    if network_analysis:
        # Network-based risk scoring
        network_risk = 0
        if network_analysis.get('suspicious_patterns'):
            network_risk += len(network_analysis['suspicious_patterns']) * 15
        if network_analysis.get('high_risk_clusters'):
            network_risk += len(network_analysis['high_risk_clusters']) * 20
        
        risk_scores.append(min(network_risk, 100))
        confidence_scores.append(0.7)
        
        if network_analysis.get('suspicious_patterns'):
            risk_factors.extend([f"Suspicious pattern: {pattern.get('type', 'Unknown')}" 
                               for pattern in network_analysis['suspicious_patterns']])
    
    # Calculate weighted average
    if risk_scores:
        weights = confidence_scores if confidence_scores else [1.0] * len(risk_scores)
        weighted_risk = sum(score * weight for score, weight in zip(risk_scores, weights)) / sum(weights)
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.5
    else:
        weighted_risk = 0
        avg_confidence = 0
    
    # Determine risk level
    if weighted_risk >= 80:
        risk_level = "CRITICAL"
    elif weighted_risk >= 60:
        risk_level = "HIGH"
    elif weighted_risk >= 40:
        risk_level = "MEDIUM"
    elif weighted_risk >= 20:
        risk_level = "LOW"
    else:
        risk_level = "MINIMAL"
    
    return {
        "risk_score": round(weighted_risk, 2),
        "risk_level": risk_level,
        "confidence": round(avg_confidence, 2),
        "risk_factors": risk_factors,
        "contributing_analyses": len(risk_scores),
        "calculation_method": "weighted_average"
    }

def _generate_actionable_intelligence(address: str, 
                                     gnn_analysis: Optional[Dict], 
                                     multichain_analysis: Optional[Dict], 
                                     network_analysis: Optional[Dict]) -> Dict:
    """Generate actionable intelligence and recommendations"""
    
    recommendations = []
    immediate_actions = []
    monitoring_suggestions = []
    
    # Based on GNN analysis
    if gnn_analysis:
        classification = gnn_analysis.get('classification', 'Unknown')
        risk_score = gnn_analysis.get('risk_score', 0)
        
        if classification in ['Phishing_Scam', 'General_Scam']:
            immediate_actions.append("⚠️ BLOCK IMMEDIATELY - GNN detected scam behavior")
            recommendations.append("Report address to relevant authorities")
        elif classification == 'Sanctions_Related':
            immediate_actions.append("🚫 COMPLIANCE ALERT - Address may be sanctions-related")
            recommendations.append("Verify against official sanctions lists")
        elif risk_score > 70:
            monitoring_suggestions.append("Enable continuous monitoring for this address")
    
    # Based on multi-chain analysis
    if multichain_analysis:
        cross_chain_risk = multichain_analysis.get('cross_chain_risk', {})
        if cross_chain_risk.get('cross_chain_risk_score', 0) > 60:
            recommendations.append("Implement cross-chain transaction monitoring")
            monitoring_suggestions.append("Track coordinated activities across chains")
    
    # Based on network analysis
    if network_analysis:
        if network_analysis.get('suspicious_clusters'):
            recommendations.append("Investigate connected addresses in high-risk clusters")
        
        suspicious_patterns = network_analysis.get('pattern_analysis', {}).get('patterns', [])
        for pattern in suspicious_patterns:
            if pattern.get('type') == 'sybil_attack':
                immediate_actions.append("🔍 Possible Sybil attack detected - verify address legitimacy")
            elif pattern.get('type') == 'wash_trading':
                recommendations.append("Review transaction patterns for wash trading")
    
    # General recommendations
    if not recommendations:
        recommendations.append("Continue regular monitoring")
    
    return {
        "immediate_actions": immediate_actions,
        "recommendations": recommendations,
        "monitoring_suggestions": monitoring_suggestions,
        "next_steps": [
            "Set up automated alerts for this address",
            "Review transaction history for patterns",
            "Monitor connected addresses"
        ],
        "intelligence_summary": f"Address {address} analyzed using Phase 3 advanced threat intelligence",
        "generated_at": datetime.now().isoformat()
    }
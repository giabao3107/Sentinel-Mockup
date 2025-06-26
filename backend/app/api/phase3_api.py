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

from ..database.neo4j_client import Neo4jClient
from ..services.gnn_model import gnn_engine, GNNIntelligenceEngine
from ..services.network_behavior_analyzer import NetworkBehaviorAnalyzer
from ..services.alert_system import AlertSystem, AlertRule, AlertType
from ..services.multichain_service import multichain_service, ChainType
from ..services.etherscan_service import EtherscanService
from ..services.risk_scorer import RiskScorer
from ..utils.helpers import validate_ethereum_address, handle_errors

# Create Blueprint
phase3_bp = Blueprint('phase3', __name__, url_prefix='/api/v3')
logger = logging.getLogger(__name__)

# Service instances (initialized in app factory)
neo4j_client: Neo4jClient = None
network_analyzer: NetworkBehaviorAnalyzer = None
alert_system: AlertSystem = None

def init_phase3_services(neo4j: Neo4jClient, analyzer: NetworkBehaviorAnalyzer, alerts: AlertSystem):
    """Initialize Phase 3 service instances"""
    global neo4j_client, network_analyzer, alert_system
    neo4j_client = neo4j
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
        if use_gnn and gnn_engine:
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
        if include_multichain:
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
        if include_network and network_analyzer:
            try:
                # Get network data from Neo4j
                network_data = neo4j_client.get_address_subgraph(address, depth=3)
                
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
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body required"}), 400
        
        # Validate required fields
        required_fields = ['name', 'alert_type', 'conditions']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Create alert rule
        alert_rule = AlertRule(
            name=data['name'],
            alert_type=AlertType(data['alert_type']),
            conditions=data['conditions'],
            notification_channels=data.get('notification_channels', ['email']),
            cooldown_minutes=data.get('cooldown_minutes', 60),
            enabled=data.get('enabled', True),
            created_by=data.get('user_id', 'anonymous')
        )
        
        # Add to alert system
        rule_id = alert_system.add_alert_rule(alert_rule)
        
        return jsonify({
            "status": "success",
            "data": {
                "rule_id": rule_id,
                "alert_rule": {
                    "id": rule_id,
                    "name": alert_rule.name,
                    "alert_type": alert_rule.alert_type.value,
                    "conditions": alert_rule.conditions,
                    "notification_channels": alert_rule.notification_channels,
                    "enabled": alert_rule.enabled,
                    "created_at": alert_rule.created_at.isoformat()
                }
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
        # Get GNN analysis
        gnn_result = gnn_engine.analyze_address_with_gnn(address)
        
        return jsonify({
            "status": "success",
            "data": {
                "address": address,
                "gnn_analysis": gnn_result,
                "model_version": gnn_engine.model_version,
                "analysis_timestamp": datetime.now().isoformat()
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
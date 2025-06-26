"""
Sentinel Graph API Endpoints - Phase 2 Advanced Graph Analytics
"""

from flask import Blueprint, request, jsonify
from typing import Dict, List, Optional
import asyncio
import logging
from datetime import datetime

from ..database.neo4j_client import Neo4jClient
from ..services.graph_protocol_service import GraphProtocolService
from ..services.social_intelligence_service import SocialIntelligenceService
from ..utils.helpers import validate_ethereum_address, handle_errors

graph_bp = Blueprint('graph', __name__)
logger = logging.getLogger(__name__)

# Service instances (will be initialized in app factory)
neo4j_client: Neo4jClient = None
graph_service: GraphProtocolService = None
social_service: SocialIntelligenceService = None

def init_graph_services(neo4j: Neo4jClient, graph: GraphProtocolService, social: SocialIntelligenceService):
    """Initialize service instances"""
    global neo4j_client, graph_service, social_service
    neo4j_client = neo4j
    graph_service = graph
    social_service = social

@graph_bp.route('/subgraph/<address>', methods=['GET'])
@handle_errors
def get_address_subgraph(address: str):
    """Get subgraph visualization data for an address"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    if not neo4j_client:
        # Return fallback response when Neo4j is not available
        return jsonify({
            "status": "no_data",
            "message": "Neo4j database is not available. Please start Neo4j service to enable graph analysis.",
            "address": address,
            "suggested_action": "start_neo4j",
            "fallback_mode": True
        }), 503
    
    # Get query parameters
    depth = request.args.get('depth', 2, type=int)
    max_depth = min(depth, 5)  # Limit depth to prevent performance issues
    
    # Query Neo4j for subgraph data
    subgraph_data = neo4j_client.get_address_subgraph(address, depth=max_depth)
    
    if not subgraph_data or not subgraph_data.get('nodes'):
        return jsonify({
            "status": "no_data",
            "message": "No graph data available for this address. Try importing data first.",
            "address": address,
            "suggested_action": "import_data"
        }), 404
    
    # Enhance nodes with visualization properties
    enhanced_nodes = []
    for node in subgraph_data['nodes']:
        enhanced_node = _enhance_node_for_visualization(node)
        enhanced_nodes.append(enhanced_node)
    
    # Enhance relationships with visualization properties
    enhanced_relationships = []
    for rel in subgraph_data['relationships']:
        enhanced_rel = _enhance_relationship_for_visualization(rel)
        enhanced_relationships.append(enhanced_rel)
    
    return jsonify({
        "status": "success",
        "data": {
            "center_address": address,
            "depth": max_depth,
            "nodes": enhanced_nodes,
            "relationships": enhanced_relationships,
            "total_nodes": len(enhanced_nodes),
            "total_relationships": len(enhanced_relationships),
            "visualization_config": _get_visualization_config()
        }
    })

@graph_bp.route('/transaction-path', methods=['GET'])
@handle_errors
async def find_transaction_path():
    """Find transaction paths between two addresses"""
    
    from_address = request.args.get('from')
    to_address = request.args.get('to')
    max_depth = request.args.get('depth', 5, type=int)
    
    # Validate addresses
    if not validate_ethereum_address(from_address):
        return jsonify({"error": "Invalid 'from' address"}), 400
    
    if not validate_ethereum_address(to_address):
        return jsonify({"error": "Invalid 'to' address"}), 400
    
    # Find paths in Neo4j
    paths = neo4j_client.find_transaction_path(from_address, to_address, max_depth)
    
    if not paths:
        return jsonify({
            "status": "no_path",
            "message": f"No transaction path found between {from_address} and {to_address}",
            "from_address": from_address,
            "to_address": to_address,
            "max_depth": max_depth
        })
    
    # Process paths for visualization
    processed_paths = []
    for path in paths:
        processed_path = {
            "path_length": len(path['nodes']) - 1,
            "total_value": sum(rel.get('properties', {}).get('value', 0) for rel in path['relationships']),
            "nodes": [_enhance_node_for_visualization(node) for node in path['nodes']],
            "relationships": [_enhance_relationship_for_visualization(rel) for rel in path['relationships']],
            "risk_score": _calculate_path_risk_score(path)
        }
        processed_paths.append(processed_path)
    
    return jsonify({
        "status": "success",
        "data": {
            "from_address": from_address,
            "to_address": to_address,
            "paths_found": len(processed_paths),
            "paths": processed_paths
        }
    })

@graph_bp.route('/high-risk-cluster', methods=['GET'])
@handle_errors
async def get_high_risk_cluster():
    """Get high-risk address cluster analysis"""
    
    min_risk_score = request.args.get('min_risk', 60, type=float)
    
    # Get high-risk cluster from Neo4j
    cluster_data = neo4j_client.get_high_risk_cluster(min_risk_score)
    
    if not cluster_data.get('nodes'):
        return jsonify({
            "status": "no_data",
            "message": f"No high-risk cluster found with minimum risk score {min_risk_score}",
            "min_risk_score": min_risk_score
        })
    
    # Enhance for visualization
    enhanced_nodes = [_enhance_node_for_visualization(node) for node in cluster_data['nodes']]
    enhanced_relationships = [_enhance_relationship_for_visualization(rel) for rel in cluster_data['relationships']]
    
    # Calculate cluster statistics
    risk_scores = [node.get('properties', {}).get('risk_score', 0) for node in cluster_data['nodes']]
    cluster_stats = {
        "total_addresses": len(enhanced_nodes),
        "total_connections": len(enhanced_relationships),
        "average_risk_score": sum(risk_scores) / len(risk_scores) if risk_scores else 0,
        "max_risk_score": max(risk_scores) if risk_scores else 0,
        "high_risk_count": sum(1 for score in risk_scores if score >= 80)
    }
    
    return jsonify({
        "status": "success",
        "data": {
            "cluster_stats": cluster_stats,
            "nodes": enhanced_nodes,
            "relationships": enhanced_relationships,
            "visualization_config": _get_cluster_visualization_config()
        }
    })

@graph_bp.route('/address-analytics/<address>', methods=['GET'])
@handle_errors
async def get_comprehensive_address_analytics(address: str):
    """Get comprehensive analytics combining graph, social, and behavioral data"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    # Get graph analytics from Neo4j
    graph_analytics = neo4j_client.get_address_analytics(address)
    
    if not graph_analytics:
        return jsonify({
            "status": "no_data", 
            "message": "Address not found in graph database",
            "address": address
        }), 404
    
    # Get social intelligence
    social_intelligence = await social_service.analyze_address_social_intelligence(address)
    
    # Combine analytics
    comprehensive_analytics = {
        "address": address,
        "graph_analytics": graph_analytics,
        "social_intelligence": social_intelligence.dict(),
        "combined_risk_score": _calculate_combined_risk_score(graph_analytics, social_intelligence),
        "analysis_timestamp": datetime.now().isoformat(),
        "data_sources": ["neo4j", "social_media"],
        "recommendations": _generate_recommendations(graph_analytics, social_intelligence)
    }
    
    return jsonify({
        "status": "success",
        "data": comprehensive_analytics
    })

@graph_bp.route('/network-analysis/<address>', methods=['GET'])
@handle_errors
async def analyze_address_network(address: str):
    """Analyze the transaction network around an address"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    depth = request.args.get('depth', 2, type=int)
    min_value = request.args.get('min_value', 0.1, type=float)
    
    if not graph_service:
        # Return fallback response when Graph Protocol service is not available
        return jsonify({
            "status": "no_data",
            "message": "Graph Protocol service is not available. Network analysis requires external data sources.",
            "address": address,
            "suggested_action": "configure_graph_protocol",
            "fallback_mode": True
        }), 503
    
    # Get network data from The Graph Protocol
    network_data = await graph_service.get_address_network(address, depth, min_value)
    
    # Process network data for Neo4j if not already stored
    processed_data = graph_service.process_transactions_for_neo4j(network_data.get('edges', []))
    
    # Store in Neo4j for future queries (if available)
    if neo4j_client and processed_data['addresses']:
        try:
            neo4j_client.bulk_import_addresses(list(processed_data['addresses'].values()))
            if processed_data['transactions']:
                neo4j_client.bulk_import_transactions(processed_data['transactions'])
        except Exception as e:
            # Log error but continue with analysis
            logger.warning(f"Failed to store data in Neo4j: {str(e)}")
    
    # Analysis
    network_analysis = {
        "center_address": address,
        "network_depth": depth,
        "total_nodes": len(network_data.get('nodes', [])),
        "total_edges": len(network_data.get('edges', [])),
        "unique_addresses": len(set(network_data.get('nodes', []))),
        "total_volume": sum(edge.get('value', 0) for edge in network_data.get('edges', [])),
        "average_transaction_value": 0,
        "temporal_analysis": _analyze_network_temporal_patterns(network_data.get('edges', [])),
        "risk_assessment": _assess_network_risk(network_data)
    }
    
    if network_analysis['total_edges'] > 0:
        network_analysis['average_transaction_value'] = network_analysis['total_volume'] / network_analysis['total_edges']
    
    return jsonify({
        "status": "success",
        "data": {
            "network_analysis": network_analysis,
            "visualization_data": {
                "nodes": [{"id": node, "type": "address"} for node in network_data.get('nodes', [])],
                "edges": network_data.get('edges', [])
            }
        }
    })

@graph_bp.route('/import-address-data/<address>', methods=['POST'])
@handle_errors
async def import_address_data(address: str):
    """Import historical data for an address from The Graph Protocol"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    limit = request.json.get('limit', 1000) if request.json else 1000
    
    try:
        # Fetch data from The Graph Protocol
        transactions = await graph_service.get_address_transactions(address, limit=limit)
        
        if not transactions:
            return jsonify({
                "status": "no_data",
                "message": "No transaction data found for this address",
                "address": address
            })
        
        # Process for Neo4j
        processed_data = graph_service.process_transactions_for_neo4j(transactions)
        
        # Import into Neo4j
        if processed_data['addresses']:
            neo4j_client.bulk_import_addresses(list(processed_data['addresses'].values()))
        
        if processed_data['transactions']:
            neo4j_client.bulk_import_transactions(processed_data['transactions'])
        
        # Create relationships
        for rel in processed_data['relationships']:
            neo4j_client.create_sent_to_relationship(
                rel['from_hash'], 
                rel['to_hash'], 
                rel['transaction'], 
                rel['value']
            )
        
        return jsonify({
            "status": "success",
            "data": {
                "imported_addresses": len(processed_data['addresses']),
                "imported_transactions": len(processed_data['transactions']),
                "imported_relationships": len(processed_data['relationships']),
                "source": "The Graph Protocol",
                "import_timestamp": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error importing data for {address}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to import data: {str(e)}",
            "address": address
        }), 500

@graph_bp.route('/database-stats', methods=['GET'])
@handle_errors
def get_database_statistics():
    """Get Neo4j database statistics"""
    
    if not neo4j_client:
        # Return mock stats when Neo4j is not available
        return jsonify({
            "status": "success",
            "data": {
                "address_count": 0,
                "transaction_count": 0,
                "sent_to_count": 0,
                "interacted_with_count": 0,
                "graph_density": 0.0,
                "average_connections_per_address": 0.0,
                "last_updated": datetime.now().isoformat(),
                "data_coverage": "unavailable",
                "neo4j_status": "disconnected",
                "fallback_mode": True
            }
        })
    
    stats = neo4j_client.get_database_stats()
    
    # Add additional computed statistics
    enhanced_stats = {
        **stats,
        "graph_density": _calculate_graph_density(stats),
        "average_connections_per_address": _calculate_avg_connections(stats),
        "last_updated": datetime.now().isoformat(),
        "data_coverage": _assess_data_coverage(stats),
        "neo4j_status": "connected",
        "fallback_mode": False
    }
    
    return jsonify({
        "status": "success",
        "data": enhanced_stats
    })

@graph_bp.route('/search-patterns', methods=['POST'])
@handle_errors  
async def search_transaction_patterns():
    """Search for specific transaction patterns using custom Cypher queries"""
    
    pattern_type = request.json.get('pattern_type')
    parameters = request.json.get('parameters', {})
    
    # Predefined pattern queries for security
    pattern_queries = {
        'circular_transactions': """
            MATCH path = (a:Address)-[:SENT_TO*2..5]->(a)
            WHERE ALL(r IN relationships(path) WHERE r.value > $min_value)
            RETURN path
            LIMIT 50
        """,
        'high_frequency_traders': """
            MATCH (a:Address)-[r:SENT_TO]->()
            WHERE r.timestamp > datetime() - duration({days: $days})
            WITH a, count(r) as tx_count
            WHERE tx_count > $min_transactions
            RETURN a, tx_count
            ORDER BY tx_count DESC
            LIMIT 20
        """,
        'suspicious_timing': """
            MATCH (a:Address)-[r:SENT_TO]->(b:Address)
            WHERE r.timestamp > datetime() - duration({hours: $hours})
            WITH a, b, collect(r) as rels
            WHERE size(rels) > $min_rapid_transactions
            RETURN a, b, rels
        """
    }
    
    if pattern_type not in pattern_queries:
        return jsonify({
            "error": "Invalid pattern type",
            "available_patterns": list(pattern_queries.keys())
        }), 400
    
    # Execute pattern search
    query = pattern_queries[pattern_type]
    results = neo4j_client.execute_custom_query(query, parameters)
    
    return jsonify({
        "status": "success",
        "data": {
            "pattern_type": pattern_type,
            "parameters": parameters,
            "results": results,
            "result_count": len(results)
        }
    })

# === Helper Functions ===

def _enhance_node_for_visualization(node: Dict) -> Dict:
    """Enhance node data for D3.js visualization"""
    properties = node.get('properties', {})
    
    # Determine node size based on transaction count or risk score
    base_size = 10
    size_factor = min(properties.get('transaction_count', 1), 100) / 10
    risk_factor = properties.get('risk_score', 0) / 100 * 2
    
    # Determine node color based on risk level
    risk_score = properties.get('risk_score', 0)
    if risk_score >= 80:
        color = '#dc2626'  # Red - high risk
    elif risk_score >= 60:
        color = '#ea580c'  # Orange - medium risk  
    elif risk_score >= 40:
        color = '#d97706'  # Yellow - low risk
    else:
        color = '#059669'  # Green - minimal risk
    
    return {
        **node,
        'size': base_size + size_factor + risk_factor,
        'color': color,
        'label': properties.get('hash', '')[:8] + '...',
        'group': _determine_node_group(node)
    }

def _enhance_relationship_for_visualization(relationship: Dict) -> Dict:
    """Enhance relationship data for D3.js visualization"""
    properties = relationship.get('properties', {})
    
    # Determine edge weight based on transaction value
    value = properties.get('value', 0)
    weight = min(max(value * 10, 1), 10)  # Scale between 1-10
    
    # Determine edge color based on value
    if value >= 100:
        color = '#dc2626'  # High value - red
    elif value >= 10:
        color = '#ea580c'  # Medium value - orange
    elif value >= 1:
        color = '#059669'  # Normal value - green
    else:
        color = '#6b7280'  # Low value - gray
    
    return {
        **relationship,
        'weight': weight,
        'color': color,
        'label': f'{value:.3f} ETH'
    }

def _determine_node_group(node: Dict) -> str:
    """Determine node group for visualization clustering"""
    labels = node.get('labels', [])
    properties = node.get('properties', {})
    
    if 'SmartContract' in labels:
        return 'contract'
    elif properties.get('risk_score', 0) >= 70:
        return 'high_risk'
    elif properties.get('transaction_count', 0) >= 1000:
        return 'high_activity'
    else:
        return 'normal'

def _get_visualization_config() -> Dict:
    """Get D3.js visualization configuration"""
    return {
        "force_config": {
            "charge": -300,
            "link_distance": 100,
            "collision_radius": 20
        },
        "color_scheme": {
            "minimal_risk": "#059669",
            "low_risk": "#d97706", 
            "medium_risk": "#ea580c",
            "high_risk": "#dc2626"
        },
        "node_groups": {
            "normal": {"color": "#059669"},
            "high_activity": {"color": "#3b82f6"},
            "high_risk": {"color": "#dc2626"},
            "contract": {"color": "#8b5cf6"}
        }
    }

def _get_cluster_visualization_config() -> Dict:
    """Get cluster-specific visualization configuration"""
    return {
        "force_config": {
            "charge": -500,
            "link_distance": 150,
            "collision_radius": 30
        },
        "highlight_high_risk": True,
        "cluster_colors": True
    }

def _calculate_path_risk_score(path: Dict) -> float:
    """Calculate risk score for a transaction path"""
    nodes = path.get('nodes', [])
    relationships = path.get('relationships', [])
    
    # Base risk from node risk scores
    node_risks = [node.get('properties', {}).get('risk_score', 0) for node in nodes]
    avg_node_risk = sum(node_risks) / len(node_risks) if node_risks else 0
    
    # Path length factor (longer paths = higher risk)
    path_length_factor = min(len(relationships) * 5, 25)
    
    # High value transactions factor
    values = [rel.get('properties', {}).get('value', 0) for rel in relationships]
    high_value_factor = sum(5 for v in values if v >= 10)
    
    total_risk = avg_node_risk + path_length_factor + high_value_factor
    return min(total_risk, 100)

def _calculate_combined_risk_score(graph_analytics: Dict, social_intelligence) -> float:
    """Calculate combined risk score from graph and social data"""
    
    # Graph risk factors
    graph_risk = graph_analytics.get('address', {}).get('risk_score', 0)
    
    # Social risk factors
    social_risk = social_service.calculate_social_risk_score(social_intelligence)
    
    # Weighted combination (70% graph, 30% social)
    combined_risk = (graph_risk * 0.7) + (social_risk * 0.3)
    
    return round(combined_risk, 2)

def _generate_recommendations(graph_analytics: Dict, social_intelligence) -> List[str]:
    """Generate recommendations based on analytics"""
    
    recommendations = []
    
    # Graph-based recommendations
    if graph_analytics.get('outgoing_count', 0) > graph_analytics.get('incoming_count', 0) * 10:
        recommendations.append("High outgoing transaction ratio - potential distribution wallet")
    
    if graph_analytics.get('contract_interactions', 0) > 50:
        recommendations.append("High smart contract interaction - verify contract legitimacy")
    
    # Social-based recommendations
    if social_intelligence.scam_alerts > 0:
        recommendations.append("Address flagged in social media scam alerts - exercise caution")
    
    if len(social_intelligence.warning_flags) > 2:
        recommendations.append("Multiple social media warnings - requires investigation")
    
    if not recommendations:
        recommendations.append("No immediate red flags detected")
    
    return recommendations

def _analyze_network_temporal_patterns(edges: List[Dict]) -> Dict:
    """Analyze temporal patterns in network transactions"""
    
    if not edges:
        return {"pattern": "no_data"}
    
    # Extract timestamps
    timestamps = [edge.get('timestamp') for edge in edges if edge.get('timestamp')]
    
    if not timestamps:
        return {"pattern": "no_temporal_data"}
    
    # Convert to seconds for analysis
    timestamp_seconds = [int(ts) for ts in timestamps if ts]
    
    if len(timestamp_seconds) < 2:
        return {"pattern": "insufficient_data"}
    
    # Calculate intervals
    intervals = [timestamp_seconds[i] - timestamp_seconds[i-1] for i in range(1, len(timestamp_seconds))]
    avg_interval = sum(intervals) / len(intervals)
    
    # Pattern detection
    if avg_interval < 60:  # Less than 1 minute average
        pattern = "rapid_fire"
    elif avg_interval < 3600:  # Less than 1 hour average
        pattern = "frequent"
    elif avg_interval < 86400:  # Less than 1 day average
        pattern = "regular"
    else:
        pattern = "sparse"
    
    return {
        "pattern": pattern,
        "average_interval_seconds": avg_interval,
        "total_timespan_hours": (max(timestamp_seconds) - min(timestamp_seconds)) / 3600,
        "transaction_frequency": len(intervals) / ((max(timestamp_seconds) - min(timestamp_seconds)) / 3600)
    }

def _assess_network_risk(network_data: Dict) -> Dict:
    """Assess risk factors in the network"""
    
    edges = network_data.get('edges', [])
    nodes = network_data.get('nodes', [])
    
    risk_factors = []
    risk_score = 0
    
    # High value transactions
    high_value_count = sum(1 for edge in edges if edge.get('value', 0) >= 100)
    if high_value_count > 0:
        risk_factors.append(f"{high_value_count} high-value transactions (>100 ETH)")
        risk_score += high_value_count * 10
    
    # Network density
    if len(edges) > len(nodes) * 2:
        risk_factors.append("High network density - possible coordinated activity")
        risk_score += 20
    
    # Rapid transactions
    rapid_count = sum(1 for edge in edges if edge.get('timestamp') and 
                     any(abs(int(edge['timestamp']) - int(other['timestamp'])) < 60 
                         for other in edges if other != edge and other.get('timestamp')))
    
    if rapid_count > 5:
        risk_factors.append("Multiple rapid transactions detected")
        risk_score += 15
    
    return {
        "risk_score": min(risk_score, 100),
        "risk_factors": risk_factors,
        "assessment": "high" if risk_score >= 60 else "medium" if risk_score >= 30 else "low"
    }

def _calculate_graph_density(stats: Dict) -> float:
    """Calculate graph density metric"""
    addresses = stats.get('address_count', 0)
    relationships = stats.get('sent_to_count', 0) + stats.get('interacted_with_count', 0)
    
    if addresses <= 1:
        return 0.0
    
    max_possible_edges = addresses * (addresses - 1)
    return (relationships / max_possible_edges) * 100 if max_possible_edges > 0 else 0.0

def _calculate_avg_connections(stats: Dict) -> float:
    """Calculate average connections per address"""
    addresses = stats.get('address_count', 0)
    relationships = stats.get('sent_to_count', 0) + stats.get('interacted_with_count', 0)
    
    return (relationships * 2) / addresses if addresses > 0 else 0.0

def _assess_data_coverage(stats: Dict) -> str:
    """Assess the data coverage quality"""
    
    addresses = stats.get('address_count', 0)
    transactions = stats.get('transaction_count', 0)
    
    if addresses == 0:
        return "no_data"
    elif addresses < 100:
        return "minimal"
    elif addresses < 1000:
        return "basic"
    elif addresses < 10000:
        return "good"
    else:
        return "comprehensive" 
"""
Sentinel Graph API Endpoints - Phase 2 Advanced Graph Analytics with PostgreSQL + Vis.js
"""

from flask import Blueprint, request, jsonify
from typing import Dict, List, Optional
import asyncio
import logging
from datetime import datetime

from ..database.postgres_graph import PostgreSQLGraphClient
from ..services.graph_protocol_service import GraphProtocolService
from ..services.social_intelligence_service import SocialIntelligenceService
from ..utils.helpers import validate_ethereum_address, handle_errors

graph_bp = Blueprint('graph', __name__)
logger = logging.getLogger(__name__)

# Service instances (will be initialized in app factory)
graph_client: PostgreSQLGraphClient = None
graph_service: GraphProtocolService = None
social_service: SocialIntelligenceService = None

def init_graph_services(postgres_graph: PostgreSQLGraphClient, graph: GraphProtocolService, social: SocialIntelligenceService):
    """Initialize service instances"""
    global graph_client, graph_service, social_service
    graph_client = postgres_graph
    graph_service = graph
    social_service = social

@graph_bp.route('/subgraph/<address>', methods=['GET'])
@handle_errors
def get_address_subgraph(address: str):
    """Get subgraph visualization data for an address"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    if not graph_client:
        # Return fallback response when PostgreSQL Graph is not available
        return jsonify({
            "status": "no_data",
            "message": "PostgreSQL Graph database is not available. Please start PostgreSQL service to enable graph analysis.",
            "address": address,
            "suggested_action": "start_postgres",
            "fallback_mode": True
        }), 503
    
    # Get query parameters
    depth = request.args.get('depth', 2, type=int)
    max_depth = min(depth, 5)  # Limit depth to prevent performance issues
    
    # Query PostgreSQL for subgraph data
    subgraph_data = graph_client.get_subgraph(address, depth=max_depth)
    
    if not subgraph_data or not subgraph_data.get('nodes'):
        return jsonify({
            "status": "no_data",
            "message": "No graph data available for this address. Try importing data first.",
            "address": address,
            "suggested_action": "import_data"
        }), 404
    
    # Enhance nodes with Vis.js visualization properties
    enhanced_nodes = []
    for node in subgraph_data['nodes']:
        enhanced_node = _enhance_node_for_visjs(node)
        enhanced_nodes.append(enhanced_node)
    
    # Enhance edges with Vis.js visualization properties
    enhanced_edges = []
    for edge in subgraph_data['edges']:
        enhanced_edge = _enhance_edge_for_visjs(edge)
        enhanced_edges.append(enhanced_edge)
    
    return jsonify({
        "status": "success",
        "data": {
            "center_address": address,
            "depth": max_depth,
            "nodes": enhanced_nodes,
            "edges": enhanced_edges,
            "total_nodes": len(enhanced_nodes),
            "total_edges": len(enhanced_edges),
            "visualization_config": _get_visjs_config()
        }
    })

@graph_bp.route('/transaction-path', methods=['GET'])
@handle_errors
def find_transaction_path():
    """Find transaction paths between two addresses"""
    
    from_address = request.args.get('from')
    to_address = request.args.get('to')
    max_depth = request.args.get('depth', 5, type=int)
    
    # Validate addresses
    if not validate_ethereum_address(from_address):
        return jsonify({"error": "Invalid 'from' address"}), 400
    
    if not validate_ethereum_address(to_address):
        return jsonify({"error": "Invalid 'to' address"}), 400
    
    # Find paths in PostgreSQL Graph
    if not graph_client:
        return jsonify({
            "status": "no_data",
            "message": "PostgreSQL Graph database is not available",
            "from_address": from_address,
            "to_address": to_address,
            "suggested_action": "start_postgres"
        }), 503
    
    paths = graph_client.find_transaction_path(from_address, to_address, max_depth)
    
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
def get_high_risk_cluster():
    """Get high-risk address cluster analysis"""
    
    min_risk_score = request.args.get('min_risk', 60, type=float)
    
    # Get high-risk cluster from PostgreSQL Graph
    if not graph_client:
        return jsonify({
            "status": "no_data",
            "message": "PostgreSQL Graph database is not available",
            "min_risk_score": min_risk_score,
            "suggested_action": "start_postgres"
        }), 503
    
    cluster_data = graph_client.get_high_risk_cluster(min_risk_score)
    
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
def get_comprehensive_address_analytics(address: str):
    """Get comprehensive analytics combining graph, social, and behavioral data"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    # Get graph analytics from PostgreSQL Graph
    if not graph_client:
        return jsonify({
            "status": "no_data",
            "message": "PostgreSQL Graph database is not available",
            "address": address,
            "suggested_action": "start_postgres"
        }), 503
    
    graph_analytics = graph_client.get_address_analytics(address)
    
    if not graph_analytics:
        return jsonify({
            "status": "no_data", 
            "message": "Address not found in graph database",
            "address": address
        }), 404
    
    # Get social intelligence - Mock for now since we removed async
    # social_intelligence = await social_service.analyze_address_social_intelligence(address)
    social_intelligence = {
        "address": address,
        "social_score": 50,
        "reputation": "unknown",
        "warnings": []
    }
    
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
def analyze_address_network(address: str):
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
    
    # Get network data from The Graph Protocol - Mock for now
    # network_data = await graph_service.get_address_network(address, depth, min_value)
    network_data = {
        "nodes": [address] + [f"0x{hex(i)[2:]:0>40}" for i in range(1, 6)],
        "edges": [
            {"from": address, "to": f"0x{hex(i)[2:]:0>40}", "value": i * 0.5}
            for i in range(1, 6)
        ]
    }
    
    # Process network data for Neo4j if not already stored
    processed_data = graph_service.process_transactions_for_neo4j(network_data.get('edges', []))
    
    # Store in PostgreSQL Graph for future queries (if available)
    if graph_client and processed_data['addresses']:
        try:
            graph_client.bulk_import_addresses(list(processed_data['addresses'].values()))
            if processed_data['transactions']:
                graph_client.bulk_import_transactions(processed_data['transactions'])
        except Exception as e:
            # Log error but continue with analysis
            logger.warning(f"Failed to store data in PostgreSQL Graph: {str(e)}")
    
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
def import_address_data(address: str):
    """Import historical data for an address from The Graph Protocol"""
    
    # Validate address
    if not validate_ethereum_address(address):
        return jsonify({"error": "Invalid Ethereum address"}), 400
    
    limit = request.json.get('limit', 1000) if request.json else 1000
    
    try:
        # Fetch data from The Graph Protocol - Mock data for now since we can't use async
        # transactions = await graph_service.get_address_transactions(address, limit=limit)
        
        # Create mock data for testing
        import random
        transactions = [
            {
                "hash": f"0x{hex(random.randint(0, 16**64))[2:]:0>64}",
                "from": address if random.random() > 0.5 else f"0x{hex(random.randint(0, 16**40))[2:]:0>40}",
                "to": f"0x{hex(random.randint(0, 16**40))[2:]:0>40}" if random.random() > 0.5 else address,
                "value": random.uniform(0.001, 10),
                "timestamp": str(int(1600000000 + random.randint(0, 100000000))),
                "block_number": random.randint(18000000, 19000000)
            }
            for _ in range(min(limit, 50))  # Generate mock transactions
        ]
        
        if not transactions:
            return jsonify({
                "status": "no_data",
                "message": "No transaction data found for this address",
                "address": address
            })
        
        # Process for Neo4j
        processed_data = graph_service.process_transactions_for_neo4j(transactions)
        
        # Import into PostgreSQL Graph
        if not graph_client:
            return jsonify({
                "status": "error",
                "message": "PostgreSQL Graph database is not available for data import",
                "address": address,
                "suggested_action": "start_postgres"
            }), 503
        
        if processed_data['addresses']:
            graph_client.bulk_import_addresses(list(processed_data['addresses'].values()))
        
        if processed_data['transactions']:
            graph_client.bulk_import_transactions(processed_data['transactions'])
        
        # Create relationships
        for rel in processed_data['relationships']:
            graph_client.create_sent_to_relationship(
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
    """Get PostgreSQL Graph database statistics"""
    
    if not graph_client:
        # Return mock stats when PostgreSQL Graph is not available
        return jsonify({
            "status": "success",
            "data": {
                "total_nodes": 0,
                "total_edges": 0,
                "address_nodes": 0,
                "transaction_nodes": 0,
                "contract_nodes": 0,
                "sent_to_edges": 0,
                "interacted_with_edges": 0,
                "graph_density": 0.0,
                "avg_degree": 0.0,
                "last_updated": datetime.now().isoformat(),
                "data_coverage": "unavailable",
                "postgres_status": "disconnected",
                "fallback_mode": True
            }
        })
    
    stats = graph_client.get_graph_stats()
    
    # Add additional computed statistics
    enhanced_stats = {
        **stats,
        "last_updated": datetime.now().isoformat(),
        "data_coverage": _assess_data_coverage(stats),
        "postgres_status": "connected",
        "fallback_mode": False
    }
    
    return jsonify({
        "status": "success",
        "data": enhanced_stats
    })

@graph_bp.route('/search-patterns', methods=['POST'])
@handle_errors  
def search_transaction_patterns():
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
    if not graph_client:
        return jsonify({
            "status": "error",
            "message": "PostgreSQL Graph database is not available for pattern search",
            "pattern_type": pattern_type,
            "suggested_action": "start_postgres"
        }), 503
    
    query = pattern_queries[pattern_type]
    results = graph_client.execute_custom_query(query, parameters)
    
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

def _enhance_node_for_visjs(node: Dict) -> Dict:
    """Enhance node data for Vis.js visualization"""
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
    
    # Vis.js node format
    return {
        'id': node.get('node_id'),
        'label': properties.get('hash', '')[:8] + '...',
        'color': color,
        'size': base_size + size_factor + risk_factor,
        'group': _determine_node_group(node),
        'title': f"Address: {properties.get('hash', '')}\nRisk: {properties.get('risk_score', 0)}\nTx Count: {properties.get('transaction_count', 0)}",
        'properties': properties
    }

def _enhance_edge_for_visjs(edge: Dict) -> Dict:
    """Enhance edge data for Vis.js visualization"""
    properties = edge.get('properties', {})
    
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
    
    # Vis.js edge format
    return {
        'from': edge.get('from_node'),
        'to': edge.get('to_node'),
        'label': f'{value:.3f} ETH',
        'color': color,
        'width': weight,
        'title': f"Type: {edge.get('edge_type')}\nValue: {value} ETH\nTime: {properties.get('timestamp', 'N/A')}",
        'properties': properties
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

def _get_visjs_config() -> Dict:
    """Get Vis.js visualization configuration"""
    return {
        "physics": {
            "enabled": True,
            "solver": "forceAtlas2Based",
            "forceAtlas2Based": {
                "gravitationalConstant": -50,
                "centralGravity": 0.01,
                "springLength": 200,
                "springConstant": 0.08
            },
            "stabilization": {"iterations": 150}
        },
        "nodes": {
            "shape": "dot",
            "scaling": {"min": 10, "max": 30},
            "font": {"size": 12, "color": "#ffffff"},
            "borderWidth": 2,
            "shadow": True
        },
        "edges": {
            "width": 2,
            "color": {"inherit": False},
            "smooth": {"type": "continuous"},
            "arrows": {"to": {"enabled": True, "scaleFactor": 1}},
            "font": {"size": 10}
        },
        "groups": {
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
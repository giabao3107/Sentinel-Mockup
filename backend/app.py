from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import os
from datetime import datetime

from app.database.neo4j_client import Neo4jClient
from app.services.graph_protocol_service import GraphProtocolService
from app.services.social_intelligence_service import SocialIntelligenceService
from app.api.graph import graph_bp, init_graph_services
from app.api.wallet import wallet_bp, init_services
from app.api.alert_api import alert_api

def create_app():
    app = Flask(__name__)
    
    # Configure CORS for development and production
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://sentinel-mockup.vercel.app",  # Production Vercel domain
    ]
    
    # Add production Vercel domains
    vercel_domain = os.environ.get('VERCEL_DOMAIN')
    if vercel_domain:
        allowed_origins.append(f"https://{vercel_domain}")
    
    # Add any additional allowed origins from environment
    additional_origins = os.environ.get('ALLOWED_ORIGINS', '').split(',')
    for origin in additional_origins:
        if origin.strip():
            allowed_origins.append(origin.strip())
    
    # Configure CORS with more permissive settings
    # Use supports_credentials=False and origins="*" for development
    if os.environ.get('FLASK_ENV') == 'development':
        CORS(app, origins="*")
    else:
        # Production: use specific origins
        CORS(app, 
             origins=allowed_origins,
             allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             supports_credentials=False)
    
    # Load environment variables
    load_dotenv()
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(level=logging.INFO)
    
    # Initialize Phase 2 services
    neo4j_client = None
    graph_service = None
    social_service = None
    
    # Try to initialize Phase 2 enhanced services
    try:
        # Neo4j database client
        neo4j_client = Neo4jClient()
        if neo4j_client.connect():
            app.logger.info("✅ Neo4j database connected - Enhanced analysis available")
        else:
            app.logger.warning("⚠️ Neo4j connection failed - Falling back to Phase 1 analysis")
            neo4j_client = None
    except Exception as e:
        app.logger.warning(f"⚠️ Neo4j initialization failed: {str(e)} - Using Phase 1 analysis")
        neo4j_client = None
    
    try:
        # The Graph Protocol service
        graph_service = GraphProtocolService()
        app.logger.info("✅ The Graph Protocol service initialized")
    except Exception as e:
        app.logger.warning(f"⚠️ The Graph Protocol service failed: {str(e)}")
        graph_service = None
    
    try:
        # Social Intelligence service  
        social_service = SocialIntelligenceService()
        app.logger.info("✅ Social Intelligence service initialized")
    except Exception as e:
        app.logger.warning(f"⚠️ Social Intelligence service failed: {str(e)}")
        social_service = None
    
    # Initialize services in API modules
    if neo4j_client and graph_service and social_service:
        init_graph_services(neo4j_client, graph_service, social_service)
        init_services(neo4j_client, graph_service, social_service)
        app.logger.info("🚀 Phase 2 Enhanced Analysis Mode Activated")
    else:
        app.logger.info("📊 Running in Phase 1 Analysis Mode")
    
    # Register blueprints
    app.register_blueprint(wallet_bp)
    app.register_blueprint(alert_api)
    app.logger.info("✅ Alert API endpoints registered")
    
    # Always register graph endpoints (with fallback handling for when Neo4j is unavailable)
    init_graph_services(neo4j_client, graph_service, social_service)
    app.register_blueprint(graph_bp, url_prefix='/api/graph')
    app.logger.info("✅ Graph API endpoints registered")
    
    if neo4j_client:
        app.logger.info("✅ Neo4j connected - Enhanced graph analysis available")
    else:
        app.logger.info("⚠️ Neo4j unavailable - Graph endpoints will return fallback responses")
    
    # Health check endpoint
    @app.route('/health')
    def health():
        """Enhanced health check with Phase 2 service status"""
        
        status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "services": {
                "etherscan": "available",
                "neo4j": "available" if neo4j_client else "unavailable",
                "graph_protocol": "available" if graph_service else "unavailable", 
                "social_intelligence": "available" if social_service else "unavailable"
            },
            "analysis_mode": "enhanced" if neo4j_client else "standard",
            "features": {
                "wallet_analysis": True,
                "graph_visualization": bool(neo4j_client),
                "social_intelligence": bool(social_service),
                "historical_data": bool(graph_service),
                "investigation_canvas": bool(neo4j_client)
            }
        }
        
        # Database connectivity check
        if neo4j_client:
            try:
                stats = neo4j_client.get_database_stats()
                status["database"] = {
                    "connected": True,
                    "node_count": stats.get('address_count', 0) + stats.get('transaction_count', 0),
                    "relationship_count": stats.get('sent_to_count', 0) + stats.get('interacted_with_count', 0)
                }
            except Exception as e:
                status["database"] = {
                    "connected": False,
                    "error": str(e)
                }
                status["services"]["neo4j"] = "error"
        
        return jsonify(status)
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information and available endpoints"""
        
        endpoints = {
            "phase_1": {
                "wallet_analysis": "/api/v1/wallet/{address}",
                "description": "Basic wallet analysis with real-time data"
            },
            "alert_system": {
                "get_rules": "/api/alerts/rules",
                "create_rule": "/api/alerts/rules [POST]",
                "update_rule": "/api/alerts/rules/{rule_id} [PUT]",
                "delete_rule": "/api/alerts/rules/{rule_id} [DELETE]",
                "toggle_rule": "/api/alerts/rules/{rule_id}/toggle [POST]",
                "get_events": "/api/alerts/events",
                "monitor_address": "/api/alerts/monitor [POST]",
                "get_stats": "/api/alerts/stats",
                "test_rule": "/api/alerts/test [POST]",
                "description": "Real-time alert system with custom rules and notifications"
            }
        }
        
        if neo4j_client:
            endpoints["phase_2"] = {
                "enhanced_analysis": "/api/v1/wallet/{address}",
                "graph_subgraph": "/api/graph/subgraph/{address}",
                "import_data": "/api/graph/import-address-data/{address}",
                "database_stats": "/api/graph/database-stats",
                "transaction_path": "/api/graph/transaction-path",
                "high_risk_cluster": "/api/graph/high-risk-cluster",
                "description": "Enhanced analysis with graph database and social intelligence"
            }
        
        return jsonify({
            "name": "Sentinel Threat Intelligence API",
            "version": "2.0",
            "description": "Next-generation blockchain threat intelligence platform",
            "phase": "enhanced" if neo4j_client else "standard",
            "endpoints": endpoints,
            "documentation": "/docs",
            "health": "/health"
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "error": "Endpoint not found",
            "message": "The requested endpoint does not exist",
            "available_endpoints": "/api/info"
        }), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "support": "Please check the logs for more details"
        }), 500
    
    # Cleanup on app teardown
    @app.teardown_appcontext
    def cleanup(error):
        if neo4j_client:
            try:
                neo4j_client.close()
            except:
                pass
    
    return app 
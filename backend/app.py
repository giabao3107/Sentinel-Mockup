from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import os
from datetime import datetime

from app.database.postgres_graph import PostgreSQLGraphClient
from app.services.graph_protocol_service import GraphProtocolService
from app.services.social_intelligence_service import SocialIntelligenceService
from app.services.network_behavior_analyzer import NetworkBehaviorAnalyzer
from app.services.alert_system import AlertSystem
from app.api.graph import graph_bp, init_graph_services
from app.api.wallet import wallet_bp, init_services
from app.api.alert_api import alert_api
from app.api.social_api import social_api, init_social_service
from app.api.phase3_api import phase3_bp, init_phase3_services
from app.api.public_api import public_api_bp

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
    # Check for development environment (also check DEBUG flag as fallback)
    is_development = (os.environ.get('FLASK_ENV') == 'development' or 
                     os.environ.get('DEBUG', 'False').lower() == 'true' or
                     app.debug)
    
    if is_development:
        # Development: Allow all origins
        CORS(app, 
             origins="*",
             allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             supports_credentials=False)
        app.logger.info("🔓 CORS configured for development (allowing all origins)")
    else:
        # Production: use specific origins
        CORS(app, 
             origins=allowed_origins,
             allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
             supports_credentials=False)
        app.logger.info(f"🔒 CORS configured for production (allowed origins: {allowed_origins})")
    
    # Load environment variables
    load_dotenv()
    
    # Configure app
    app.config['ETHERSCAN_API_KEY'] = os.environ.get('ETHERSCAN_API_KEY', 'YourApiKeyToken')
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(level=logging.INFO)
    
    # Initialize Phase 2 services
    graph_client = None
    graph_service = None
    social_service = None
    
    # Initialize Phase 3 services
    network_analyzer = None
    alert_system = None
    
    # Try to initialize Phase 2 enhanced services
    try:
        # PostgreSQL Graph database client
        graph_client = PostgreSQLGraphClient()
        if graph_client.connect():
            graph_client.initialize_graph_schema()
            app.logger.info("✅ PostgreSQL Graph database connected - Enhanced analysis available")
        else:
            app.logger.warning("⚠️ PostgreSQL Graph connection failed - Falling back to Phase 1 analysis")
            graph_client = None
    except Exception as e:
        app.logger.warning(f"⚠️ PostgreSQL Graph initialization failed: {str(e)} - Using Phase 1 analysis")
        graph_client = None
    
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
    
    # Try to initialize Phase 3 services
    try:
        # Network Behavior Analyzer
        if graph_client:
            network_analyzer = NetworkBehaviorAnalyzer(graph_client)
            app.logger.info("✅ Network Behavior Analyzer initialized")
        else:
            app.logger.warning("⚠️ Network Behavior Analyzer requires PostgreSQL Graph - skipping")
    except Exception as e:
        app.logger.warning(f"⚠️ Network Behavior Analyzer failed: {str(e)}")
        network_analyzer = None
    
    try:
        # Alert System
        if graph_client:
            alert_system = AlertSystem(graph_client)
            app.logger.info("✅ Alert System initialized")
        else:
            app.logger.warning("⚠️ Alert System requires Neo4j - skipping")
    except Exception as e:
        app.logger.warning(f"⚠️ Alert System failed: {str(e)}")
        alert_system = None
    
    # Initialize services in API modules
    if graph_client and graph_service and social_service:
        init_graph_services(graph_client, graph_service, social_service)
        init_services(graph_client, graph_service, social_service)
        init_social_service(social_service)
        app.logger.info("🚀 Phase 2 Enhanced Analysis Mode Activated")
    else:
        app.logger.info("📊 Running in Phase 1 Analysis Mode")
        # Initialize social service even if other services are not available
        if social_service:
            init_social_service(social_service)
    
    # Initialize Phase 3 services if available
    if graph_client and network_analyzer and alert_system:
        init_phase3_services(graph_client, network_analyzer, alert_system)
        app.logger.info("🚀 Phase 3 Advanced Intelligence Mode Activated")
    else:
        app.logger.info("⚠️ Phase 3 services not fully available - some features may be limited")
    
    # Register blueprints in proper order
    # First register graph API (always register, with fallback handling)
    init_graph_services(graph_client, graph_service, social_service)
    app.register_blueprint(graph_bp, url_prefix='/api/graph')
    
    # Register other APIs with proper URL prefixes
    app.register_blueprint(wallet_bp)  # Wallet routes include their own prefixes
    app.register_blueprint(alert_api)  # Alert routes already have /api prefix
    app.register_blueprint(social_api)  # Social routes already have /api prefix  
    app.register_blueprint(phase3_bp)  # Phase 3 API (already has /api/v3 prefix)
    app.register_blueprint(public_api_bp)  # Public API (already has /api/v1 prefix)
    
    # Initialize alert services properly
    try:
        from app.api.alert_api import init_alert_services
        if graph_client and alert_system:
            init_alert_services(graph_client, alert_system)
            app.logger.info("✅ Alert services initialized")
    except Exception as e:
        app.logger.warning(f"⚠️ Alert services initialization failed: {str(e)}")
    # Log registered endpoints for debugging
    app.logger.info("✅ All API endpoints registered:")
    for rule in app.url_map.iter_rules():
        app.logger.info(f"  {', '.join(rule.methods)} {rule.rule}")
    
    app.logger.info("✅ Wallet API endpoints registered")
    app.logger.info("✅ Alert API endpoints registered") 
    app.logger.info("✅ Social Intelligence API endpoints registered")
    app.logger.info("✅ Phase 3 Advanced Intelligence API endpoints registered")
    app.logger.info("✅ Public API endpoints registered")
    
    if graph_client:
        app.logger.info("✅ PostgreSQL Graph connected - Enhanced graph analysis available")
    else:
        app.logger.info("⚠️ PostgreSQL Graph unavailable - Graph endpoints will return fallback responses")
    
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
                "postgres_graph": "available" if graph_client else "unavailable",
                "graph_protocol": "available" if graph_service else "unavailable", 
                "social_intelligence": "available" if social_service else "unavailable"
            },
            "analysis_mode": "enhanced" if graph_client else "standard",
            "features": {
                "wallet_analysis": True,
                "graph_visualization": bool(graph_client),
                "social_intelligence": bool(social_service),
                "historical_data": bool(graph_service),
                "investigation_canvas": bool(graph_client)
            }
        }
        
        # Database connectivity check
        if graph_client:
            try:
                stats = graph_client.get_graph_stats()
                status["database"] = {
                    "connected": True,
                    "node_count": stats.get('total_nodes', 0),
                    "relationship_count": stats.get('total_edges', 0)
                }
            except Exception as e:
                status["database"] = {
                    "connected": False,
                    "error": str(e)
                }
                status["services"]["postgres_graph"] = "error"
        
        return jsonify(status)
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information and available endpoints"""
        
        # Base endpoints always available
        endpoints = {
            "phase_1": {
                "wallet_analysis": "/api/v1/wallet/{address}",
                "wallet_test": "/api/v1/wallet/test",
                "wallet_rpc": "/wallet/{address}/rpc?chain={chain}",
                "wallet_hybrid": "/wallet/{address}/hybrid?source={api|rpc|hybrid}",
                "rpc_chains": "/wallet/rpc/chains",
                "data_sources_status": "/wallet/data-sources/status",
                "description": "Comprehensive wallet analysis with API, RPC, and Hybrid support"
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
            },
            "social_intelligence": {
                "analyze_address": "/api/social/{address}",
                "platform_stats": "/api/social/platform-stats",
                "description": "Social media intelligence and reputation analysis"
            },
            "public_api": {
                "health_check": "/api/v1/health",
                "wallet_analysis": "/api/v1/wallet/{address}/analysis",
                "wallet_risk": "/api/v1/wallet/{address}/risk",
                "api_usage": "/api/v1/usage",
                "documentation": "/api/v1/docs",
                "description": "Public API with authentication required"
            }
        }
        
        # Add Phase 2 endpoints if graph client is available
        if graph_client:
            endpoints["phase_2"] = {
                "enhanced_analysis": "/api/v1/wallet/{address}",
                "graph_subgraph": "/api/graph/subgraph/{address}",
                "import_data": "/api/graph/import-address-data/{address}",
                "database_stats": "/api/graph/database-stats",
                "transaction_path": "/api/graph/transaction-path",
                "high_risk_cluster": "/api/graph/high-risk-cluster",
                "description": "Enhanced analysis with graph database and social intelligence"
            }
        
        # Add Phase 3 endpoints if advanced services are available
        if network_analyzer and alert_system:
            endpoints["phase_3"] = {
                "gnn_analysis": "/api/v3/gnn/{address}",
                "intelligence_analysis": "/api/v3/intelligence/{address}",
                "multichain_analysis": "/api/v3/multichain/{address}",
                "description": "Advanced AI-powered analysis with GNN and multichain support"
            }
        
        return jsonify({
            "name": "Sentinel Threat Intelligence API",
            "version": "2.0",
            "description": "Next-generation blockchain threat intelligence platform",
            "phase": "enhanced" if graph_client else "standard",
            "mode": "Phase 3 Advanced" if (network_analyzer and alert_system) else ("Phase 2 Enhanced" if graph_client else "Phase 1 Basic"),
            "endpoints": endpoints,
            "documentation": "/docs",
            "health": "/health",
            "total_endpoints": sum(len(v) - 1 if 'description' in v else len(v) for v in endpoints.values()) + 2  # +2 for health and docs
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
        if graph_client:
            try:
                graph_client.close()
            except:
                pass
    
    return app 

if __name__ == '__main__':
    # Create and run the application
    app = create_app()
    
    # Development server configuration
    debug_mode = os.environ.get('FLASK_ENV') == 'development' or os.environ.get('DEBUG', 'False').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🌐 Running on http://localhost:{port}")
    print(f"🔧 Debug mode: {debug_mode}")
    print(f"📊 Health check: http://localhost:{port}/health")
    print(f"📋 API info: http://localhost:{port}/api/info")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    ) 
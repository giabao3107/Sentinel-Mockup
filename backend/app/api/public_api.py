"""
Sentinel Public API - External API Access with Authentication and Rate Limiting
Provides programmatic access to Sentinel's threat intelligence capabilities
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
import hashlib
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

from ..utils.helpers import is_valid_ethereum_address

logger = logging.getLogger(__name__)

# Create blueprint for public API
public_api_bp = Blueprint('public_api', __name__, url_prefix='/api/v1')

class APIKeyManager:
    """Manage API keys and authentication"""
    
    def __init__(self):
        # In production, this would be stored in database
        self.api_keys = {}
        self.api_key_stats = {}
    
    def generate_api_key(self, user_id: str, plan: str = "basic") -> str:
        """Generate a new API key for a user"""
        
        # Generate secure API key
        api_key = f"sk-{secrets.token_urlsafe(32)}"
        api_key_hash = generate_password_hash(api_key)
        
        # Store API key metadata
        self.api_keys[api_key_hash] = {
            'user_id': user_id,
            'plan': plan,
            'created_at': datetime.now(),
            'last_used': None,
            'is_active': True,
            'rate_limits': self._get_plan_limits(plan)
        }
        
        # Initialize usage statistics
        self.api_key_stats[api_key_hash] = {
            'total_requests': 0,
            'requests_today': 0,
            'last_request_date': datetime.now().date()
        }
        
        logger.info(f"Generated API key for user {user_id} with plan {plan}")
        return api_key
    
    def _get_plan_limits(self, plan: str) -> Dict[str, int]:
        """Get rate limits for different plans"""
        
        limits = {
            'basic': {
                'requests_per_minute': 10,
                'requests_per_hour': 100,
                'requests_per_day': 1000
            },
            'pro': {
                'requests_per_minute': 50,
                'requests_per_hour': 1000,
                'requests_per_day': 10000
            },
            'enterprise': {
                'requests_per_minute': 200,
                'requests_per_hour': 5000,
                'requests_per_day': 50000
            }
        }
        
        return limits.get(plan, limits['basic'])
    
    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key and return user information"""
        
        if not api_key or not api_key.startswith('sk-'):
            return None
        
        # Check against stored API keys
        for stored_hash, metadata in self.api_keys.items():
            if check_password_hash(stored_hash, api_key):
                if metadata['is_active']:
                    # Update usage statistics
                    self._update_usage_stats(stored_hash)
                    metadata['last_used'] = datetime.now()
                    return metadata
                else:
                    logger.warning(f"Inactive API key used: {api_key[:10]}...")
                    return None
        
        logger.warning(f"Invalid API key: {api_key[:10]}...")
        return None
    
    def _update_usage_stats(self, api_key_hash: str):
        """Update usage statistics for API key"""
        
        stats = self.api_key_stats.get(api_key_hash, {})
        today = datetime.now().date()
        
        # Reset daily counter if new day
        if stats.get('last_request_date') != today:
            stats['requests_today'] = 0
            stats['last_request_date'] = today
        
        stats['total_requests'] = stats.get('total_requests', 0) + 1
        stats['requests_today'] = stats.get('requests_today', 0) + 1
        
        self.api_key_stats[api_key_hash] = stats
    
    def check_rate_limits(self, api_key_hash: str, metadata: Dict[str, Any]) -> bool:
        """Check if API key has exceeded rate limits"""
        
        stats = self.api_key_stats.get(api_key_hash, {})
        limits = metadata['rate_limits']
        
        # Check daily limit
        if stats.get('requests_today', 0) >= limits['requests_per_day']:
            return False
        
        return True

# Initialize API key manager
api_key_manager = APIKeyManager()

def require_api_key(f):
    """Decorator to require valid API key for endpoint access"""
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get API key from header
        api_key = request.headers.get('X-API-Key') or request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not api_key:
            return jsonify({
                'error': 'API key required',
                'message': 'Please provide API key in X-API-Key header or Authorization Bearer token'
            }), 401
        
        # Validate API key
        key_metadata = api_key_manager.validate_api_key(api_key)
        
        if not key_metadata:
            return jsonify({
                'error': 'Invalid API key',
                'message': 'The provided API key is invalid or inactive'
            }), 401
        
        # Check rate limits
        api_key_hash = generate_password_hash(api_key)
        if not api_key_manager.check_rate_limits(api_key_hash, key_metadata):
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': 'API key has exceeded rate limits for today'
            }), 429
        
        # Add user info to request context
        request.api_user = key_metadata
        
        return f(*args, **kwargs)
    
    return decorated_function

@public_api_bp.route('/health', methods=['GET'])
def health_check():
    """Public health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat(),
        'services': {
            'api': True,
            'database': True
        }
    })

@public_api_bp.route('/wallet/<address>/analysis', methods=['GET'])
@require_api_key
def analyze_wallet_public(address):
    """
    Public API endpoint for wallet analysis
    
    GET /api/v1/wallet/{address}/analysis
    """
    
    try:
        # Validate address
        if not is_valid_ethereum_address(address):
            return jsonify({
                'error': 'Invalid address',
                'message': 'Please provide a valid Ethereum address'
            }), 400
        
        # Parse query parameters
        include_gnn = request.args.get('include_gnn', 'true').lower() == 'true'
        include_network = request.args.get('include_network', 'false').lower() == 'true'
        depth = min(int(request.args.get('depth', 1)), 3)  # Max depth of 3
        
        # Get basic wallet data
        from ..services.etherscan_service import EtherscanService
        etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
        
        # Get wallet information
        balance_data = etherscan_service.get_balance(address)
        transaction_data = etherscan_service.get_transactions(address, limit=100)
        
        # Initialize response
        response = {
            'address': address,
            'analysis_timestamp': datetime.now().isoformat(),
            'basic_info': {
                'balance_eth': balance_data['balance'] / 1e18,
                'transaction_count': len(transaction_data.get('transactions', [])),
                'first_seen': transaction_data.get('first_tx_date'),
                'last_activity': transaction_data.get('last_tx_date')
            },
            'api_version': '1.0.0',
            'user_plan': request.api_user['plan']
        }
        
        # Include GNN analysis if requested and available
        if include_gnn:
            try:
                from ..services.gnn_model import gnn_engine
                
                if gnn_engine.is_trained:
                    # Get graph data from Neo4j if available
                    graph_data = {}
                    neo4j_client = current_app.extensions.get('neo4j_client')
                    if neo4j_client:
                        graph_data = neo4j_client.get_address_analytics(address) or {}
                    
                    gnn_prediction = gnn_engine.predict_single_wallet(
                        address, 
                        graph_data, 
                        transaction_data.get('transactions', [])
                    )
                    
                    response['gnn_analysis'] = {
                        'risk_score': gnn_prediction['risk_score'],
                        'risk_level': gnn_prediction['risk_level'],
                        'predicted_class': gnn_prediction['predicted_class'],
                        'confidence': gnn_prediction['confidence_level'],
                        'behavioral_tags': gnn_prediction['behavioral_tags'],
                        'model_version': gnn_prediction['model_version']
                    }
                else:
                    response['gnn_analysis'] = {'error': 'GNN model not available'}
            except Exception as e:
                logger.error(f"GNN analysis failed for {address}: {str(e)}")
                response['gnn_analysis'] = {'error': 'GNN analysis temporarily unavailable'}
        
        # Include network analysis if requested (Pro/Enterprise only)
        if include_network:
            if request.api_user['plan'] in ['pro', 'enterprise']:
                try:
                    from ..services.network_behavior_analyzer import NetworkBehaviorAnalyzer
                    network_analyzer = NetworkBehaviorAnalyzer(current_app.extensions.get('neo4j_client'))
                    cluster_analysis = network_analyzer.analyze_network_clusters(
                        center_address=address,
                        max_depth=depth
                    )
                    
                    response['network_analysis'] = {
                        'cluster_info': cluster_analysis.get('clusters', []),
                        'network_metrics': cluster_analysis.get('network_metrics', {}),
                        'galaxy_view_available': len(cluster_analysis.get('clusters', [])) > 0
                    }
                except Exception as e:
                    logger.error(f"Network analysis failed for {address}: {str(e)}")
                    response['network_analysis'] = {'error': 'Network analysis temporarily unavailable'}
            else:
                response['network_analysis'] = {
                    'error': 'Network analysis requires Pro or Enterprise plan',
                    'upgrade_url': '/api/v1/upgrade'
                }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Public API error for address {address}: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while analyzing the address'
        }), 500

@public_api_bp.route('/wallet/<address>/risk', methods=['GET'])
@require_api_key
def get_wallet_risk_public(address):
    """
    Public API endpoint for quick risk assessment
    
    GET /api/v1/wallet/{address}/risk
    """
    
    try:
        # Validate address
        if not is_valid_ethereum_address(address):
            return jsonify({
                'error': 'Invalid address',
                'message': 'Please provide a valid Ethereum address'
            }), 400
        
        # Get quick risk assessment
        from ..services.etherscan_service import EtherscanService
        from ..services.risk_scorer import RiskScorer
        
        etherscan_service = EtherscanService(current_app.config['ETHERSCAN_API_KEY'])
        risk_scorer = RiskScorer()
        
        # Get minimal data for risk scoring
        balance_data = etherscan_service.get_balance(address)
        transaction_data = etherscan_service.get_transactions(address, limit=50)
        
        # Calculate risk score
        risk_analysis = risk_scorer.calculate_risk_score(
            address=address,
            transactions=transaction_data['transactions'],
            balance=balance_data['balance']
        )
        
        response = {
            'address': address,
            'risk_assessment': {
                'risk_score': risk_analysis['risk_score'],
                'risk_level': risk_analysis['risk_level'],
                'risk_factors': risk_analysis['risk_factors'],
                'behavioral_tags': risk_analysis['behavioral_tags']
            },
            'analysis_timestamp': datetime.now().isoformat(),
            'analysis_method': 'heuristic'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Risk API error for address {address}: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while assessing risk'
        }), 500

@public_api_bp.route('/alerts', methods=['POST'])
@require_api_key
def create_alert_rule():
    """
    Public API endpoint to create alert rules
    
    POST /api/v1/alerts
    """
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Invalid request',
                'message': 'Request body must contain JSON data'
            }), 400
        
        # Validate required fields
        required_fields = ['name', 'rule_type', 'conditions']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': 'Missing required field',
                    'message': f'Field "{field}" is required'
                }), 400
        
        # Add user ID from API key
        data['user_id'] = request.api_user['user_id']
        
        # Create alert rule
        from ..services.alert_system import SentinelAlertSystem
        alert_system = SentinelAlertSystem(
            current_app.extensions.get('neo4j_client'),
            current_app.config
        )
        
        rule_id = alert_system.create_alert_rule(data)
        
        return jsonify({
            'success': True,
            'rule_id': rule_id,
            'message': 'Alert rule created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Create alert API error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while creating the alert rule'
        }), 500

@public_api_bp.route('/usage', methods=['GET'])
@require_api_key
def get_api_usage():
    """
    Get API usage statistics for the authenticated user
    
    GET /api/v1/usage
    """
    
    try:
        user_id = request.api_user['user_id']
        usage_stats = api_key_manager.get_usage_stats(user_id)
        
        # Add plan information
        plan_info = {
            'current_plan': request.api_user['plan'],
            'rate_limits': request.api_user['rate_limits']
        }
        
        return jsonify({
            'user_id': user_id,
            'usage_statistics': usage_stats,
            'plan_information': plan_info,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Usage API error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'An error occurred while retrieving usage statistics'
        }), 500

@public_api_bp.route('/docs', methods=['GET'])
def api_documentation():
    """API documentation endpoint"""
    
    docs = {
        'title': 'Sentinel Threat Intelligence API',
        'version': '1.0.0',
        'description': 'Proactive blockchain threat intelligence and risk assessment API',
        'authentication': {
            'type': 'API Key',
            'header': 'X-API-Key or Authorization: Bearer {api_key}',
            'how_to_get': 'Contact support or visit dashboard to generate API keys'
        },
        'rate_limits': {
            'basic': '10 req/min, 100 req/hour, 1000 req/day',
            'pro': '50 req/min, 1000 req/hour, 10000 req/day',
            'enterprise': '200 req/min, 5000 req/hour, 50000 req/day'
        },
        'endpoints': {
            'GET /api/v1/health': 'Health check (no auth required)',
            'GET /api/v1/wallet/{address}/analysis': 'Complete wallet analysis',
            'GET /api/v1/wallet/{address}/risk': 'Quick risk assessment',
            'POST /api/v1/alerts': 'Create alert rules',
            'GET /api/v1/usage': 'API usage statistics',
            'GET /api/v1/docs': 'This documentation'
        },
        'support': {
            'email': 'api-support@sentinel.com',
            'docs_url': 'https://docs.sentinel.com/api',
            'status_page': 'https://status.sentinel.com'
        }
    }
    
    return jsonify(docs), 200

# Error handlers for the public API
@public_api_bp.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'You have exceeded the rate limit for your API key',
        'retry_after': getattr(error, 'retry_after', 60)
    }), 429

@public_api_bp.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500
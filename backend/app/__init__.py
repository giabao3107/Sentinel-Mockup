"""
Sentinel Backend - Flask Application Factory
"""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

def create_app():
    """Create and configure the Flask application"""
    
    # Load environment variables
    load_dotenv()
    
    # Create Flask instance
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['ETHERSCAN_API_KEY'] = os.environ.get('ETHERSCAN_API_KEY')
    app.config['CHAINALYSIS_API_KEY'] = os.environ.get('CHAINALYSIS_API_KEY')
    
    # Enable CORS for frontend communication
    CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])
    
    # Register blueprints
    from app.api import wallet_bp
    app.register_blueprint(wallet_bp, url_prefix='/api/v1')
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'sentinel-backend'}, 200
    
    # Root endpoint
    @app.route('/')
    def root():
        return {
            'service': 'Sentinel Backend',
            'version': '1.0.0-mvp',
            'phase': 'MVP - Proof of Concept',
            'endpoints': {
                'health': '/health',
                'wallet_analysis': '/api/v1/wallet/<address>',
                'docs': 'https://github.com/giabao3107/Sentinel_Mockup.git'
            }
        }, 200
    
    return app 
"""
Sentinel Backend Configuration

To use this application, create a .env file in the backend directory with:

FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
PORT=5000
ETHERSCAN_API_KEY=your-etherscan-api-key-here
CHAINALYSIS_API_KEY=your-chainalysis-api-key-here
DEBUG=True
"""

import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    ETHERSCAN_API_KEY = os.environ.get('ETHERSCAN_API_KEY') or 'YourApiKeyToken'
    CHAINALYSIS_API_KEY = os.environ.get('CHAINALYSIS_API_KEY') or ''

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 
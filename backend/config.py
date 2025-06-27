"""
Sentinel Backend Configuration

To use this application, create a .env file in the backend directory with:

FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=postgresql://sentinel:sentinel_password@localhost:5432/sentinel
REDIS_URL=redis://localhost:6379/0
ETHERSCAN_API_KEY=your-etherscan-api-key-here
PORT=5000
DEBUG=True

See env.template and SETUP_ENV.md for complete configuration guide.
"""

import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database Configuration
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'postgresql://sentinel:sentinel_password@localhost:5432/sentinel'
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # API Keys
    ETHERSCAN_API_KEY = os.environ.get('ETHERSCAN_API_KEY') or 'YourApiKeyToken'
    CHAINALYSIS_API_KEY = os.environ.get('CHAINALYSIS_API_KEY') or ''
    
    # Graph Analysis Settings
    MAX_GRAPH_DEPTH = int(os.environ.get('MAX_GRAPH_DEPTH', 5))
    MAX_GRAPH_NODES = int(os.environ.get('MAX_GRAPH_NODES', 1000))
    GRAPH_CACHE_TTL = int(os.environ.get('GRAPH_CACHE_TTL', 3600))
    
    # CORS Settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE = int(os.environ.get('RATE_LIMIT_PER_MINUTE', 100))
    RATE_LIMIT_PER_HOUR = int(os.environ.get('RATE_LIMIT_PER_HOUR', 1000))

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    FLASK_ENV = 'development'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    FLASK_ENV = 'production'
    
    # Override CORS for production
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://sentinel-frontend.vercel.app').split(',')
    
    # Production database settings
    if os.environ.get('DATABASE_URL'):
        DATABASE_URL = os.environ.get('DATABASE_URL')
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 
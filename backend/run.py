#!/usr/bin/env python3
"""
Sentinel Backend - Flask Application Entry Point
Phase 2 Enhanced Version with Neo4j Support
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import from app.py (Phase 2 Enhanced) - direct file import
import app as app_module

# Create Flask application from app.py (not app/__init__.py)
app = app_module.create_app()

if __name__ == '__main__':
    # Development server configuration
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    port = int(os.environ.get('PORT', 5000))
    
    print("🛡️  Sentinel Backend Starting...")
    print("🚀 Phase 2 Enhanced Version with Neo4j Support")
    print(f"🌐 Running on http://localhost:{port}")
    print(f"🔧 Debug mode: {debug_mode}")
    print("📊 Health check: http://localhost:5000/health")
    print("📋 API info: http://localhost:5000/api/info")
    print("💾 Neo4j Enhanced Analysis Available")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug_mode
    ) 
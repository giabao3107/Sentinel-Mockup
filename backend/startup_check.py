#!/usr/bin/env python3
"""
Startup check script for Sentinel Backend
Verifies all components are working before deployment
"""

import sys
import os
from dotenv import load_dotenv

def check_imports():
    """Check if all required modules can be imported"""
    print("🔍 Checking imports...")
    
    try:
        from app import create_app
        print("✅ Main app import successful")
    except Exception as e:
        print(f"❌ Main app import failed: {e}")
        return False
    
    try:
        from app.api.wallet import wallet_bp
        from app.api.alert_api import alert_api
        from app.api.social_api import social_api
        from app.api.phase3_api import phase3_bp
        from app.api.public_api import public_api_bp
        from app.api.graph import graph_bp
        print("✅ All API blueprints import successful")
    except Exception as e:
        print(f"❌ API blueprint import failed: {e}")
        return False
    
    try:
        from app.services.etherscan_service import EtherscanService
        from app.services.risk_scorer import RiskScorer
        print("✅ Core services import successful")
    except Exception as e:
        print(f"❌ Core services import failed: {e}")
        return False
    
    return True

def check_config():
    """Check configuration"""
    print("\n🔧 Checking configuration...")
    
    load_dotenv()
    
    api_key = os.getenv('ETHERSCAN_API_KEY')
    if api_key and api_key != 'YourApiKeyToken':
        print("✅ Etherscan API key configured")
    else:
        print("⚠️ Etherscan API key not configured (will use mock data)")
    
    return True

def check_services():
    """Check if services can be initialized"""
    print("\n🛠️ Checking services...")
    
    try:
        from app.services.etherscan_service import EtherscanService
        service = EtherscanService()
        print("✅ EtherscanService initialized")
    except Exception as e:
        print(f"❌ EtherscanService failed: {e}")
        return False
    
    try:
        from app.services.risk_scorer import RiskScorer
        scorer = RiskScorer()
        print("✅ RiskScorer initialized")
    except Exception as e:
        print(f"❌ RiskScorer failed: {e}")
        return False
    
    return True

def check_app_creation():
    """Check if Flask app can be created"""
    print("\n🚀 Checking app creation...")
    
    try:
        from app import create_app
        app = create_app()
        
        # Check routes
        routes = list(app.url_map.iter_rules())
        print(f"✅ Flask app created with {len(routes)} routes")
        
        # Show some key routes
        key_routes = [rule for rule in routes if any(keyword in rule.rule for keyword in ['/health', '/api/v1/wallet', '/api/info'])]
        if key_routes:
            print("✅ Key routes found:")
            for route in key_routes[:5]:  # Show first 5
                print(f"   {route.rule}")
        
        return True
    except Exception as e:
        print(f"❌ App creation failed: {e}")
        return False

def main():
    """Run all checks"""
    print("=== SENTINEL BACKEND STARTUP CHECK ===\n")
    
    checks = [
        ("Import Check", check_imports),
        ("Configuration Check", check_config), 
        ("Services Check", check_services),
        ("App Creation Check", check_app_creation),
    ]
    
    passed = 0
    total = len(checks)
    
    for name, check_func in checks:
        try:
            result = check_func()
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ {name} failed with exception: {e}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Passed: {passed}/{total} checks")
    
    if passed == total:
        print("🎉 All checks passed! Backend is ready to start.")
        return 0
    else:
        print("⚠️ Some checks failed. Please fix issues before starting.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
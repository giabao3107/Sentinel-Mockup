#!/usr/bin/env python3
"""
Simple script to check routes
"""

from app import create_app

def main():
    print("=== CHECKING ROUTES ===")
    app = create_app()
    
    print(f"Total routes: {len(list(app.url_map.iter_rules()))}")
    print("\nRoutes:")
    
    for rule in app.url_map.iter_rules():
        methods = ', '.join(rule.methods)
        print(f"  {methods:20} {rule.rule}")

if __name__ == "__main__":
    main() 
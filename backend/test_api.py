#!/usr/bin/env python3
"""
Simple API test script
Tests key endpoints manually
"""

import requests
import json
import time

def test_endpoint(url, method="GET", data=None, timeout=10):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, timeout=timeout)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=timeout)
        
        return {
            "status": "success",
            "status_code": response.status_code,
            "content": response.text[:200] + "..." if len(response.text) > 200 else response.text
        }
    except requests.exceptions.ConnectionError:
        return {"status": "connection_error", "message": "Backend not running"}
    except requests.exceptions.Timeout:
        return {"status": "timeout", "message": f"Request timed out after {timeout}s"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def main():
    base_url = "http://localhost:5000"
    test_address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    
    print("=== SENTINEL API TESTS ===\n")
    
    tests = [
        # Basic endpoints
        ("Health Check", f"{base_url}/health"),
        ("API Info", f"{base_url}/api/info"),
        
        # Wallet endpoints
        ("Wallet Analysis", f"{base_url}/api/v1/wallet/{test_address}"),
        ("Simple Wallet", f"{base_url}/api/v1/wallet/{test_address}/simple"),
        ("RPC Wallet", f"{base_url}/wallet/{test_address}/rpc"),
        ("Risk Only", f"{base_url}/wallet/{test_address}/risk-only"),
        
        # Alert endpoints
        ("Alert Rules", f"{base_url}/api/alerts/rules"),
        ("Alert Stats", f"{base_url}/api/alerts/stats"),
        
        # Social endpoints
        ("Social Analysis", f"{base_url}/api/social/{test_address}"),
        ("Platform Stats", f"{base_url}/api/social/platform-stats"),
    ]
    
    results = []
    
    for name, url in tests:
        print(f"Testing {name}...")
        result = test_endpoint(url)
        results.append((name, result))
        
        if result["status"] == "success":
            if result["status_code"] == 200:
                print(f"  ✅ {name}: OK")
            else:
                print(f"  ⚠️ {name}: HTTP {result['status_code']}")
        else:
            print(f"  ❌ {name}: {result['message']}")
        
        time.sleep(0.5)  # Small delay between requests
    
    # Summary
    print(f"\n=== SUMMARY ===")
    success_count = sum(1 for _, result in results if result["status"] == "success" and result["status_code"] == 200)
    total_count = len(results)
    
    print(f"Successful: {success_count}/{total_count}")
    
    # Show failures
    failures = [(name, result) for name, result in results if not (result["status"] == "success" and result["status_code"] == 200)]
    if failures:
        print("\nFailed tests:")
        for name, result in failures:
            status_code = result.get("status_code", "unknown")
            message = result.get("message", f"HTTP {status_code}")
            print(f"  - {name}: {message}")

if __name__ == "__main__":
    main() 
#!/usr/bin/env python3
"""
Simple script to import sample wallet data into Sentinel database
"""

import asyncio
import aiohttp
import json
from datetime import datetime

# Sample addresses for quick testing
SAMPLE_ADDRESSES = [
    # High-profile addresses
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",  # vitalik.eth
    "0x220866B1A2219f40e72f5c628B65D54268cA3A9D",  # Binance Hot Wallet
    
    # DeFi protocols
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",  # Uniswap V3
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap V2
    
    # Testing addresses
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",  # Test high-risk
    "0x1111111111111111111111111111111111111111",  # Test suspicious
]

async def import_address(session, address, base_url="http://localhost:5000"):
    """Import a single address"""
    url = f"{base_url}/api/graph/import-address-data/{address}"
    
    try:
        async with session.post(url, json={"limit": 500}) as response:
            result = await response.json()
            
            if response.status == 200 and result.get('status') == 'success':
                data = result.get('data', {})
                print(f"✅ {address[:8]}...{address[-6:]}: "
                      f"{data.get('imported_addresses', 0)} addresses, "
                      f"{data.get('imported_transactions', 0)} transactions")
                return True
            else:
                print(f"❌ {address[:8]}...{address[-6:]}: {result.get('message', 'Failed')}")
                return False
                
    except Exception as e:
        print(f"❌ {address[:8]}...{address[-6:]}: Error - {str(e)}")
        return False

async def main():
    print("🚀 Importing sample wallet data into Sentinel database...")
    print("📊 This will add diverse wallet types for graph analysis testing")
    print()
    
    success_count = 0
    total_count = len(SAMPLE_ADDRESSES)
    
    async with aiohttp.ClientSession() as session:
        for i, address in enumerate(SAMPLE_ADDRESSES, 1):
            print(f"[{i}/{total_count}] Importing {address[:8]}...{address[-6:]}")
            
            success = await import_address(session, address)
            if success:
                success_count += 1
            
            # Small delay between requests
            if i < total_count:
                await asyncio.sleep(1)
    
    print()
    print("="*50)
    print(f"📈 Import completed: {success_count}/{total_count} successful")
    print(f"🎯 Success rate: {(success_count/total_count*100):.1f}%")
    print()
    print("💡 Next steps:")
    print("1. Visit http://localhost:3000/graph")
    print("2. Try analyzing the imported addresses")
    print("3. Explore network connections and risk patterns")

if __name__ == "__main__":
    asyncio.run(main()) 
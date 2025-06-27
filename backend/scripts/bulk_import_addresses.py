#!/usr/bin/env python3
"""
Bulk Address Import Script for Sentinel
Import multiple wallet addresses with transaction data into PostgreSQL Graph database
"""

import asyncio
import aiohttp
import json
import time
from typing import List, Dict
import argparse
from datetime import datetime

# Popular DeFi addresses for testing
POPULAR_ADDRESSES = [
    # DEX Addresses
    "0xE592427A0AEce92De3Edee1F18E0157C05861564",  # Uniswap V3 SwapRouter
    "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",  # Uniswap V3 SwapRouter02
    "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",  # Uniswap V2 Router
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",  # DAI Token
    "0xA0b86a33E6417aF5E73Ca0e0b17F03A0d6291F38",  # Cream Finance
    
    # High Activity Wallets
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",  # vitalik.eth
    "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",  # Vitalik Buterin
    "0x220866B1A2219f40e72f5c628B65D54268cA3A9D",  # Binance Hot Wallet 8
    "0x28C6c06298d514Db089934071355E5743bf21d60",  # Binance Hot Wallet 14
    "0x21a31Ee1afC51d94C2eFcCAa2092AD1028285549",  # Binance Hot Wallet 15
    
    # DeFi Power Users
    "0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503",  # DeFi Pulse Index
    "0x06601571AA9D3E8f5f7CDd5b993192618964bAB5",  # Multiple DeFi protocols
    "0x8Eb8a3b98659Cce290402893d0123abb75E3ab28",  # Enzyme Finance
    "0x4F4495243837681061C4743b74B3eEdf548D56A5",  # IOSG Ventures
    "0x9696f59E4d72E237BE84fFD425DCaD154Bf96976",  # DeFi Alliance
    
    # MEV/Arbitrage Bots
    "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",  # MEV Bot
    "0xee2826453A4Fd5AfeB7ceffeEF3fFA2320081268",  # Flashloan Arbitrage
    "0x000000000000084e91743124a982076C59f10084",  # MEV Searcher
    
    # NFT Traders
    "0x6F1cDbBb4d53d226CF4B917bF768B94acbAB6168",  # NFT Whale
    "0x54BE3a794282C030b15E43aE2bB182E14c409C5e",  # OpenSea User
    "0xB64d0b0b1C7aFaa8E4b6A19e8E1D4659F7b6B88f",  # SuperRare Collector
    
    # Protocol Treasuries
    "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",  # Compound cDAI
    "0x028171bCA77440897B824Ca71D1c56caC55b68A3",  # Aave aDAI
    "0x39AA39c021dfbaE8faC545936693aC917d5E7563",  # Compound cUSDC
    
    # Lending Protocol Power Users
    "0x3dfd23A6c5E8BbcFc9581d2E864a68feb6a076d3",  # Aave User
    "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",  # AAVE Token
    "0x85Eee30c52B0b379b046Fb0F85F4f3Dc3009aFEC",  # Keep Network
]

SCAM_ADDRESSES = [
    # Known scam addresses for testing risk detection
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",  # Test high-risk
    "0x1111111111111111111111111111111111111111",  # Test suspicious
    "0x2222222222222222222222222222222222222222",  # Test medium risk
]

class BulkImporter:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = None
        self.imported_count = 0
        self.failed_count = 0
        self.results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def import_single_address(self, address: str, limit: int = 1000) -> Dict:
        """Import data for a single address"""
        url = f"{self.base_url}/api/graph/import-address-data/{address}"
        
        try:
            async with self.session.post(url, json={"limit": limit}) as response:
                result = await response.json()
                
                if response.status == 200 and result.get('status') == 'success':
                    self.imported_count += 1
                    imported_data = result.get('data', {})
                    print(f"✅ {address}: {imported_data.get('imported_addresses', 0)} addresses, "
                          f"{imported_data.get('imported_transactions', 0)} transactions")
                    
                    return {
                        "address": address,
                        "status": "success",
                        "imported_addresses": imported_data.get('imported_addresses', 0),
                        "imported_transactions": imported_data.get('imported_transactions', 0),
                        "imported_relationships": imported_data.get('imported_relationships', 0)
                    }
                else:
                    self.failed_count += 1
                    error_msg = result.get('message', 'Unknown error')
                    print(f"❌ {address}: {error_msg}")
                    
                    return {
                        "address": address,
                        "status": "failed", 
                        "error": error_msg
                    }
                    
        except Exception as e:
            self.failed_count += 1
            print(f"❌ {address}: Exception - {str(e)}")
            return {
                "address": address,
                "status": "error",
                "error": str(e)
            }
    
    async def import_addresses_batch(self, addresses: List[str], batch_size: int = 5, 
                                   delay: float = 2.0, limit_per_address: int = 1000):
        """Import addresses in batches to avoid overwhelming the API"""
        
        print(f"🚀 Starting bulk import of {len(addresses)} addresses...")
        print(f"📊 Batch size: {batch_size}, Delay: {delay}s, Limit per address: {limit_per_address}")
        
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(addresses) + batch_size - 1) // batch_size
            
            print(f"\n📦 Processing batch {batch_num}/{total_batches}: {len(batch)} addresses")
            
            # Process batch concurrently
            tasks = [self.import_single_address(addr, limit_per_address) for addr in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle exceptions
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    self.failed_count += 1
                    error_result = {
                        "address": batch[j],
                        "status": "exception",
                        "error": str(result)
                    }
                    self.results.append(error_result)
                    print(f"❌ {batch[j]}: Exception - {str(result)}")
                else:
                    self.results.append(result)
            
            # Wait between batches
            if i + batch_size < len(addresses):
                print(f"⏳ Waiting {delay}s before next batch...")
                await asyncio.sleep(delay)
        
        print(f"\n🎉 Import completed!")
        print(f"✅ Successfully imported: {self.imported_count}")
        print(f"❌ Failed imports: {self.failed_count}")
        
        return self.results
    
    def generate_report(self, output_file: str = None):
        """Generate import report"""
        report = {
            "import_summary": {
                "total_addresses": len(self.results),
                "successful_imports": self.imported_count,
                "failed_imports": self.failed_count,
                "success_rate": f"{(self.imported_count / len(self.results) * 100):.1f}%" if self.results else "0%",
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": self.results,
            "statistics": {
                "total_new_addresses": sum(r.get('imported_addresses', 0) for r in self.results),
                "total_transactions": sum(r.get('imported_transactions', 0) for r in self.results),
                "total_relationships": sum(r.get('imported_relationships', 0) for r in self.results)
            }
        }
        
        if output_file:
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"📊 Report saved to: {output_file}")
        
        return report

async def main():
    parser = argparse.ArgumentParser(description='Bulk import wallet addresses into Sentinel database')
    parser.add_argument('--addresses', nargs='+', help='List of addresses to import')
    parser.add_argument('--file', help='File containing addresses (one per line)')
    parser.add_argument('--popular', action='store_true', help='Import popular DeFi addresses')
    parser.add_argument('--scam', action='store_true', help='Import known scam addresses for testing')
    parser.add_argument('--all', action='store_true', help='Import all predefined addresses')
    parser.add_argument('--limit', type=int, default=1000, help='Transaction limit per address')
    parser.add_argument('--batch-size', type=int, default=5, help='Batch size for concurrent imports')
    parser.add_argument('--delay', type=float, default=2.0, help='Delay between batches (seconds)')
    parser.add_argument('--output', help='Output file for import report')
    parser.add_argument('--base-url', default='http://localhost:5000', help='Backend API base URL')
    
    args = parser.parse_args()
    
    # Collect addresses to import
    addresses_to_import = []
    
    if args.addresses:
        addresses_to_import.extend(args.addresses)
    
    if args.file:
        try:
            with open(args.file, 'r') as f:
                file_addresses = [line.strip() for line in f if line.strip()]
                addresses_to_import.extend(file_addresses)
        except FileNotFoundError:
            print(f"❌ Address file not found: {args.file}")
            return
    
    if args.popular or args.all:
        addresses_to_import.extend(POPULAR_ADDRESSES)
    
    if args.scam or args.all:
        addresses_to_import.extend(SCAM_ADDRESSES)
    
    if not addresses_to_import:
        print("❌ No addresses specified. Use --help for options.")
        return
    
    # Remove duplicates while preserving order
    unique_addresses = list(dict.fromkeys(addresses_to_import))
    
    print(f"🎯 Found {len(unique_addresses)} unique addresses to import")
    
    # Start import process
    async with BulkImporter(args.base_url) as importer:
        results = await importer.import_addresses_batch(
            unique_addresses,
            batch_size=args.batch_size,
            delay=args.delay,
            limit_per_address=args.limit
        )
        
        # Generate report
        report = importer.generate_report(args.output)
        
        # Print summary
        print("\n" + "="*50)
        print("📈 IMPORT SUMMARY")
        print("="*50)
        print(f"Total addresses processed: {report['import_summary']['total_addresses']}")
        print(f"Successful imports: {report['import_summary']['successful_imports']}")
        print(f"Failed imports: {report['import_summary']['failed_imports']}")
        print(f"Success rate: {report['import_summary']['success_rate']}")
        print(f"Total new addresses in DB: {report['statistics']['total_new_addresses']}")
        print(f"Total transactions imported: {report['statistics']['total_transactions']}")
        print(f"Total relationships created: {report['statistics']['total_relationships']}")

if __name__ == "__main__":
    asyncio.run(main()) 
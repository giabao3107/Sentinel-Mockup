#!/usr/bin/env python3
"""
Generate synthetic test data for Sentinel database
Creates realistic-looking wallet addresses and transactions for testing
"""

import asyncio
import aiohttp
import json
import random
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict

def generate_ethereum_address() -> str:
    """Generate a random but valid-looking Ethereum address"""
    # Generate 20 random bytes and convert to hex
    random_bytes = bytes([random.randint(0, 255) for _ in range(20)])
    address = "0x" + random_bytes.hex()
    return address

def create_test_wallet_profile(wallet_type: str) -> Dict:
    """Create a test wallet profile with realistic characteristics"""
    profiles = {
        "whale": {
            "transaction_count": random.randint(1000, 5000),
            "risk_score": random.randint(10, 30),
            "balance": random.uniform(100, 10000),
            "activity_pattern": "high_volume"
        },
        "defi_user": {
            "transaction_count": random.randint(100, 1000),
            "risk_score": random.randint(20, 50),
            "balance": random.uniform(10, 500),
            "activity_pattern": "protocol_interaction"
        },
        "normal_user": {
            "transaction_count": random.randint(10, 100),
            "risk_score": random.randint(0, 20),
            "balance": random.uniform(0.1, 50),
            "activity_pattern": "regular_usage"
        },
        "suspicious": {
            "transaction_count": random.randint(500, 2000),
            "risk_score": random.randint(60, 85),
            "balance": random.uniform(1, 100),
            "activity_pattern": "rapid_transfers"
        },
        "high_risk": {
            "transaction_count": random.randint(200, 1000),
            "risk_score": random.randint(80, 95),
            "balance": random.uniform(0.1, 20),
            "activity_pattern": "suspicious_patterns"
        }
    }
    
    return profiles.get(wallet_type, profiles["normal_user"])

class TestDataGenerator:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.session = None
        self.generated_addresses = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_synthetic_address_data(self, address: str, profile: Dict) -> Dict:
        """Create synthetic transaction data for an address"""
        
        # Generate connected addresses
        connected_addresses = [generate_ethereum_address() for _ in range(random.randint(5, 20))]
        
        # Generate transactions
        transactions = []
        for i in range(profile['transaction_count']):
            tx = {
                "hash": f"0x{hashlib.sha256(f'{address}_{i}'.encode()).hexdigest()}",
                "from": address if random.random() > 0.5 else random.choice(connected_addresses),
                "to": random.choice(connected_addresses) if random.random() > 0.5 else address,
                "value": random.uniform(0.001, profile['balance'] * 0.1),
                "timestamp": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
                "block_number": random.randint(18000000, 19000000),
                "gas_used": random.randint(21000, 200000)
            }
            transactions.append(tx)
        
        return {
            "address": address,
            "profile": profile,
            "connected_addresses": connected_addresses,
            "transactions": transactions,
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "data_source": "synthetic",
                "test_category": profile.get('activity_pattern', 'unknown')
            }
        }
    
    async def inject_test_data_via_api(self, address_data: Dict) -> bool:
        """Inject test data using the import API endpoint"""
        
        # Simulate the format expected by the import API
        mock_graph_data = {
            "limit": len(address_data['transactions']),
            "synthetic": True,
            "test_data": address_data
        }
        
        url = f"{self.base_url}/api/graph/import-address-data/{address_data['address']}"
        
        try:
            async with self.session.post(url, json=mock_graph_data) as response:
                result = await response.json()
                
                if response.status == 200:
                    print(f"✅ Injected data for {address_data['address'][:8]}... "
                          f"({address_data['profile']['activity_pattern']})")
                    return True
                else:
                    print(f"❌ Failed to inject data for {address_data['address'][:8]}...: "
                          f"{result.get('message', 'Unknown error')}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error injecting data for {address_data['address'][:8]}...: {str(e)}")
            return False
    
    async def generate_wallet_network(self, count_per_type: Dict[str, int]) -> List[Dict]:
        """Generate a network of interconnected test wallets"""
        
        print("🎲 Generating synthetic wallet network...")
        
        all_addresses = []
        
        for wallet_type, count in count_per_type.items():
            print(f"📊 Creating {count} {wallet_type} wallets...")
            
            for i in range(count):
                address = generate_ethereum_address()
                profile = create_test_wallet_profile(wallet_type)
                
                address_data = await self.create_synthetic_address_data(address, profile)
                all_addresses.append(address_data)
                
                # Store for later reference
                self.generated_addresses.append({
                    "address": address,
                    "type": wallet_type,
                    "risk_score": profile['risk_score']
                })
        
        return all_addresses
    
    async def inject_all_test_data(self, address_data_list: List[Dict]) -> Dict:
        """Inject all test data into the database"""
        
        print(f"\n🚀 Injecting {len(address_data_list)} test addresses...")
        
        success_count = 0
        failed_count = 0
        
        for i, address_data in enumerate(address_data_list, 1):
            print(f"[{i}/{len(address_data_list)}] Processing {address_data['address'][:8]}...")
            
            success = await self.inject_test_data_via_api(address_data)
            if success:
                success_count += 1
            else:
                failed_count += 1
            
            # Small delay between injections
            await asyncio.sleep(0.5)
        
        return {
            "total": len(address_data_list),
            "successful": success_count,
            "failed": failed_count,
            "success_rate": f"{(success_count / len(address_data_list) * 100):.1f}%"
        }
    
    def save_generated_addresses(self, filename: str = "generated_test_addresses.json"):
        """Save the list of generated addresses for future reference"""
        
        report = {
            "generation_timestamp": datetime.now().isoformat(),
            "total_addresses": len(self.generated_addresses),
            "addresses": self.generated_addresses,
            "summary": {
                wallet_type: len([a for a in self.generated_addresses if a['type'] == wallet_type])
                for wallet_type in set(a['type'] for a in self.generated_addresses)
            }
        }
        
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📄 Generated addresses saved to: {filename}")
        return report

async def main():
    print("🧪 Sentinel Test Data Generator")
    print("="*50)
    
    # Define how many of each wallet type to generate
    wallet_counts = {
        "whale": 3,
        "defi_user": 8,
        "normal_user": 15,
        "suspicious": 5,
        "high_risk": 3
    }
    
    async with TestDataGenerator() as generator:
        # Generate wallet network
        address_data_list = await generator.generate_wallet_network(wallet_counts)
        
        # Inject into database
        results = await generator.inject_all_test_data(address_data_list)
        
        # Save reference
        report = generator.save_generated_addresses()
        
        # Print summary
        print("\n" + "="*50)
        print("📈 TEST DATA GENERATION SUMMARY")
        print("="*50)
        print(f"Total test addresses created: {results['total']}")
        print(f"Successfully injected: {results['successful']}")
        print(f"Failed injections: {results['failed']}")
        print(f"Success rate: {results['success_rate']}")
        print()
        print("📊 Wallet type distribution:")
        for wallet_type, count in report['summary'].items():
            print(f"  {wallet_type}: {count} wallets")
        print()
        print("💡 Next steps:")
        print("1. Visit http://localhost:3000/graph")
        print("2. Analyze the generated test addresses")
        print("3. Explore different risk patterns and network structures")

if __name__ == "__main__":
    asyncio.run(main()) 
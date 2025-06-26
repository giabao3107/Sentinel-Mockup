"""
Sentinel Risk Scorer - Heuristic-based Risk Assessment Engine
"""

import re
from datetime import datetime, timedelta
from typing import Dict, List
from collections import Counter

class RiskScorer:
    """Heuristic-based risk scoring engine for wallet analysis"""
    
    def __init__(self):
        # Known risky address patterns (simplified for MVP)
        self.known_mixers = [
            '0x8ba1f109551bD432803012645Hac136c22C0A3A8',  # Example mixer
            '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291'   # Another example
        ]
        
        # Known exchange addresses (lower risk)
        self.known_exchanges = [
            '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',  # Binance
            '0xD551234Ae421e3BCBA99A0Da6d736074f22192FF',  # Another exchange
        ]
        
        # Suspicious method IDs (common scam patterns)
        self.suspicious_methods = [
            '0xa9059cbb',  # transfer
            '0x095ea7b3',  # approve
            '0x23b872dd'   # transferFrom
        ]
    
    def calculate_risk_score(self, address: str, transactions: List[Dict], balance: int) -> Dict:
        """
        Calculate comprehensive risk score for a wallet address
        
        Args:
            address: Wallet address to analyze
            transactions: List of transaction dictionaries
            balance: Current balance in Wei
            
        Returns:
            Dictionary containing risk assessment data
        """
        
        risk_factors = []
        behavioral_tags = []
        base_score = 0
        
        # Basic wallet analysis
        tx_count = len(transactions)
        
        # Factor 1: Transaction Volume Analysis
        if tx_count > 1000:
            risk_factors.append("Very high transaction volume (>1000)")
            base_score += 15
            behavioral_tags.append("High Volume Trader")
        elif tx_count > 500:
            risk_factors.append("High transaction volume (>500)")
            base_score += 10
            behavioral_tags.append("Active Trader")
        elif tx_count < 5:
            risk_factors.append("Very low transaction volume (<5)")
            base_score += 5
            behavioral_tags.append("New Wallet")
        
        # Factor 2: Balance Analysis
        balance_ether = balance / 10**18
        if balance_ether > 1000:
            behavioral_tags.append("Large Balance Holder")
        elif balance_ether > 100:
            behavioral_tags.append("Medium Balance Holder")
        elif balance_ether < 0.01:
            risk_factors.append("Very low balance")
            base_score += 5
            behavioral_tags.append("Dust Wallet")
        
        # Factor 3: Transaction Pattern Analysis
        if transactions:
            # Analyze recent activity (last 30 days)
            recent_txs = self._get_recent_transactions(transactions, days=30)
            
            if len(recent_txs) > 100:
                risk_factors.append("High recent activity (>100 tx in 30 days)")
                base_score += 10
                behavioral_tags.append("Very Active")
            
            # Analyze transaction timing patterns
            timing_risk = self._analyze_timing_patterns(recent_txs)
            base_score += timing_risk['score']
            risk_factors.extend(timing_risk['factors'])
            behavioral_tags.extend(timing_risk['tags'])
            
            # Analyze interaction patterns
            interaction_risk = self._analyze_interactions(transactions)
            base_score += interaction_risk['score']
            risk_factors.extend(interaction_risk['factors'])
            behavioral_tags.extend(interaction_risk['tags'])
            
            # Analyze transaction values
            value_risk = self._analyze_transaction_values(transactions)
            base_score += value_risk['score']
            risk_factors.extend(value_risk['factors'])
            behavioral_tags.extend(value_risk['tags'])
        
        # Factor 4: Address Pattern Analysis
        address_risk = self._analyze_address_patterns(address)
        base_score += address_risk['score']
        risk_factors.extend(address_risk['factors'])
        behavioral_tags.extend(address_risk['tags'])
        
        # Normalize score to 0-100 scale
        risk_score = min(100, max(0, base_score))
        
        # Determine risk level
        if risk_score >= 80:
            risk_level = "CRITICAL"
        elif risk_score >= 60:
            risk_level = "HIGH"
        elif risk_score >= 40:
            risk_level = "MEDIUM"
        elif risk_score >= 20:
            risk_level = "LOW"
        else:
            risk_level = "MINIMAL"
        
        # Remove duplicate behavioral tags
        behavioral_tags = list(set(behavioral_tags))
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'behavioral_tags': behavioral_tags,
            'analysis_details': {
                'total_transactions': tx_count,
                'balance_ether': balance_ether,
                'assessment_timestamp': datetime.now().isoformat()
            }
        }
    
    def _get_recent_transactions(self, transactions: List[Dict], days: int = 30) -> List[Dict]:
        """Filter transactions from the last N days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_txs = []
        
        for tx in transactions:
            try:
                tx_date = datetime.fromisoformat(tx['timestamp'].replace('Z', '+00:00'))
                if tx_date >= cutoff_date:
                    recent_txs.append(tx)
            except:
                continue  # Skip invalid timestamps
                
        return recent_txs
    
    def _analyze_timing_patterns(self, transactions: List[Dict]) -> Dict:
        """Analyze transaction timing patterns for suspicious behavior"""
        score = 0
        factors = []
        tags = []
        
        if len(transactions) < 2:
            return {'score': score, 'factors': factors, 'tags': tags}
        
        # Calculate time intervals between transactions
        intervals = []
        for i in range(1, len(transactions)):
            try:
                prev_time = datetime.fromisoformat(transactions[i-1]['timestamp'].replace('Z', '+00:00'))
                curr_time = datetime.fromisoformat(transactions[i]['timestamp'].replace('Z', '+00:00'))
                interval = abs((prev_time - curr_time).total_seconds() / 60)  # Minutes
                intervals.append(interval)
            except:
                continue
        
        if intervals:
            avg_interval = sum(intervals) / len(intervals)
            
            # Very regular intervals (potential bot)
            regular_intervals = sum(1 for i in intervals if abs(i - avg_interval) < avg_interval * 0.1)
            if regular_intervals > len(intervals) * 0.8:
                factors.append("Highly regular transaction timing (potential bot)")
                score += 20
                tags.append("Potential Bot")
            
            # Very fast transactions (flash loan or MEV)
            fast_intervals = sum(1 for i in intervals if i < 1)  # Less than 1 minute
            if fast_intervals > 5:
                factors.append("Multiple rapid transactions (<1 min apart)")
                score += 15
                tags.append("MEV Bot")
        
        return {'score': score, 'factors': factors, 'tags': tags}
    
    def _analyze_interactions(self, transactions: List[Dict]) -> Dict:
        """Analyze address interactions for suspicious patterns"""
        score = 0
        factors = []
        tags = []
        
        # Count unique addresses interacted with
        to_addresses = [tx['to'] for tx in transactions if tx.get('to')]
        from_addresses = [tx['from'] for tx in transactions if tx.get('from')]
        
        unique_interactions = len(set(to_addresses + from_addresses))
        
        # Check for interactions with known risky addresses
        for addr in to_addresses + from_addresses:
            if addr.lower() in [mixer.lower() for mixer in self.known_mixers]:
                factors.append(f"Interaction with known mixer: {addr[:10]}...")
                score += 30
                tags.append("Mixer Interaction")
        
        # Check for interactions with exchanges (typically lower risk)
        for addr in to_addresses + from_addresses:
            if addr.lower() in [ex.lower() for ex in self.known_exchanges]:
                tags.append("Exchange User")
                score -= 5  # Slightly reduce risk
        
        # Analyze address diversity
        if len(transactions) > 10:
            interaction_ratio = unique_interactions / len(transactions)
            if interaction_ratio < 0.1:
                factors.append("Low address diversity (potential circular activity)")
                score += 15
                tags.append("Limited Interactions")
        
        # Check for contract interactions
        contract_interactions = sum(1 for tx in transactions if tx.get('method_id') and tx['method_id'] != '0x')
        if contract_interactions > len(transactions) * 0.8:
            tags.append("DeFi Power User")
        
        return {'score': score, 'factors': factors, 'tags': tags}
    
    def _analyze_transaction_values(self, transactions: List[Dict]) -> Dict:
        """Analyze transaction value patterns"""
        score = 0
        factors = []
        tags = []
        
        if not transactions:
            return {'score': score, 'factors': factors, 'tags': tags}
        
        values = [tx['value_wei'] for tx in transactions if tx.get('value_wei', 0) > 0]
        
        if values:
            total_value = sum(values)
            avg_value = total_value / len(values)
            max_value = max(values)
            
            # Very large transactions
            if max_value > 100 * 10**18:  # > 100 ETH
                factors.append("Very large transaction (>100 ETH)")
                score += 10
                tags.append("Whale Activity")
            
            # Many small dust transactions
            dust_txs = sum(1 for v in values if v < 0.001 * 10**18)  # < 0.001 ETH
            if dust_txs > len(values) * 0.5:
                factors.append("Many dust transactions")
                score += 10
                tags.append("Dust Activity")
            
            # Round number transactions (potential automation)
            round_numbers = sum(1 for v in values if v % (10**18) == 0)  # Exact ETH amounts
            if round_numbers > len(values) * 0.7:
                factors.append("Many round-number transactions")
                score += 8
                tags.append("Automated Activity")
        
        return {'score': score, 'factors': factors, 'tags': tags}
    
    def _analyze_address_patterns(self, address: str) -> Dict:
        """Analyze the address itself for suspicious patterns"""
        score = 0
        factors = []
        tags = []
        
        # Convert to lowercase for analysis
        addr_lower = address.lower()
        
        # Check for vanity address patterns
        if re.match(r'^0x[0]{8,}', addr_lower):
            factors.append("Vanity address with leading zeros")
            score += 5
            tags.append("Vanity Address")
        
        if re.match(r'^0x[a-f0-9]*[0]{8,}$', addr_lower):
            factors.append("Vanity address with trailing zeros")
            score += 5
            tags.append("Vanity Address")
        
        # Check for repeating patterns
        hex_part = addr_lower[2:]  # Remove '0x' prefix
        for i in range(2, 8):  # Check for repeating 2-7 character patterns
            pattern = hex_part[:i]
            if hex_part == pattern * (len(hex_part) // i) + pattern[:len(hex_part) % i]:
                factors.append(f"Address contains repeating pattern: {pattern}")
                score += 8
                tags.append("Patterned Address")
                break
        
        # Check if address looks like a contract (this is a simplified heuristic)
        if addr_lower.startswith('0x0') or addr_lower.endswith('000'):
            tags.append("Potential Contract")
        
        return {'score': score, 'factors': factors, 'tags': tags} 
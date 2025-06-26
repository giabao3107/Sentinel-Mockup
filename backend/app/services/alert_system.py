"""
Sentinel Alert System - User-defined Alerts and Monitoring
Proactive monitoring system with custom triggers and multiple notification channels
"""

import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, asdict
from enum import Enum
from collections import defaultdict

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(Enum):
    ACTIVE = "active"
    TRIGGERED = "triggered"
    PAUSED = "paused"
    DISABLED = "disabled"

class NotificationChannel(Enum):
    EMAIL = "email"
    TELEGRAM = "telegram"
    WEBHOOK = "webhook"
    DISCORD = "discord"

@dataclass
class AlertRule:
    """Data class for alert rule configuration"""
    id: str
    name: str
    description: str
    user_id: str
    target_addresses: List[str]
    rule_type: str
    conditions: Dict[str, Any]
    severity: AlertSeverity
    notification_channels: List[NotificationChannel]
    status: AlertStatus
    created_at: datetime
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0
    cooldown_minutes: int = 60
    metadata: Dict[str, Any] = None

@dataclass
class AlertEvent:
    """Data class for alert event"""
    id: str
    rule_id: str
    address: str
    event_type: str
    severity: AlertSeverity
    message: str
    data: Dict[str, Any]
    timestamp: datetime
    notification_sent: bool = False

class AlertSystem:
    """
    Advanced alert system for proactive blockchain monitoring
    Supports custom triggers, multiple notification channels, and intelligent filtering
    """
    
    def __init__(self, neo4j_client=None, config: Dict[str, Any] = None):
        self.neo4j = neo4j_client
        self.config = config or {}
        
        # Alert storage (in production, this would be in database)
        self.alert_rules: Dict[str, AlertRule] = {}
        self.alert_events: List[AlertEvent] = []
        
        # Rule type handlers
        self.rule_handlers = {
            'risk_score_threshold': self._check_risk_score_threshold,
            'large_transaction': self._check_large_transaction,
            'new_connection': self._check_new_connection,
            'suspicious_pattern': self._check_suspicious_pattern,
            'mixer_interaction': self._check_mixer_interaction,
            'rapid_transactions': self._check_rapid_transactions,
            'balance_threshold': self._check_balance_threshold,
            'whitelist_violation': self._check_whitelist_violation,
            'blacklist_interaction': self._check_blacklist_interaction
        }
    
    def create_alert_rule(self, rule_data: Dict[str, Any]) -> str:
        """Create a new alert rule"""
        
        rule_id = f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.alert_rules)}"
        
        alert_rule = AlertRule(
            id=rule_id,
            name=rule_data['name'],
            description=rule_data.get('description', ''),
            user_id=rule_data['user_id'],
            target_addresses=rule_data.get('target_addresses', []),
            rule_type=rule_data['rule_type'],
            conditions=rule_data['conditions'],
            severity=AlertSeverity(rule_data.get('severity', 'medium')),
            notification_channels=[NotificationChannel(ch) for ch in rule_data.get('notification_channels', ['email'])],
            status=AlertStatus.ACTIVE,
            created_at=datetime.now(),
            cooldown_minutes=rule_data.get('cooldown_minutes', 60),
            metadata=rule_data.get('metadata', {})
        )
        
        self.alert_rules[rule_id] = alert_rule
        logger.info(f"Created alert rule: {rule_id} - {alert_rule.name}")
        return rule_id
    
    def monitor_address(self, address: str, transaction_data: Dict[str, Any]) -> List[AlertEvent]:
        """Monitor an address against all applicable alert rules"""
        
        triggered_events = []
        
        # Find all applicable rules for this address
        applicable_rules = [
            rule for rule in self.alert_rules.values()
            if (rule.status == AlertStatus.ACTIVE and 
                (not rule.target_addresses or address in rule.target_addresses))
        ]
        
        for rule in applicable_rules:
            # Check cooldown period
            if (rule.last_triggered and 
                datetime.now() - rule.last_triggered < timedelta(minutes=rule.cooldown_minutes)):
                continue
            
            # Check rule condition
            if rule.rule_type in self.rule_handlers:
                handler = self.rule_handlers[rule.rule_type]
                
                try:
                    triggered = handler(address, transaction_data, rule.conditions)
                    
                    if triggered:
                        event = self._create_alert_event(rule, address, transaction_data, triggered)
                        triggered_events.append(event)
                        
                        # Update rule statistics
                        rule.last_triggered = datetime.now()
                        rule.trigger_count += 1
                        
                except Exception as e:
                    logger.error(f"Error checking rule {rule.id}: {str(e)}")
        
        return triggered_events
    
    def _create_alert_event(self, rule: AlertRule, address: str, 
                           transaction_data: Dict[str, Any], trigger_details: Dict[str, Any]) -> AlertEvent:
        """Create an alert event from a triggered rule"""
        
        event_id = f"event_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{len(self.alert_events)}"
        
        message = f"🚨 SENTINEL ALERT: {rule.name}\n"
        message += f"Address: {address}\n"
        message += f"Severity: {rule.severity.value.upper()}\n"
        
        if rule.rule_type == 'risk_score_threshold':
            score = trigger_details.get('current_score', 0)
            threshold = trigger_details.get('threshold', 0)
            message += f"Risk score ({score}) exceeded threshold ({threshold})"
            
        elif rule.rule_type == 'large_transaction':
            value = trigger_details.get('transaction_value', 0)
            threshold = trigger_details.get('threshold', 0)
            message += f"Large transaction detected: {value:.4f} ETH (threshold: {threshold} ETH)"
        
        event = AlertEvent(
            id=event_id,
            rule_id=rule.id,
            address=address,
            event_type=rule.rule_type,
            severity=rule.severity,
            message=message,
            data={
                'trigger_details': trigger_details,
                'transaction_data': transaction_data,
                'rule_conditions': rule.conditions
            },
            timestamp=datetime.now()
        )
        
        self.alert_events.append(event)
        return event
    
    def _check_risk_score_threshold(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check if risk score exceeds threshold"""
        
        threshold = conditions.get('threshold', 80)
        current_score = data.get('risk_score', 0)
        
        if current_score >= threshold:
            return {
                'current_score': current_score,
                'threshold': threshold,
                'exceeded_by': current_score - threshold
            }
        
        return None
    
    def _check_large_transaction(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for large transactions"""
        
        threshold_eth = conditions.get('threshold_eth', 10)
        transactions = data.get('recent_transactions', [])
        
        for tx in transactions:
            value_eth = tx.get('value_wei', 0) / 1e18
            if value_eth >= threshold_eth:
                return {
                    'transaction_value': value_eth,
                    'threshold': threshold_eth,
                    'transaction_hash': tx.get('hash', ''),
                    'to_address': tx.get('to', '')
                }
        
        return None
    
    def _check_new_connection(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for new connections to the address"""
        
        max_age_hours = conditions.get('max_age_hours', 24)
        transactions = data.get('recent_transactions', [])
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        new_connections = set()
        
        for tx in transactions:
            try:
                tx_time = datetime.fromisoformat(tx.get('timestamp', '').replace('Z', '+00:00'))
                if tx_time >= cutoff_time:
                    if tx.get('from', '').lower() != address.lower():
                        new_connections.add(tx.get('from', ''))
                    if tx.get('to', '').lower() != address.lower():
                        new_connections.add(tx.get('to', ''))
            except:
                continue
        
        if new_connections:
            return {
                'new_connections': list(new_connections),
                'connection_count': len(new_connections),
                'time_window_hours': max_age_hours
            }
        
        return None
    
    def _check_suspicious_pattern(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for suspicious transaction patterns"""
        
        pattern_type = conditions.get('pattern_type', 'rapid_small_transactions')
        
        if pattern_type == 'rapid_small_transactions':
            time_window_minutes = conditions.get('time_window_minutes', 30)
            min_count = conditions.get('min_transaction_count', 10)
            max_value_eth = conditions.get('max_value_eth', 0.1)
            
            transactions = data.get('recent_transactions', [])
            cutoff_time = datetime.now() - timedelta(minutes=time_window_minutes)
            
            rapid_small_txs = []
            for tx in transactions:
                try:
                    tx_time = datetime.fromisoformat(tx.get('timestamp', '').replace('Z', '+00:00'))
                    value_eth = tx.get('value_wei', 0) / 1e18
                    
                    if tx_time >= cutoff_time and value_eth <= max_value_eth:
                        rapid_small_txs.append(tx)
                except:
                    continue
            
            if len(rapid_small_txs) >= min_count:
                return {
                    'pattern_type': pattern_type,
                    'transaction_count': len(rapid_small_txs),
                    'time_window_minutes': time_window_minutes,
                    'total_value_eth': sum(tx.get('value_wei', 0) for tx in rapid_small_txs) / 1e18
                }
        
        return None
    
    def _check_mixer_interaction(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for interactions with known mixers"""
        
        known_mixers = conditions.get('mixer_addresses', [
            '0x8ba1f109551bD432803012645Hac136c22C0A3A8',  # Example mixer
        ])
        
        transactions = data.get('recent_transactions', [])
        
        for tx in transactions:
            to_addr = tx.get('to', '').lower()
            from_addr = tx.get('from', '').lower()
            
            for mixer in known_mixers:
                if to_addr == mixer.lower() or from_addr == mixer.lower():
                    return {
                        'mixer_address': mixer,
                        'transaction_hash': tx.get('hash', ''),
                        'interaction_type': 'sent_to' if to_addr == mixer.lower() else 'received_from'
                    }
        
        return None
    
    def _check_rapid_transactions(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for rapid transaction sequences"""
        
        time_window_minutes = conditions.get('time_window_minutes', 5)
        min_count = conditions.get('min_transaction_count', 5)
        
        transactions = data.get('recent_transactions', [])
        cutoff_time = datetime.now() - timedelta(minutes=time_window_minutes)
        
        recent_txs = []
        for tx in transactions:
            try:
                tx_time = datetime.fromisoformat(tx.get('timestamp', '').replace('Z', '+00:00'))
                if tx_time >= cutoff_time:
                    recent_txs.append(tx)
            except:
                continue
        
        if len(recent_txs) >= min_count:
            return {
                'transaction_count': len(recent_txs),
                'time_window_minutes': time_window_minutes,
                'average_interval_seconds': time_window_minutes * 60 / len(recent_txs)
            }
        
        return None
    
    def _check_balance_threshold(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check if balance crosses threshold"""
        
        threshold_eth = conditions.get('threshold_eth', 100)
        condition_type = conditions.get('condition', 'above')  # above, below
        
        current_balance_eth = data.get('balance_wei', 0) / 1e18
        
        if condition_type == 'above' and current_balance_eth >= threshold_eth:
            return {
                'current_balance_eth': current_balance_eth,
                'threshold_eth': threshold_eth,
                'condition': condition_type
            }
        elif condition_type == 'below' and current_balance_eth <= threshold_eth:
            return {
                'current_balance_eth': current_balance_eth,
                'threshold_eth': threshold_eth,
                'condition': condition_type
            }
        
        return None
    
    def _check_whitelist_violation(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for transactions to non-whitelisted addresses"""
        
        whitelist = conditions.get('whitelisted_addresses', [])
        transactions = data.get('recent_transactions', [])
        
        for tx in transactions:
            to_addr = tx.get('to', '').lower()
            if tx.get('from', '').lower() == address.lower():  # Outgoing transaction
                if to_addr not in [addr.lower() for addr in whitelist]:
                    return {
                        'recipient_address': tx.get('to', ''),
                        'transaction_hash': tx.get('hash', ''),
                        'value_eth': tx.get('value_wei', 0) / 1e18
                    }
        
        return None
    
    def _check_blacklist_interaction(self, address: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Check for interactions with blacklisted addresses"""
        
        blacklist = conditions.get('blacklisted_addresses', [])
        transactions = data.get('recent_transactions', [])
        
        for tx in transactions:
            to_addr = tx.get('to', '').lower()
            from_addr = tx.get('from', '').lower()
            
            for blacklisted in blacklist:
                if to_addr == blacklisted.lower() or from_addr == blacklisted.lower():
                    return {
                        'blacklisted_address': blacklisted,
                        'transaction_hash': tx.get('hash', ''),
                        'interaction_type': 'sent_to' if to_addr == blacklisted.lower() else 'received_from'
                    }
        
        return None 
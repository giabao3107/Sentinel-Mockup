"""
Alert System API Endpoints
Provides RESTful API for managing alert rules and events
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from ..services.alert_system import AlertSystem, AlertSeverity, AlertStatus, NotificationChannel
from ..database.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

# Create blueprint
alert_api = Blueprint('alert_api', __name__)

# Initialize AlertSystem (in production, use dependency injection)
neo4j_client = Neo4jClient()
alert_system = AlertSystem(neo4j_client)

@alert_api.route('/api/alerts/rules', methods=['GET'])
def get_alert_rules():
    """Get all alert rules for a user"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        # Filter rules by user_id (simplified for demo)
        rules = [
            {
                'id': rule.id,
                'name': rule.name,
                'description': rule.description,
                'rule_type': rule.rule_type,
                'severity': rule.severity.value,
                'status': rule.status.value,
                'target_addresses': rule.target_addresses,
                'notification_channels': [ch.value for ch in rule.notification_channels],
                'created_at': rule.created_at.isoformat(),
                'last_triggered': rule.last_triggered.isoformat() if rule.last_triggered else None,
                'trigger_count': rule.trigger_count,
                'conditions': rule.conditions,
                'cooldown_minutes': rule.cooldown_minutes
            }
            for rule in alert_system.alert_rules.values()
            if rule.user_id == user_id
        ]
        
        return jsonify({
            'success': True,
            'rules': rules,
            'total': len(rules)
        })
        
    except Exception as e:
        logger.error(f"Error fetching alert rules: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/rules', methods=['POST'])
def create_alert_rule():
    """Create a new alert rule"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'rule_type', 'conditions']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Set defaults
        rule_data = {
            'name': data['name'],
            'description': data.get('description', ''),
            'user_id': data.get('user_id', 'default_user'),
            'target_addresses': data.get('target_addresses', []),
            'rule_type': data['rule_type'],
            'conditions': data['conditions'],
            'severity': data.get('severity', 'medium'),
            'notification_channels': data.get('notification_channels', ['email']),
            'cooldown_minutes': data.get('cooldown_minutes', 60),
            'metadata': data.get('metadata', {})
        }
        
        # Create the alert rule
        rule_id = alert_system.create_alert_rule(rule_data)
        
        return jsonify({
            'success': True,
            'rule_id': rule_id,
            'message': 'Alert rule created successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating alert rule: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/rules/<rule_id>', methods=['PUT'])
def update_alert_rule(rule_id):
    """Update an existing alert rule"""
    try:
        data = request.get_json()
        
        if rule_id not in alert_system.alert_rules:
            return jsonify({
                'success': False,
                'error': 'Alert rule not found'
            }), 404
        
        rule = alert_system.alert_rules[rule_id]
        
        # Update fields
        if 'name' in data:
            rule.name = data['name']
        if 'description' in data:
            rule.description = data['description']
        if 'conditions' in data:
            rule.conditions = data['conditions']
        if 'severity' in data:
            rule.severity = AlertSeverity(data['severity'])
        if 'status' in data:
            rule.status = AlertStatus(data['status'])
        if 'notification_channels' in data:
            rule.notification_channels = [NotificationChannel(ch) for ch in data['notification_channels']]
        if 'target_addresses' in data:
            rule.target_addresses = data['target_addresses']
        if 'cooldown_minutes' in data:
            rule.cooldown_minutes = data['cooldown_minutes']
        
        return jsonify({
            'success': True,
            'message': 'Alert rule updated successfully'
        })
        
    except Exception as e:
        logger.error(f"Error updating alert rule: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/rules/<rule_id>', methods=['DELETE'])
def delete_alert_rule(rule_id):
    """Delete an alert rule"""
    try:
        if rule_id not in alert_system.alert_rules:
            return jsonify({
                'success': False,
                'error': 'Alert rule not found'
            }), 404
        
        del alert_system.alert_rules[rule_id]
        
        return jsonify({
            'success': True,
            'message': 'Alert rule deleted successfully'
        })
        
    except Exception as e:
        logger.error(f"Error deleting alert rule: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/rules/<rule_id>/toggle', methods=['POST'])
def toggle_alert_rule(rule_id):
    """Toggle alert rule status (active/paused)"""
    try:
        if rule_id not in alert_system.alert_rules:
            return jsonify({
                'success': False,
                'error': 'Alert rule not found'
            }), 404
        
        rule = alert_system.alert_rules[rule_id]
        
        # Toggle status
        if rule.status == AlertStatus.ACTIVE:
            rule.status = AlertStatus.PAUSED
        elif rule.status == AlertStatus.PAUSED:
            rule.status = AlertStatus.ACTIVE
        
        return jsonify({
            'success': True,
            'status': rule.status.value,
            'message': f'Alert rule {rule.status.value}'
        })
        
    except Exception as e:
        logger.error(f"Error toggling alert rule: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/events', methods=['GET'])
def get_alert_events():
    """Get recent alert events"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        limit = int(request.args.get('limit', 50))
        severity_filter = request.args.get('severity')
        
        # Get events for user's rules
        user_rules = [
            rule.id for rule in alert_system.alert_rules.values()
            if rule.user_id == user_id
        ]
        
        events = []
        for event in alert_system.alert_events[-limit:]:  # Get recent events
            if event.rule_id in user_rules:
                if severity_filter and event.severity.value != severity_filter:
                    continue
                    
                events.append({
                    'id': event.id,
                    'rule_id': event.rule_id,
                    'address': event.address,
                    'event_type': event.event_type,
                    'severity': event.severity.value,
                    'message': event.message,
                    'timestamp': event.timestamp.isoformat(),
                    'notification_sent': event.notification_sent,
                    'data': event.data
                })
        
        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'events': events,
            'total': len(events)
        })
        
    except Exception as e:
        logger.error(f"Error fetching alert events: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/monitor', methods=['POST'])
def monitor_address():
    """Monitor an address against alert rules"""
    try:
        data = request.get_json()
        
        if 'address' not in data:
            return jsonify({
                'success': False,
                'error': 'Address is required'
            }), 400
        
        address = data['address']
        transaction_data = data.get('transaction_data', {})
        
        # Monitor address
        triggered_events = alert_system.monitor_address(address, transaction_data)
        
        # Convert events to JSON
        events = []
        for event in triggered_events:
            events.append({
                'id': event.id,
                'rule_id': event.rule_id,
                'address': event.address,
                'event_type': event.event_type,
                'severity': event.severity.value,
                'message': event.message,
                'timestamp': event.timestamp.isoformat(),
                'notification_sent': event.notification_sent,
                'data': event.data
            })
        
        return jsonify({
            'success': True,
            'triggered_events': events,
            'event_count': len(events)
        })
        
    except Exception as e:
        logger.error(f"Error monitoring address: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/stats', methods=['GET'])
def get_alert_stats():
    """Get alert system statistics"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        
        # Get user's rules
        user_rules = [rule for rule in alert_system.alert_rules.values() if rule.user_id == user_id]
        
        # Calculate stats
        stats = {
            'total_rules': len(user_rules),
            'active_rules': len([r for r in user_rules if r.status == AlertStatus.ACTIVE]),
            'paused_rules': len([r for r in user_rules if r.status == AlertStatus.PAUSED]),
            'total_triggers': sum(r.trigger_count for r in user_rules),
            'addresses_monitored': len(set(addr for rule in user_rules for addr in rule.target_addresses if addr)),
            'rule_types': list(set(r.rule_type for r in user_rules)),
            'recent_events': len([e for e in alert_system.alert_events[-24:]])  # Last 24 events
        }
        
        # Severity breakdown
        severity_counts = {}
        for rule in user_rules:
            severity = rule.severity.value
            severity_counts[severity] = severity_counts.get(severity, 0) + 1
        stats['severity_breakdown'] = severity_counts
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error fetching alert stats: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@alert_api.route('/api/alerts/test', methods=['POST'])
def test_alert_rule():
    """Test an alert rule with sample data"""
    try:
        data = request.get_json()
        
        rule_id = data.get('rule_id')
        test_address = data.get('address', '0x742d35Cc6634C0532925a3b8D4e4FC4C8A59cFc5')
        
        if not rule_id or rule_id not in alert_system.alert_rules:
            return jsonify({
                'success': False,
                'error': 'Valid rule_id is required'
            }), 400
        
        # Create sample transaction data for testing
        sample_data = {
            'risk_score': 85,
            'balance_wei': 1000000000000000000,  # 1 ETH
            'recent_transactions': [
                {
                    'hash': '0x123...',
                    'from': test_address,
                    'to': '0x456...',
                    'value_wei': 500000000000000000,  # 0.5 ETH
                    'timestamp': datetime.now().isoformat()
                }
            ]
        }
        
        # Test the rule
        triggered_events = alert_system.monitor_address(test_address, sample_data)
        
        return jsonify({
            'success': True,
            'test_triggered': len(triggered_events) > 0,
            'events': [
                {
                    'id': e.id,
                    'message': e.message,
                    'severity': e.severity.value
                }
                for e in triggered_events
            ]
        })
        
    except Exception as e:
        logger.error(f"Error testing alert rule: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 
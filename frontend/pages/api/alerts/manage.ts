import { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for demo purposes (in production, use database)
let alertRules: any[] = [
  {
    id: 'alert_20241226_001',
    name: 'High Risk Address Monitor',
    description: 'Monitor addresses for high risk scores',
    rule_type: 'risk_score_threshold',
    severity: 'critical',
    status: 'active',
    target_addresses: ['0x742d35Cc6634C0532925a3b8D4e4FC4C8A59cFc5'],
    notification_channels: ['email', 'telegram'],
    created_at: '2024-12-25T10:30:00Z',
    last_triggered: '2024-12-26T08:15:00Z',
    trigger_count: 3,
    conditions: { threshold: 80 },
    cooldown_minutes: 60
  },
  {
    id: 'alert_20241226_002',
    name: 'Large Transaction Alert',
    description: 'Alert for transactions exceeding 100 ETH',
    rule_type: 'large_transaction',
    severity: 'high',
    status: 'active',
    target_addresses: [],
    notification_channels: ['email', 'discord'],
    created_at: '2024-12-24T15:20:00Z',
    last_triggered: '2024-12-25T14:30:00Z',
    trigger_count: 7,
    conditions: { threshold_eth: 100 },
    cooldown_minutes: 30
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action, rule_id } = req.query;

  try {
    // Try backend first for all operations
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    let backendSuccess = false;

    switch (req.method) {
      case 'POST':
        // Toggle rule status or perform other actions
        if (action === 'toggle' && rule_id) {
          try {
            const response = await fetch(`${backendUrl}/api/alerts/rules/${rule_id}/toggle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              return res.status(200).json(data);
            }
          } catch (error) {
            console.log('Backend toggle failed, using local toggle');
          }

          // Fallback: toggle locally
          const ruleIndex = alertRules.findIndex(r => r.id === rule_id);
          if (ruleIndex !== -1) {
            alertRules[ruleIndex].status = alertRules[ruleIndex].status === 'active' ? 'paused' : 'active';
            
            return res.status(200).json({
              success: true,
              status: alertRules[ruleIndex].status,
              message: `Alert rule ${alertRules[ruleIndex].status}`
            });
          } else {
            return res.status(404).json({
              success: false,
              error: 'Alert rule not found'
            });
          }
        }
        break;

      case 'PUT':
        // Update rule
        if (rule_id) {
          try {
            const response = await fetch(`${backendUrl}/api/alerts/rules/${rule_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(req.body)
            });
            
            if (response.ok) {
              const data = await response.json();
              return res.status(200).json(data);
            }
          } catch (error) {
            console.log('Backend update failed, using local update');
          }

          // Fallback: update locally
          const ruleIndex = alertRules.findIndex(r => r.id === rule_id);
          if (ruleIndex !== -1) {
            alertRules[ruleIndex] = { ...alertRules[ruleIndex], ...req.body };
            
            return res.status(200).json({
              success: true,
              rule: alertRules[ruleIndex],
              message: 'Alert rule updated successfully (mock mode)'
            });
          } else {
            return res.status(404).json({
              success: false,
              error: 'Alert rule not found'
            });
          }
        }
        break;

      case 'DELETE':
        // Delete rule
        if (rule_id) {
          try {
            const response = await fetch(`${backendUrl}/api/alerts/rules/${rule_id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
              const data = await response.json();
              return res.status(200).json(data);
            }
          } catch (error) {
            console.log('Backend delete failed, using local delete');
          }

          // Fallback: delete locally
          const ruleIndex = alertRules.findIndex(r => r.id === rule_id);
          if (ruleIndex !== -1) {
            alertRules.splice(ruleIndex, 1);
            
            return res.status(200).json({
              success: true,
              message: 'Alert rule deleted successfully (mock mode)'
            });
          } else {
            return res.status(404).json({
              success: false,
              error: 'Alert rule not found'
            });
          }
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters'
    });

  } catch (error) {
    console.error('Alert management error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 
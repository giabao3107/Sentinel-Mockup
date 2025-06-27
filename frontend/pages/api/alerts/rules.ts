import { NextApiRequest, NextApiResponse } from 'next';

// Mock alert rules data
const mockRules = [
  {
    id: 'rule_1',
    name: 'High Value Transaction Alert',
    description: 'Alert when transaction value exceeds 10 ETH',
    rule_type: 'transaction_value',
    severity: 'high',
    status: 'active',
    target_addresses: [],
    notification_channels: ['email'],
    created_at: new Date().toISOString(),
    last_triggered: null,
    trigger_count: 0,
    conditions: {
      value_threshold: 10,
      currency: 'ETH'
    },
    cooldown_minutes: 60
  },
  {
    id: 'rule_2',
    name: 'Suspicious Address Monitor',
    description: 'Monitor interactions with flagged addresses',
    rule_type: 'address_interaction',
    severity: 'critical',
    status: 'active',
    target_addresses: ['0x123...'],
    notification_channels: ['email', 'webhook'],
    created_at: new Date().toISOString(),
    last_triggered: new Date().toISOString(),
    trigger_count: 3,
    conditions: {
      flagged_addresses: ['0x123...']
    },
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

  try {
    // Try to proxy to the backend first
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    
    if (req.method === 'GET') {
      try {
        const response = await fetch(`${backendUrl}/api/alerts/rules`);
        if (response.ok) {
          const data = await response.json();
          return res.status(200).json(data);
        }
      } catch (error) {
        console.log('Backend unavailable, using mock data');
      }

      // Fallback to mock data
      return res.status(200).json({
        success: true,
        rules: mockRules,
        total: mockRules.length
      });
    }

    if (req.method === 'POST') {
      // Handle rule creation
      const newRule = {
        id: `rule_${Date.now()}`,
        ...req.body,
        created_at: new Date().toISOString(),
        last_triggered: null,
        trigger_count: 0
      };

      return res.status(201).json({
        success: true,
        rule_id: newRule.id,
        message: 'Alert rule created successfully (mock mode)'
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Alert rules API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 
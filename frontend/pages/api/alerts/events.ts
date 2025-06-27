import { NextApiRequest, NextApiResponse } from 'next';

// Mock alert events data
const mockEvents = [
  {
    id: 'event_1',
    rule_id: 'rule_1',
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    event_type: 'high_value_transaction',
    severity: 'high',
    message: 'High value transaction detected: 15.5 ETH',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    notification_sent: true,
    data: {
      transaction_hash: '0x123...',
      value_eth: 15.5,
      from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      to: '0x456...'
    }
  },
  {
    id: 'event_2',
    rule_id: 'rule_2',
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    event_type: 'suspicious_interaction',
    severity: 'critical',
    message: 'Interaction with flagged address detected',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    notification_sent: true,
    data: {
      transaction_hash: '0x456...',
      flagged_address: '0x123...',
      risk_score: 95
    }
  },
  {
    id: 'event_3',
    rule_id: 'rule_1',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    event_type: 'high_value_transaction',
    severity: 'high',
    message: 'High value transaction detected: 25.0 ETH',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    notification_sent: false,
    data: {
      transaction_hash: '0x789...',
      value_eth: 25.0,
      from: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      to: '0xabc...'
    }
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
        const response = await fetch(`${backendUrl}/api/alerts/events`);
        if (response.ok) {
          const data = await response.json();
          return res.status(200).json(data);
        }
      } catch (error) {
        console.log('Backend unavailable, using mock data');
      }

      // Fallback to mock data
      const { limit = '50', severity } = req.query;
      let filteredEvents = [...mockEvents];

      if (severity) {
        filteredEvents = filteredEvents.filter(event => event.severity === severity);
      }

      filteredEvents = filteredEvents.slice(0, parseInt(limit as string));

      return res.status(200).json({
        success: true,
        events: filteredEvents,
        total: filteredEvents.length
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Alert events API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 
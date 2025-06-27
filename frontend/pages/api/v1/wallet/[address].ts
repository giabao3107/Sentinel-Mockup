import { NextApiRequest, NextApiResponse } from 'next';

// Mock wallet data
const mockWalletData = {
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    balance: '2.5',
    balance_usd: 5125.75,
    first_seen: '2023-01-15T10:30:00Z',
    last_seen: '2024-01-10T14:22:00Z',
    transaction_count: 245,
    risk_score: 25,
    risk_level: 'LOW',
    labels: ['DeFi User', 'Active Trader'],
    recent_transactions: [
      {
        hash: '0x123abc...',
        from: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        to: '0x456def...',
        value: '0.5',
        timestamp: '2024-01-10T14:22:00Z',
        method: 'transfer'
      }
    ]
  },
  '0x28C6c06298d514Db089934071355E5743bf21d60': {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    balance: '15.8',
    balance_usd: 32456.80,
    first_seen: '2022-08-20T09:15:00Z',
    last_seen: '2024-01-09T11:45:00Z',
    transaction_count: 1567,
    risk_score: 45,
    risk_level: 'MEDIUM',
    labels: ['Exchange', 'High Volume'],
    recent_transactions: [
      {
        hash: '0x789ghi...',
        from: '0x28C6c06298d514Db089934071355E5743bf21d60',
        to: '0xabc123...',
        value: '2.3',
        timestamp: '2024-01-09T11:45:00Z',
        method: 'transferFrom'
      }
    ]
  },
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    balance: '0.0',
    balance_usd: 0,
    first_seen: null,
    last_seen: null,
    transaction_count: 0,
    risk_score: 0,
    risk_level: 'MINIMAL',
    labels: ['Unused Address'],
    recent_transactions: []
  }
};

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid address parameter is required'
      });
    }

    // Try to proxy to the backend first
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    
    try {
      const response = await fetch(`${backendUrl}/api/v1/wallet/${address}`);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (error) {
      console.log('Backend unavailable, using mock data');
    }

    // Fallback to mock data
    const walletData = mockWalletData[address as keyof typeof mockWalletData];
    
    if (walletData) {
      return res.status(200).json({
        success: true,
        data: walletData,
        analysis_mode: 'mock',
        message: 'Using mock data - backend unavailable'
      });
    } else {
      // Generate basic mock data for unknown addresses
      return res.status(200).json({
        success: true,
        data: {
          address: address,
          balance: '0.0',
          balance_usd: 0,
          first_seen: null,
          last_seen: null,
          transaction_count: 0,
          risk_score: 0,
          risk_level: 'MINIMAL',
          labels: ['Unknown Address'],
          recent_transactions: []
        },
        analysis_mode: 'mock',
        message: 'Using mock data - backend unavailable'
      });
    }
  } catch (error) {
    console.error('Wallet API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 
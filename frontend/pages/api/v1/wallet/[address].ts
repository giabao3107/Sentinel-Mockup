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
      // Transform mock data to match WalletAnalysisResponse structure
      const response = {
        address: walletData.address,
        analysis_timestamp: new Date().toISOString(),
        analysis_mode: 'basic' as const,
        wallet_info: {
          balance: {
            wei: (parseFloat(walletData.balance) * Math.pow(10, 18)).toString(),
            ether: parseFloat(walletData.balance),
            usd_value: walletData.balance_usd
          },
          transaction_count: walletData.transaction_count,
          token_count: 0,
          first_transaction: walletData.first_seen,
          last_transaction: walletData.last_seen
        },
        risk_assessment: {
          risk_score: walletData.risk_score,
          risk_level: walletData.risk_level as any,
          risk_factors: walletData.labels,
          behavioral_tags: walletData.labels,
          confidence: 'medium' as const
        },
        transactions: {
          recent: walletData.recent_transactions.map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value_wei: parseFloat(tx.value) * Math.pow(10, 18),
            value_ether: parseFloat(tx.value),
            timestamp: tx.timestamp,
            block_number: 0,
            gas_used: 21000,
            gas_price: 20000000000,
            transaction_fee: 0.00042,
            is_error: false,
            method_id: tx.method === 'transfer' ? '0xa9059cbb' : '0x'
          })),
          total_count: walletData.transaction_count,
          volume_stats: {
            total_sent_wei: 0,
            total_received_wei: 0,
            total_sent_ether: 0,
            total_received_ether: 0,
            net_balance_change_wei: 0,
            net_balance_change_ether: 0
          }
        },
        tokens: [],
        metadata: {
          data_sources: ['Mock Data'],
          analysis_engine: 'Sentinel Fallback',
          chain: 'ethereum',
          analysis_version: '2.0-mock',
          analysis_timestamp: new Date().toISOString()
        }
      };
      
      return res.status(200).json(response);
    } else {
      // Generate basic mock data for unknown addresses
      const response = {
        address: address,
        analysis_timestamp: new Date().toISOString(),
        analysis_mode: 'basic' as const,
        wallet_info: {
          balance: {
            wei: '0',
            ether: 0,
            usd_value: 0
          },
          transaction_count: 0,
          token_count: 0,
          first_transaction: null,
          last_transaction: null
        },
        risk_assessment: {
          risk_score: 0,
          risk_level: 'MINIMAL' as const,
          risk_factors: ['Unknown Address'],
          behavioral_tags: ['Unknown Address'],
          confidence: 'low' as const
        },
        transactions: {
          recent: [],
          total_count: 0,
          volume_stats: {
            total_sent_wei: 0,
            total_received_wei: 0,
            total_sent_ether: 0,
            total_received_ether: 0,
            net_balance_change_wei: 0,
            net_balance_change_ether: 0
          }
        },
        tokens: [],
        metadata: {
          data_sources: ['Mock Data'],
          analysis_engine: 'Sentinel Fallback',
          chain: 'ethereum',
          analysis_version: '2.0-mock',
          analysis_timestamp: new Date().toISOString()
        }
      };
      
      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('Wallet API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
} 
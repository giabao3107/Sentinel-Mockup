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
    console.log('Wallet API called with query:', req.query);
    const { address } = req.query;
    
    if (!address || typeof address !== 'string') {
      console.log('Invalid address parameter:', address);
      return res.status(400).json({
        success: false,
        error: 'Valid address parameter is required'
      });
    }
    
    console.log('Processing address:', address);

    // Try to proxy to the backend first (with timeout)
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${backendUrl}/api/v1/wallet/${address}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      } else {
        console.log(`Backend returned ${response.status}, using mock data`);
      }
    } catch (error) {
      console.log('Backend unavailable, using mock data:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback to mock data
    console.log('Using fallback mock data for address:', address);
    const walletData = mockWalletData[address as keyof typeof mockWalletData];
    console.log('Found wallet data:', walletData ? 'Yes' : 'No');
    
    if (walletData) {
      console.log('Transforming mock data to response structure');
      // Transform mock data to match WalletAnalysisResponse structure
      const response = {
        address: walletData.address,
        analysis_timestamp: new Date().toISOString(),
        analysis_mode: 'basic' as const,
        wallet_info: {
          balance: {
            wei: (parseFloat(walletData.balance) * 1000000000000000000).toString(), // 10^18
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
          recent: walletData.recent_transactions ? walletData.recent_transactions.map(tx => {
            try {
              return {
                hash: tx.hash || '',
                from: tx.from || '',
                to: tx.to || '',
                value_wei: Math.floor((parseFloat(tx.value || '0')) * 1000000000000000000), // 10^18
                value_ether: parseFloat(tx.value || '0'),
                timestamp: tx.timestamp || new Date().toISOString(),
                block_number: 0,
                gas_used: 21000,
                gas_price: 20000000000,
                transaction_fee: 0.00042,
                is_error: false,
                method_id: tx.method === 'transfer' ? '0xa9059cbb' : '0x'
              };
            } catch (txError) {
              console.error('Error processing transaction:', txError);
              return {
                hash: '',
                from: '',
                to: '',
                value_wei: 0,
                value_ether: 0,
                timestamp: new Date().toISOString(),
                block_number: 0,
                gas_used: 21000,
                gas_price: 20000000000,
                transaction_fee: 0.00042,
                is_error: false,
                method_id: '0x'
              };
            }
          }) : [],
          total_count: walletData.transaction_count || 0,
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
      
      console.log('Returning transformed response for known address');
      return res.status(200).json(response);
    } else {
      console.log('Generating basic mock data for unknown address');
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
      
      console.log('Returning basic mock response for unknown address');
      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('Wallet API error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return a basic fallback response even if everything fails
    try {
      const basicResponse = {
        address: req.query.address || 'unknown',
        analysis_timestamp: new Date().toISOString(),
        analysis_mode: 'basic' as const,
        wallet_info: {
          balance: { wei: '0', ether: 0, usd_value: 0 },
          transaction_count: 0,
          token_count: 0,
          first_transaction: null,
          last_transaction: null
        },
        risk_assessment: {
          risk_score: 0,
          risk_level: 'MINIMAL' as const,
          risk_factors: ['Error occurred'],
          behavioral_tags: [],
          confidence: 'low' as const
        },
        transactions: {
          recent: [],
          total_count: 0,
          volume_stats: {
            total_sent_wei: 0, total_received_wei: 0,
            total_sent_ether: 0, total_received_ether: 0,
            net_balance_change_wei: 0, net_balance_change_ether: 0
          }
        },
        tokens: [],
        metadata: {
          data_sources: ['Error Fallback'],
          analysis_engine: 'Sentinel Error Handler',
          chain: 'ethereum',
          analysis_timestamp: new Date().toISOString()
        }
      };
      
      return res.status(200).json(basicResponse);
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Unable to process request'
      });
    }
  }
} 
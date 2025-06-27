import { NextApiRequest, NextApiResponse } from 'next';

// Mock multichain detection data
const mockMultichainData = {
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    possible_chains: ['ethereum', 'polygon', 'bsc'],
    supported_chains: {
      ethereum: { name: 'Ethereum', supported: true, rpc_available: true },
      polygon: { name: 'Polygon', supported: true, rpc_available: true },
      bsc: { name: 'Binance Smart Chain', supported: true, rpc_available: true },
      arbitrum: { name: 'Arbitrum', supported: true, rpc_available: false },
      optimism: { name: 'Optimism', supported: true, rpc_available: false }
    },
    detection_timestamp: '2024-01-10T15:30:00Z'
  },
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    possible_chains: ['ethereum', 'bsc'],
    supported_chains: {
      ethereum: { name: 'Ethereum', supported: true, rpc_available: true },
      polygon: { name: 'Polygon', supported: true, rpc_available: true },
      bsc: { name: 'Binance Smart Chain', supported: true, rpc_available: true },
      arbitrum: { name: 'Arbitrum', supported: true, rpc_available: false },
      optimism: { name: 'Optimism', supported: true, rpc_available: false }
    },
    detection_timestamp: '2024-01-10T15:30:00Z'
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Valid address is required' });
  }

  // Validate Ethereum address format
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address format' });
  }

  try {
    // First try to proxy to the actual backend
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const backendEndpoint = `${backendUrl}/api/v3/multichain/${address}`;
    
    const backendResponse = await fetch(backendEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.log('Backend unavailable, providing mock multichain data:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Generate realistic mock multichain data when backend is unavailable
  const mockData = generateMockMultichainData(address);

  // Add a header to indicate this is mock data
  res.setHeader('X-Data-Source', 'mock');
  res.setHeader('X-Service-Status', 'maintenance');
  
  return res.status(200).json({
    status: 'success',
    data: mockData,
    meta: {
      source: 'demo',
      message: 'Service under maintenance - showing demo data',
      backend_status: 'unavailable'
    }
  });
}

function generateMockMultichainData(address: string) {
  // Possible chains to choose from
  const allChains = [
    'ethereum',
    'polygon', 
    'arbitrum',
    'optimism',
    'bsc',
    'avalanche'
  ];

  // Randomly select 1-3 active chains
  const numActiveChains = Math.floor(Math.random() * 3) + 1;
  const activeChains = allChains.slice(0, numActiveChains);

  const supportedChains: Record<string, any> = {};
  
  // Generate supported chains data
  allChains.forEach(chain => {
    const isActive = activeChains.includes(chain);
    supportedChains[chain] = {
      name: getChainDisplayName(chain),
      supported: true,
      rpc_available: Math.random() > 0.2, // 80% chance of RPC being available
    };
  });

  return {
    address,
    possible_chains: activeChains,
    supported_chains: supportedChains,
    detection_timestamp: new Date().toISOString(),
    analysis_metadata: {
      detection_method: 'pattern-based',
      confidence_score: 0.85 + Math.random() * 0.15,
      cross_chain_score: activeChains.length > 1 ? Math.random() * 0.5 + 0.5 : Math.random() * 0.3,
    }
  };
}

function getChainDisplayName(chain: string): string {
  switch (chain) {
    case 'ethereum':
      return 'Ethereum';
    case 'polygon':
      return 'Polygon';
    case 'arbitrum':
      return 'Arbitrum One';
    case 'optimism':
      return 'Optimism';
    case 'bsc':
      return 'Binance Smart Chain';
    case 'avalanche':
      return 'Avalanche C-Chain';
    default:
      return chain.charAt(0).toUpperCase() + chain.slice(1);
  }
} 
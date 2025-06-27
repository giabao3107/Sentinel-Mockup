import { NextApiRequest, NextApiResponse } from 'next';

// Mock GNN analysis data
const mockGNNData = {
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    gnn_analysis: {
      classification: 'Legitimate',
      risk_score: 25.3,
      confidence: 0.89,
      feature_vector: [0.2, 0.1, 0.8, 0.3, 0.5, 0.7],
      model_version: 'GNN_v1.0'
    },
    model_version: 'GNN_v1.0',
    analysis_timestamp: '2024-01-10T15:30:00Z',
    features_used: {
      graph_data_available: true,
      transaction_count: 45,
      feature_engineering: '32-dimensional feature vector'
    }
  },
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984': {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    gnn_analysis: {
      classification: 'Phishing_Scam',
      risk_score: 87.2,
      confidence: 0.94,
      feature_vector: [0.9, 0.8, 0.1, 0.2, 0.9, 0.8],
      model_version: 'GNN_v1.0'
    },
    model_version: 'GNN_v1.0',
    analysis_timestamp: '2024-01-10T15:30:00Z',
    features_used: {
      graph_data_available: true,
      transaction_count: 123,
      feature_engineering: '32-dimensional feature vector'
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
        status: 'error',
        error: 'Valid address parameter is required'
      });
    }

    // Try to proxy to the backend first (with timeout)
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${backendUrl}/api/v3/gnn/classify/${address}`, {
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
    const gnnData = mockGNNData[address as keyof typeof mockGNNData];
    
    if (gnnData) {
      const response = {
        status: 'success',
        data: gnnData,
        analysis_mode: 'mock',
        message: 'Using mock GNN analysis data'
      };
      
      return res.status(200).json(response);
    } else {
      // Generate basic mock data for unknown addresses
      const response = {
        status: 'success',
        data: {
          address: address,
          gnn_analysis: {
            classification: 'Unknown',
            risk_score: 50.0,
            confidence: 0.5,
            feature_vector: Array(32).fill(0.5),
            model_version: 'GNN_v1.0'
          },
          model_version: 'GNN_v1.0',
          analysis_timestamp: new Date().toISOString(),
          features_used: {
            graph_data_available: false,
            transaction_count: 0,
            feature_engineering: '32-dimensional feature vector'
          }
        },
        analysis_mode: 'mock',
        message: 'No GNN analysis data available'
      };
      
      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('GNN analysis API error:', error);
    
    return res.status(500).json({
      status: 'error',
      error: 'GNN analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
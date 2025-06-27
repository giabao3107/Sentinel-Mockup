import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Test API called');
    console.log('Method:', req.method);
    console.log('Query:', req.query);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const simpleResponse = {
      status: 'success',
      message: 'Test API is working',
      timestamp: new Date().toISOString(),
      query: req.query
    };

    console.log('Returning response:', simpleResponse);
    return res.status(200).json(simpleResponse);
    
  } catch (error) {
    console.error('Test API error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test API failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 
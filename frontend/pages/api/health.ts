import { NextApiRequest, NextApiResponse } from 'next';

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

  const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
  const healthData = {
    status: 'healthy' as 'healthy' | 'degraded',
    timestamp: new Date().toISOString(),
    frontend: {
      status: 'online',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    backend: {
      url: backendUrl,
      status: 'unknown' as 'unknown' | 'online' | 'offline' | 'error',
      error: null as string | null
    },
    features: {
      fallback_api: true,
      mock_data: true,
      cors_headers: true
    }
  };

  // Test backend connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const backendResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (backendResponse.ok) {
      const backendHealth = await backendResponse.json();
      healthData.backend.status = 'online';
      healthData.backend = { ...healthData.backend, ...backendHealth };
    } else {
      healthData.backend.status = 'error';
      healthData.backend.error = `HTTP ${backendResponse.status}`;
    }
  } catch (error) {
    healthData.backend.status = 'offline';
    healthData.backend.error = error instanceof Error ? error.message : 'Connection failed';
  }

  // Set overall status
  if (healthData.backend.status === 'offline' || healthData.backend.status === 'error') {
    healthData.status = 'degraded';
  }

  res.status(200).json(healthData);
} 
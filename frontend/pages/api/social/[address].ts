import { NextApiRequest, NextApiResponse } from 'next';

// Mock social intelligence data
const mockSocialData = {
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    total_mentions: 156,
    recent_mentions: [
      {
        platform: 'twitter',
        mention_id: 'tw_001',
        content: 'This wallet shows interesting DeFi patterns, high-value transactions but clean history.',
        author: '@cryptoanalyst',
        timestamp: '2024-01-10T14:22:00Z',
        engagement: 45,
        sentiment: 'positive',
        is_relevant: true,
        context_type: 'legitimate'
      },
      {
        platform: 'telegram',
        mention_id: 'tg_001',
        content: 'Address flagged by community watch for suspicious activity patterns.',
        author: 'CryptoWatch Bot',
        timestamp: '2024-01-10T12:15:00Z',
        engagement: 23,
        sentiment: 'negative',
        is_relevant: true,
        context_type: 'warning'
      }
    ],
    sentiment_summary: {
      positive: 89,
      negative: 34,
      neutral: 33
    },
    risk_indicators: ['High transaction frequency', 'Multiple exchange interactions'],
    scam_alerts: 2,
    positive_mentions: 89,
    warning_flags: ['Community watch flag', 'Volume spike alert']
  },
  '0x28C6c06298d514Db089934071355E5743bf21d60': {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    total_mentions: 89,
    recent_mentions: [
      {
        platform: 'twitter',
        mention_id: 'tw_002',
        content: 'Exchange wallet - Binance hot wallet with verified status.',
        author: '@binance',
        timestamp: '2024-01-09T16:30:00Z',
        engagement: 234,
        sentiment: 'positive',
        is_relevant: true,
        context_type: 'legitimate'
      }
    ],
    sentiment_summary: {
      positive: 67,
      negative: 12,
      neutral: 10
    },
    risk_indicators: [],
    scam_alerts: 0,
    positive_mentions: 67,
    warning_flags: []
  },
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    total_mentions: 0,
    recent_mentions: [],
    sentiment_summary: {
      positive: 0,
      negative: 0,
      neutral: 0
    },
    risk_indicators: [],
    scam_alerts: 0,
    positive_mentions: 0,
    warning_flags: []
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
        success: false,
        error: 'Valid address parameter is required'
      });
    }

    // Try to proxy to the backend first (with timeout)
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${backendUrl}/api/social/intelligence/${address}`, {
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
    const socialData = mockSocialData[address as keyof typeof mockSocialData];
    
    if (socialData) {
      // Transform mock data to match expected structure
      const response = {
        success: true,
        data: {
          address: socialData.address,
          analysis_timestamp: new Date().toISOString(),
          total_mentions: socialData.total_mentions,
          recent_mentions: socialData.recent_mentions,
          sentiment_summary: socialData.sentiment_summary,
          risk_indicators: socialData.risk_indicators,
          scam_alerts: socialData.scam_alerts,
          positive_mentions: socialData.positive_mentions,
          warning_flags: socialData.warning_flags,
          social_risk_score: calculateRiskScore(socialData),
          platform_breakdown: calculatePlatformBreakdown(socialData.recent_mentions)
        },
        analysis_mode: 'mock',
        message: 'Using mock social intelligence data'
      };
      
      return res.status(200).json(response);
    } else {
      // Generate basic mock data for unknown addresses
      const response = {
        success: true,
        data: {
          address: address,
          analysis_timestamp: new Date().toISOString(),
          total_mentions: 0,
          recent_mentions: [],
          sentiment_summary: { positive: 0, negative: 0, neutral: 0 },
          risk_indicators: [],
          scam_alerts: 0,
          positive_mentions: 0,
          warning_flags: [],
          social_risk_score: 0,
          platform_breakdown: {
            twitter: { mentions: 0, sentiment: 'neutral' },
            telegram: { mentions: 0, sentiment: 'neutral' },
            discord: { mentions: 0, sentiment: 'neutral' }
          }
        },
        analysis_mode: 'mock',
        message: 'No social intelligence data available'
      };
      
      return res.status(200).json(response);
    }
  } catch (error) {
    console.error('Social intelligence API error:', error);
    
    // Return a basic fallback response even if everything fails
    try {
      const basicResponse = {
        success: false,
        error: 'Social intelligence analysis failed',
        data: {
          address: req.query.address || 'unknown',
          analysis_timestamp: new Date().toISOString(),
          total_mentions: 0,
          recent_mentions: [],
          sentiment_summary: { positive: 0, negative: 0, neutral: 0 },
          risk_indicators: ['Analysis failed'],
          scam_alerts: 0,
          positive_mentions: 0,
          warning_flags: [],
          social_risk_score: 0,
          platform_breakdown: {}
        }
      };
      
      return res.status(200).json(basicResponse);
    } catch (fallbackError) {
      console.error('Even fallback failed:', fallbackError);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Unable to process social intelligence request'
      });
    }
  }
}

// Helper functions
function calculateRiskScore(socialData: any): number {
  let riskScore = 0;
  
  // Base score from scam alerts
  riskScore += socialData.scam_alerts * 20;
  
  // Warning flags
  riskScore += socialData.warning_flags.length * 10;
  
  // Risk indicators
  riskScore += socialData.risk_indicators.length * 15;
  
  // Sentiment impact
  if (socialData.total_mentions > 0) {
    const negativeRatio = socialData.sentiment_summary.negative / socialData.total_mentions;
    riskScore += negativeRatio * 30;
  }
  
  // Positive mentions reduce risk
  riskScore -= socialData.positive_mentions * 0.2;
  
  // Cap at 100
  return Math.min(Math.max(riskScore, 0), 100);
}

function calculatePlatformBreakdown(mentions: any[]): any {
  const breakdown = {
    twitter: { mentions: 0, sentiment: 'neutral' },
    telegram: { mentions: 0, sentiment: 'neutral' },
    discord: { mentions: 0, sentiment: 'neutral' }
  };
  
  mentions.forEach(mention => {
    if (breakdown[mention.platform as keyof typeof breakdown]) {
      breakdown[mention.platform as keyof typeof breakdown].mentions++;
    }
  });
  
  return breakdown;
} 
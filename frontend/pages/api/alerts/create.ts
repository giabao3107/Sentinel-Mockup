import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const alertData = req.body;

    // Validate required fields
    const requiredFields = ['name', 'rule_type', 'conditions'];
    for (const field of requiredFields) {
      if (!alertData[field]) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }

    // Try to create alert in backend first
    const backendUrl = process.env.BACKEND_URL || 'https://sentinel-mockup.onrender.com';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${backendUrl}/api/alerts/rules`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alertData,
          user_id: 'default_user', // In real app, get from auth
          conditions: generateConditionsForRuleType(alertData.rule_type, alertData)
        })
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return res.status(201).json(data);
      } else {
        console.log(`Backend returned ${response.status}, using mock creation`);
      }
    } catch (error) {
      console.log('Backend unavailable, using mock creation:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Fallback: create mock alert rule
    const mockRule = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: alertData.name,
      description: alertData.description || '',
      user_id: 'default_user',
      target_addresses: alertData.target_addresses || [],
      rule_type: alertData.rule_type,
      conditions: generateConditionsForRuleType(alertData.rule_type, alertData),
      severity: alertData.severity || 'medium',
      notification_channels: alertData.notification_channels || ['email'],
      status: 'active',
      created_at: new Date().toISOString(),
      last_triggered: null,
      trigger_count: 0,
      cooldown_minutes: alertData.cooldown_minutes || 60,
      metadata: {}
    };

    return res.status(201).json({
      success: true,
      rule_id: mockRule.id,
      rule: mockRule,
      message: 'Alert rule created successfully (mock mode)'
    });

  } catch (error) {
    console.error('Alert creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create alert rule'
    });
  }
}

// Helper function to generate conditions based on rule type
function generateConditionsForRuleType(ruleType: string, alertData: any): any {
  switch (ruleType) {
    case 'risk_score_threshold':
      return {
        threshold: alertData.threshold || 80
      };
    
    case 'large_transaction':
      return {
        threshold_eth: alertData.threshold_eth || 10
      };
    
    case 'balance_threshold':
      return {
        threshold_eth: alertData.threshold_eth || 100,
        condition: alertData.condition || 'above'
      };
    
    case 'rapid_transactions':
      return {
        time_window_minutes: alertData.time_window_minutes || 5,
        min_transaction_count: alertData.min_transaction_count || 5
      };
    
    case 'new_connection':
      return {
        max_age_hours: alertData.max_age_hours || 24
      };
    
    case 'suspicious_pattern':
      return {
        pattern_type: alertData.pattern_type || 'rapid_small_transactions',
        time_window_minutes: alertData.time_window_minutes || 30,
        min_transaction_count: alertData.min_transaction_count || 10,
        max_value_eth: alertData.max_value_eth || 0.1
      };
    
    case 'mixer_interaction':
      return {
        mixer_addresses: alertData.mixer_addresses || [
          '0x8ba1f109551bD432803012645Hac136c22C0A3A8'
        ]
      };
    
    case 'whitelist_violation':
      return {
        whitelisted_addresses: alertData.whitelisted_addresses || []
      };
    
    case 'blacklist_interaction':
      return {
        blacklisted_addresses: alertData.blacklisted_addresses || []
      };
    
    default:
      return {};
  }
} 
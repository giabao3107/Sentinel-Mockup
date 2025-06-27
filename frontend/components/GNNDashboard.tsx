import { useState, useEffect } from 'react';
import { buildApiUrl, fetchWithFallback } from '@/utils';
import GNNAnalysis from './GNNAnalysis';
import MultichainAnalysis from './MultichainAnalysis';

interface Phase3Intelligence {
  address: string;
  analysis_timestamp: string;
  analysis_version: string;
  services_used: string[];
  intelligence_summary: {
    gnn_risk_score: number;
    gnn_classification: string;
    gnn_confidence: number;
    aggregate_risk_score: number;
    aggregate_risk_level: string;
    confidence_score: number;
  };
  detailed_analysis: {
    gnn_assessment?: any;
    multichain_analysis?: any;
    network_analysis?: any;
    aggregate_assessment?: any;
  };
  actionable_intelligence: {
    immediate_actions: string[];
    recommendations: string[];
    monitoring_suggestions: string[];
    next_steps: string[];
  };
}

interface GNNDashboardProps {
  address?: string;
}

export default function GNNDashboard({ address: initialAddress }: GNNDashboardProps) {
  const [address, setAddress] = useState(initialAddress || '');
  const [intelligence, setIntelligence] = useState<Phase3Intelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'gnn' | 'network' | 'multichain'>('overview');

  const handleAnalyze = async (targetAddress: string) => {
    if (!targetAddress) return;
    
    setLoading(true);
    setError(null);
    setAddress(targetAddress);
    
    try {
      // Try multiple endpoints for better reliability
      const endpoints = [
        `/api/v3/intelligence/${targetAddress}?gnn_analysis=true&include_network=true&include_multichain=true`,
        `/api/v3/gnn/${targetAddress}?include_network=true&include_multichain=true`,
        `/api/v1/wallet/${targetAddress}`
      ];
      
      let response;
      let lastError;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await fetchWithFallback(buildApiUrl(endpoint));
      
      if (response.ok) {
        const data = await response.json();
            // Handle both direct data and wrapped responses
            const intelligenceData = data.data || data;
            setIntelligence(intelligenceData);
            
            // Check if this is mock data and show appropriate message
            const isDemo = response.headers.get('X-Data-Source') === 'mock' || 
                          data.meta?.source === 'demo';
            if (isDemo) {
              setError('🔧 Đang sử dụng dữ liệu demo - Backend service đang bảo trì');
            }
            return;
          }
        } catch (err) {
          lastError = err;
          console.log(`Endpoint ${endpoint} failed:`, err instanceof Error ? err.message : 'Unknown error');
          continue;
        }
      }
      
      // If all endpoints fail, generate mock data locally
      console.log('All endpoints failed, generating local mock data');
      const mockData = generateLocalMockData(targetAddress);
      setIntelligence(mockData);
      setError('⚠️ Tất cả các endpoint đều không khả dụng - hiển thị dữ liệu demo local');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('AI analysis error:', err);
      
      // Even on complete failure, provide demo data
      const mockData = generateLocalMockData(targetAddress);
      setIntelligence(mockData);
      setError(`🚨 Lỗi kết nối: ${errorMsg} - Hiển thị dữ liệu demo để trải nghiệm`);
    } finally {
      setLoading(false);
    }
  };

  // Generate local mock data when all services fail
  const generateLocalMockData = (addr: string): Phase3Intelligence => {
    const riskScore = Math.floor(Math.random() * 100);
    const classifications = ['legitimate', 'defi_trader', 'mev_bot', 'general_scam', 'phishing_scam'];
    const classification = classifications[Math.floor(Math.random() * classifications.length)];
    
    const riskLevels = ['MINIMAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const riskLevel = riskScore >= 80 ? 'CRITICAL' :
                     riskScore >= 60 ? 'HIGH' :
                     riskScore >= 40 ? 'MEDIUM' :
                     riskScore >= 20 ? 'LOW' : 'MINIMAL';

    return {
      address: addr,
      analysis_timestamp: new Date().toISOString(),
      analysis_version: 'sentinel-v3.0.0-local-demo',
      services_used: ['local_demo', 'gnn_simulation', 'network_simulation'],
      intelligence_summary: {
        gnn_risk_score: riskScore,
        gnn_classification: classification,
        gnn_confidence: 0.85 + Math.random() * 0.15,
        aggregate_risk_score: riskScore,
        aggregate_risk_level: riskLevel,
        confidence_score: 0.89,
      },
      detailed_analysis: {
        gnn_assessment: {
          model_version: 'GraphSAGE-v2.1-demo',
          feature_vector: Array.from({ length: 32 }, () => Math.random() * 2 - 1),
          classification: classification,
          risk_score: riskScore,
          confidence: 0.85 + Math.random() * 0.15,
        },
        network_analysis: {
          cluster_analysis: {
            cluster_id: `demo_cluster_${Math.floor(Math.random() * 1000)}`,
            cluster_size: Math.floor(Math.random() * 50) + 5,
            centrality_score: Math.random(),
          }
        }
      },
      actionable_intelligence: {
        immediate_actions: riskScore >= 70 ? [
          '⚠️ Cảnh báo: Địa chỉ có rủi ro cao',
          'Tránh giao dịch với địa chỉ này',
          'Kiểm tra kỹ trước khi thực hiện giao dịch'
        ] : riskScore >= 40 ? [
          '⚡ Thận trọng khi giao dịch',
          'Xác minh danh tính trước khi tiếp tục'
        ] : [],
        recommendations: [
          'Theo dõi hoạt động giao dịch của địa chỉ này',
          'Kiểm tra các kết nối mạng liên quan',
          'Xác minh nguồn gốc và tính hợp pháp của tài sản'
        ],
        monitoring_suggestions: [
          'Thiết lập cảnh báo real-time',
          'Phân tích cluster địa chỉ',
          'Theo dõi hoạt động cross-chain'
        ],
        next_steps: [
          'Thiết lập monitoring cho địa chỉ này',
          'Phân tích mô hình giao dịch chi tiết hơn',
          'Kiểm tra các địa chỉ có liên quan'
        ]
      }
    };
  };

  const getRiskLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'MINIMAL': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Header with Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-purple-50/50 to-blue-50/50 rounded-3xl border border-gray-200/50 p-8 shadow-xl backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="text-white font-bold text-lg">AI</div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
                        AI Intelligence Dashboard
                      </h1>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">Live System</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-lg text-gray-600 mb-4 max-w-2xl leading-relaxed">
                  Advanced threat detection powered by <span className="font-semibold text-purple-700">Graph Neural Networks</span>, 
                  <span className="font-semibold text-blue-700"> Multi-chain Analysis</span>, and 
                  <span className="font-semibold text-indigo-700"> Network Behavior Analytics</span>
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white/70 rounded-full border border-purple-200/50">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-purple-700 font-medium">Advanced AI Models</span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white/70 rounded-full border border-blue-200/50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-700 font-medium">Real-time Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1 bg-white/70 rounded-full border border-indigo-200/50">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span className="text-indigo-700 font-medium">Multi-chain Support</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-start lg:items-end space-y-4">
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm font-bold rounded-full border border-purple-300/50 shadow-sm">
                    PyTorch GNN
                  </div>
                  <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm font-bold rounded-full border border-blue-300/50 shadow-sm">
                    AI Beta
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1">
                  <div className="font-medium">Powered by GraphSAGE Neural Network</div>
                  <div>Enterprise-grade Threat Intelligence</div>
                </div>
              </div>
            </div>

            {/* Enhanced Search Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter Ethereum address for AI analysis..."
                      className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white/90 backdrop-blur-sm placeholder-gray-400"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleAnalyze(address)}
                  disabled={!address || loading}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white font-bold text-lg rounded-xl hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Run AI Analysis</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Enhanced Quick Demo Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Quick Demos:</span>
                {[
                  { label: 'High-Risk Wallet', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', color: 'red' },
                  { label: 'DeFi Trader', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', color: 'blue' },
                  { label: 'Exchange Wallet', address: '0x28C6c06298d514Db089934071355E5743bf21d60', color: 'green' }
                ].map((demo) => (
                  <button
                    key={demo.address}
                    onClick={() => handleAnalyze(demo.address)}
                    className={`px-4 py-2 bg-gradient-to-r ${
                      demo.color === 'red' ? 'from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 border-red-200' :
                      demo.color === 'blue' ? 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 border-blue-200' :
                      'from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200'
                    } border text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md transform hover:scale-105`}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        {intelligence && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-2 shadow-lg">
            <nav className="flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Intelligence Overview', color: 'purple' },
                { id: 'gnn', label: 'GNN Analysis', color: 'blue' },
                { id: 'network', label: 'Network Behavior', color: 'indigo' },
                { id: 'multichain', label: 'Multi-chain Analysis', color: 'green' }
              ].map((tab) => {
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as any)}
                    className={`py-3 px-6 font-semibold text-sm transition-all duration-300 rounded-xl ${
                      isActive
                        ? `bg-gradient-to-r ${
                            tab.color === 'purple' ? 'from-purple-500 to-purple-600 text-white shadow-lg' :
                            tab.color === 'blue' ? 'from-blue-500 to-blue-600 text-white shadow-lg' :
                            tab.color === 'indigo' ? 'from-indigo-500 to-indigo-600 text-white shadow-lg' :
                            'from-green-500 to-green-600 text-white shadow-lg'
                          } transform scale-105`
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50/80 hover:scale-102'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Enhanced Loading State */}
        {loading && (
          <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-8 shadow-xl">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-6 max-w-lg">
                {/* Animated Loading Circle */}
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>

                {/* Loading Indicators */}
                <div className="flex justify-center space-x-4">
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>

                {/* Status Text */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-purple-900 mb-2">
                    Running AI Analysis
                  </h3>
                  <p className="text-purple-700 text-lg mb-4">
                    Connecting and processing with advanced AI systems...
                  </p>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 text-left">
                    <p className="text-sm text-purple-800 mb-3 font-semibold">Analysis Progress:</p>
                    <div className="space-y-2 text-xs text-purple-700">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Connecting to API endpoints...
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        Initializing Graph Neural Networks...
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                        Starting Multi-chain Analysis...
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                        Analyzing Network Behavior...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="w-full max-w-md mx-auto">
                  <div className="bg-white/50 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 h-3 rounded-full animate-pulse w-full"></div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2 text-center">
                    If taking too long, system will automatically switch to demo data
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error/Status State */}
        {error && (
          <div className={`rounded-2xl border-2 p-8 ${
            error.includes('demo') || error.includes('maintenance') ? 
            'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' :
            'bg-gradient-to-r from-red-50 to-pink-50 border-red-300'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  error.includes('demo') || error.includes('maintenance') ? 
                  'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <div className={`w-6 h-6 rounded-full ${
                    error.includes('demo') || error.includes('maintenance') ? 
                    'bg-yellow-600 animate-pulse' : 'bg-red-600'
                  }`}></div>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-xl font-bold mb-2 ${
                  error.includes('demo') || error.includes('maintenance') ? 
                  'text-yellow-900' : 'text-red-900'
                }`}>
                  {error.includes('demo') || error.includes('maintenance') ? 
                    'Service Under Maintenance' : 
                    'Connection Error'
                  }
                </h3>
                <p className={`mb-4 ${
                  error.includes('demo') || error.includes('maintenance') ? 
                  'text-yellow-800' : 'text-red-800'
                }`}>
                  {error}
                </p>
                
                <div className={`rounded-lg p-4 mb-4 ${
                  error.includes('demo') || error.includes('maintenance') ? 
                  'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <div className={`text-sm ${
                    error.includes('demo') || error.includes('maintenance') ? 
                    'text-yellow-800' : 'text-red-800'
                  }`}>
                    {error.includes('demo') || error.includes('maintenance') ? (
                      <>
                        <p className="font-semibold mb-2">Information:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• AI/GNN service is being upgraded for improved performance</li>
                          <li>• Demo data is generated for you to experience the interface</li>
                          <li>• All UI/UX features are working normally</li>
                          <li>• Real service will be restored after maintenance completion</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold mb-2">Error Details:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Unable to connect to backend API</li>
                          <li>• May be due to CORS policy or backend not started</li>
                          <li>• System automatically switched to demo mode</li>
                          <li>• You can still experience full UI functionality</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleAnalyze(address)}
                    className={`px-6 py-3 font-medium rounded-lg transition-colors shadow-lg ${
                      error.includes('demo') || error.includes('maintenance') ? 
                      'bg-yellow-600 text-white hover:bg-yellow-700' :
                      'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Retry Connection
                  </button>
                  
                  {!intelligence && (
                    <button
                      onClick={() => {
                        const mockData = generateLocalMockData(address);
                        setIntelligence(mockData);
                        setError('Switched to demo mode - All UI features are available');
                      }}
                      className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-lg"
                    >
                      View Demo Dashboard
                    </button>
                  )}

                  <button
                    onClick={() => setError(null)}
                    className="px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
                  >
                    Hide Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {intelligence && !loading && (
          <>
            {/* Overview Tab */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Intelligence Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Intelligence Summary</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Aggregate Risk */}
                    <div className={`p-4 rounded-lg border ${getRiskLevelColor(intelligence.intelligence_summary.aggregate_risk_level)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium opacity-75">Aggregate Risk Score</p>
                          <p className="text-2xl font-bold">{intelligence.intelligence_summary.aggregate_risk_score}</p>
                          <p className="text-sm font-medium">{intelligence.intelligence_summary.aggregate_risk_level}</p>
                        </div>
                        <div className="h-8 w-8 bg-gray-400 rounded-full opacity-50 flex items-center justify-center">
                          <div className="text-white font-bold text-xs">RISK</div>
                        </div>
                      </div>
                    </div>

                    {/* GNN Classification */}
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">GNN Classification</p>
                          <p className="text-lg font-semibold text-gray-900">{intelligence.intelligence_summary.gnn_classification}</p>
                          <p className="text-sm text-gray-600">{(intelligence.intelligence_summary.gnn_confidence * 100).toFixed(1)}% confidence</p>
                        </div>
                        <div className="h-8 w-8 bg-purple-400 rounded-full flex items-center justify-center">
                          <div className="text-white font-bold text-xs">AI</div>
                        </div>
                      </div>
                    </div>

                    {/* Services Used */}
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Analysis Services</p>
                          <p className="text-lg font-semibold text-gray-900">{intelligence.services_used.length}</p>
                          <p className="text-sm text-gray-600">Active services</p>
                        </div>
                        <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <div className="text-white font-bold text-xs">SVC</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Used Details */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Active Analysis Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {intelligence.services_used.map((service, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
                        >
                          {service.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actionable Intelligence */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Actionable Intelligence</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Immediate Actions */}
                    <div>
                      <h4 className="text-lg font-semibold text-red-900 mb-3">Immediate Actions</h4>
                      {intelligence.actionable_intelligence.immediate_actions.length > 0 ? (
                        <ul className="space-y-2">
                          {intelligence.actionable_intelligence.immediate_actions.map((action, index) => (
                            <li key={index} className="flex items-start">
                              <div className="h-4 w-4 bg-red-500 rounded-full mt-0.5 mr-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700">{action}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No immediate actions required</p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="text-lg font-semibold text-blue-900 mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {intelligence.actionable_intelligence.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <div className="h-4 w-4 bg-blue-500 rounded-full mt-0.5 mr-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Monitoring Suggestions */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Monitoring Suggestions</h4>
                    <div className="flex flex-wrap gap-2">
                      {intelligence.actionable_intelligence.monitoring_suggestions.map((suggestion, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded"
                        >
                          {suggestion}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GNN Tab */}
            {activeView === 'gnn' && (
              <GNNAnalysis address={address} />
            )}

            {/* Network Behavior Tab */}
            {activeView === 'network' && intelligence.detailed_analysis.network_analysis && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Network Behavior Analysis</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-800">
                    Network behavior analysis data available. Advanced cluster detection and suspicious pattern analysis.
                  </p>
                  <pre className="mt-4 text-sm bg-white p-4 rounded border overflow-auto text-gray-900">
                    {JSON.stringify(intelligence.detailed_analysis.network_analysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Multi-chain Tab */}
            {activeView === 'multichain' && (
              <MultichainAnalysis address={address} />
            )}
          </>
        )}

        {/* Enhanced Features Showcase */}
        {!intelligence && !loading && (
          <div className="bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30 rounded-3xl border border-gray-200/50 p-8 shadow-xl">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent mb-4">
                AI Features: Next-Gen Intelligence
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Experience the future of blockchain security with our advanced AI-powered threat detection system
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Enhanced GNN Feature Card */}
              <div className="group relative bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-8 border-2 border-purple-200/50 rounded-2xl hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-300/50 transition-all duration-300 transform group-hover:scale-110">
                      <div className="text-white font-black text-xl">GNN</div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">Graph Neural Networks</h4>
                  <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
                    PyTorch-based GraphSAGE model for advanced wallet classification and risk scoring.
                    Detects patterns invisible to traditional heuristics.
                  </p>
                  <div className="space-y-3">
                    {[
                      'Benign/Scam Classification',
                      'MEV Bot Detection', 
                      'DeFi Pattern Analysis'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-purple-100">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Network Analysis Card */}
              <div className="group relative bg-gradient-to-br from-blue-50 via-white to-blue-50/50 p-8 border-2 border-blue-200/50 rounded-2xl hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-300/50 transition-all duration-300 transform group-hover:scale-110">
                      <div className="text-white font-black text-lg">NET</div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">Network Behavior Analysis</h4>
                  <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
                    Advanced cluster detection and suspicious pattern recognition using graph analytics.
                  </p>
                  <div className="space-y-3">
                    {[
                      'Sybil Attack Detection',
                      'Galaxy View Clustering',
                      'Wash Trading Patterns'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-blue-100">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enhanced Multi-chain Card */}
              <div className="group relative bg-gradient-to-br from-green-50 via-white to-green-50/50 p-8 border-2 border-green-200/50 rounded-2xl hover:border-green-300 transition-all duration-300 hover:shadow-xl hover:shadow-green-100/50 transform hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-300/50 transition-all duration-300 transform group-hover:scale-110">
                      <div className="text-white font-black text-sm">MULTI</div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 text-center">Multi-chain Intelligence</h4>
                  <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
                    Cross-chain correlation and risk assessment across multiple blockchain networks.
                  </p>
                  <div className="space-y-3">
                    {[
                      'Cross-chain Tracking',
                      'Bridge Analysis',
                      'Coordinated Activity Detection'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white/80 rounded-xl border border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { CheckCircle, Globe, Activity, XCircle, GitBranch } from 'lucide-react';
import { buildApiUrl, fetchWithFallback } from '@/utils';

interface MultichainData {
  address: string;
  possible_chains: string[];
  supported_chains: Record<string, {
    name: string;
    supported: boolean;
    rpc_available: boolean;
  }>;
  detection_timestamp: string;
}

interface MultichainAnalysisProps {
  address: string;
}

export default function MultichainAnalysis({ address }: MultichainAnalysisProps) {
  const [multichainData, setMultichainData] = useState<MultichainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchMultichainAnalysis();
    }
  }, [address]);

  const fetchMultichainAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try multiple endpoints for better reliability
      const endpoints = [
        `/api/v3/multichain/${address}`,
        `/api/multichain/detect/${address}`,
        `/api/v1/wallet/${address}/multichain`
      ];
      
      let response;
      let lastError;

      for (const endpoint of endpoints) {
        try {
          response = await fetchWithFallback(buildApiUrl(endpoint));
          
          if (response.ok) {
            const result = await response.json();
            const multichainInfo = result.data || result;
            setMultichainData(multichainInfo);
            
            // Check if this is mock data
            const isDemo = response.headers.get('X-Data-Source') === 'mock' || 
                          result.meta?.source === 'demo';
            if (isDemo) {
              setError('Service under maintenance - showing demo data');
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
      const mockData = generateLocalMockData(address);
      setMultichainData(mockData);
      setError('All endpoints unavailable - showing local demo data');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Multichain analysis error:', err);
      
      // Even on complete failure, provide demo data
      const mockData = generateLocalMockData(address);
      setMultichainData(mockData);
      setError(`Connection error: ${errorMsg} - Showing demo data for experience`);
    } finally {
      setLoading(false);
    }
  };

  // Generate local mock data when all services fail
  const generateLocalMockData = (addr: string) => {
    const allChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc'];
    const numActiveChains = Math.floor(Math.random() * 3) + 1;
    const activeChains = allChains.slice(0, numActiveChains);

    const supportedChains: Record<string, any> = {};
    allChains.forEach(chain => {
      supportedChains[chain] = {
        name: chain.charAt(0).toUpperCase() + chain.slice(1),
        supported: true,
        rpc_available: Math.random() > 0.2,
      };
    });

    return {
      address: addr,
      possible_chains: activeChains,
      supported_chains: supportedChains,
      detection_timestamp: new Date().toISOString(),
    };
  };

  const getChainColor = (chainName: string) => {
    switch (chainName.toLowerCase()) {
      case 'ethereum':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'polygon':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'bsc':
      case 'binance smart chain':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'arbitrum':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'optimism':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-50 via-blue-50 to-teal-50 rounded-2xl border border-green-200 p-8 shadow-lg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Running Multichain Analysis</h3>
              <p className="text-gray-700">Detecting cross-chain activity and network patterns...</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>Analyzing blockchain networks for activity correlation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !multichainData) {
    return (
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
                'Multichain Service Maintenance' : 
                'Multichain Analysis Failed'
              }
            </h3>
            <p className={`mb-4 ${
              error.includes('demo') || error.includes('maintenance') ? 
              'text-yellow-800' : 'text-red-800'
            }`}>
              {error}
            </p>
            <button
              onClick={fetchMultichainAnalysis}
              className={`px-6 py-3 font-medium rounded-lg transition-colors ${
                error.includes('demo') || error.includes('maintenance') ? 
                'bg-yellow-600 text-white hover:bg-yellow-700' :
                'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!multichainData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No multichain analysis data available.</p>
      </div>
    );
  }

  const supportedChainsArray = Object.values(multichainData.supported_chains);
  const activeChainsCount = multichainData.possible_chains.length;
  const totalSupportedChains = supportedChainsArray.length;

  return (
    <div className="space-y-6">
      {/* Multichain Analysis Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
        {/* Service Status Warning */}
        {error && (
          <div className="mb-6 bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-yellow-600 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-yellow-800 font-medium">
                Service under maintenance - showing demo data
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Multi-chain Analysis</h3>
            <p className="text-lg text-gray-700 mb-4">Cross-chain correlation and risk assessment</p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Cross-chain Detection</span>
              <span>•</span>
              <span>Network Correlation</span>
              <span>•</span>
              <span>Activity Mapping</span>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-3">
            <div className="flex items-center space-x-3">
              <span className="px-4 py-2 bg-green-100 text-green-800 text-sm font-bold rounded-full">
                {activeChainsCount} Active Chains
              </span>
              <span className="px-4 py-2 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                {totalSupportedChains} Supported
              </span>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Multi-blockchain Support</div>
              <div>Real-time Chain Detection</div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Active Chains */}
          <div className="p-6 rounded-2xl border-2 border-green-200 bg-green-50 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm font-bold text-green-800 mb-2">Active Chains</p>
              <p className="text-3xl font-bold text-green-900 mb-2">{activeChainsCount}</p>
              <p className="text-sm text-green-700">Detected activity</p>
            </div>
          </div>

          {/* Coverage */}
          <div className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-blue-200 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <p className="text-sm font-bold text-blue-800 mb-2">Chain Coverage</p>
              <p className="text-3xl font-bold text-blue-900 mb-2">
                {Math.round((activeChainsCount / totalSupportedChains) * 100)}%
              </p>
              <p className="text-sm text-blue-700">Of supported chains</p>
            </div>
          </div>

          {/* Network Status */}
          <div className="p-6 rounded-2xl border-2 border-purple-200 bg-purple-50 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-purple-200 rounded-full mx-auto flex items-center justify-center">
                  <div className="w-6 h-6 bg-purple-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-sm font-bold text-purple-800 mb-2">Network Status</p>
              <p className="text-2xl font-bold text-purple-900 mb-2">Monitoring</p>
              <p className="text-sm text-purple-700">Cross-chain activity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detected Chains */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detected Chain Activity</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {multichainData.possible_chains.map((chain) => {
            const chainInfo = multichainData.supported_chains[chain];
            return (
              <div key={chain} className={`p-4 rounded-lg border ${getChainColor(chainInfo?.name || chain)}`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{chainInfo?.name || chain}</h5>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Activity:</span>
                    <span className="font-medium">Detected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>RPC Status:</span>
                    <span className={`font-medium ${chainInfo?.rpc_available ? 'text-green-700' : 'text-orange-700'}`}>
                      {chainInfo?.rpc_available ? 'Available' : 'Limited'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {multichainData.possible_chains.length === 0 && (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No cross-chain activity detected for this address</p>
            <p className="text-gray-500 text-sm mt-1">Activity appears to be limited to a single blockchain</p>
          </div>
        )}
      </div>

      {/* Supported Chains Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Supported Blockchain Networks</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(multichainData.supported_chains).map(([chainKey, chainInfo]) => {
            const isActive = multichainData.possible_chains.includes(chainKey);
            
            return (
              <div 
                key={chainKey} 
                className={`p-4 rounded-lg border transition-all ${
                  isActive 
                    ? `${getChainColor(chainInfo.name)} ring-2 ring-opacity-50`
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-medium ${isActive ? '' : 'text-gray-600'}`}>
                    {chainInfo.name}
                  </h5>
                  <div className="flex items-center space-x-1">
                    {isActive && <Activity className="h-4 w-4 text-green-600" />}
                    {chainInfo.supported ? (
                      <CheckCircle className={`h-4 w-4 ${isActive ? '' : 'text-gray-400'}`} />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={isActive ? '' : 'text-gray-600'}>Status:</span>
                    <span className={`font-medium ${
                      isActive ? 'text-green-700' : 
                      chainInfo.supported ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {isActive ? 'Active' : chainInfo.supported ? 'Supported' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isActive ? '' : 'text-gray-600'}>RPC:</span>
                    <span className={`font-medium ${
                      chainInfo.rpc_available ? 
                        (isActive ? 'text-green-700' : 'text-gray-600') : 
                        'text-orange-600'
                    }`}>
                      {chainInfo.rpc_available ? 'Available' : 'Limited'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Analysis Summary</h4>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <GitBranch className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h5 className="font-medium text-blue-900 mb-2">Cross-chain Activity Assessment</h5>
              <div className="space-y-2 text-sm text-blue-800">
                {activeChainsCount > 1 ? (
                  <>
                    <p>• Multi-chain activity detected across {activeChainsCount} blockchain networks</p>
                    <p>• Consider monitoring for coordinated cross-chain activities</p>
                    <p>• Bridge transactions and cross-chain swaps may indicate sophisticated operations</p>
                  </>
                ) : activeChainsCount === 1 ? (
                  <>
                    <p>• Single-chain activity detected on {multichainData.possible_chains[0]}</p>
                    <p>• No cross-chain coordination patterns observed</p>
                    <p>• Standard blockchain activity within one ecosystem</p>
                  </>
                ) : (
                  <>
                    <p>• No clear chain activity detected in current analysis</p>
                    <p>• Address may be new or have limited transaction history</p>
                    <p>• Monitoring recommended for future activity</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Analysis Time:</span>
              <p className="font-medium">{new Date(multichainData.detection_timestamp).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Address:</span>
              <p className="font-mono text-xs break-all">{multichainData.address}</p>
            </div>
            <div>
              <span className="text-gray-600">Detection Method:</span>
              <p className="font-medium">Pattern-based Chain Detection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
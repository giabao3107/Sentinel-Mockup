import { WalletDashboardProps } from '@/types';
import { formatEther, formatTimestamp, formatAddress } from '@/utils';
import { AlertTriangle, Wallet, Activity, Clock, Copy, ExternalLink, Network, Eye, Share2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import RiskBadge from './RiskBadge';
import TransactionList from './TransactionList';
import AddressDisplay from './AddressDisplay';
import InvestigationCanvas from './InvestigationCanvas';

interface GraphData {
  nodes: any[];
  relationships: any[];
  center_address?: string;
  depth?: number;
}

export default function WalletDashboard({ address, data, loading, error }: WalletDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'social' | 'recommendations'>('overview');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [showGraphControls, setShowGraphControls] = useState(false);

  // Check if this is Phase 2 enhanced analysis
  const isEnhanced = data?.analysis_mode === 'enhanced';
  const hasGraphData = data?.graph_insights?.path_analysis_available;

  const handleLoadGraphData = async () => {
    if (!address) return;
    
    setLoadingGraph(true);
    try {
      const response = await fetch(`/api/graph/subgraph/${address}?depth=2`);
      if (response.ok) {
        const result = await response.json();
        setGraphData(result.data);
        setActiveTab('graph');
      } else {
        console.error('Failed to load graph data');
      }
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoadingGraph(false);
    }
  };

  const handleImportData = async () => {
    if (!address) return;
    
    try {
      const response = await fetch(`/api/graph/import-address-data/${address}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1000 })
      });
      
      if (response.ok) {
        // Refresh the page to show enhanced analysis
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to import data:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" className="mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Wallet</h3>
          <p className="text-gray-500 text-center max-w-md">
            Fetching blockchain data and performing risk assessment for {formatAddress(address, true)}...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Analysis Failed</h3>
          <p className="text-red-600 text-center max-w-md mb-4">{error}</p>
          <div className="text-sm text-gray-500">
            Address: <AddressDisplay address={address} short copyable />
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data) {
    return null;
  }

  // Handle both Phase 1 and Phase 2 data structures
  const wallet_info = data.wallet_info || {
    balance: { ether: data.balance || 0, usd_value: 0 },
    transaction_count: data.transaction_count || (Array.isArray(data.transactions) ? data.transactions.length : data.transactions?.recent?.length) || 0,
    token_count: data.tokens?.length || 0,
    first_transaction: null
  };

  const risk_assessment = data.risk_assessment || {
    risk_score: 0,
    risk_level: 'MINIMAL',
    risk_factors: [],
    behavioral_tags: []
  };

  const transactions = data.transactions || { recent: (Array.isArray(data.transactions) ? data.transactions : []), total_count: 0 };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Wallet Forensics Dashboard
              </h2>
              {isEnhanced && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Enhanced Analysis
                </span>
              )}
            </div>
            <AddressDisplay address={address} copyable className="text-lg" />
            
            {/* Data Sources Indicator */}
            {data.data_sources && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-gray-600">Data Sources:</span>
                {data.data_sources.map((source: string) => (
                  <span
                    key={source}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 lg:mt-0 flex flex-col items-end gap-3">
            <RiskBadge 
              riskLevel={risk_assessment.risk_level} 
              riskScore={risk_assessment.risk_score} 
              size="lg" 
            />
            
            {!isEnhanced && (
              <button
                onClick={handleImportData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Upgrade to Enhanced Analysis
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs for Enhanced Mode */}
        {isEnhanced && (
          <div className="border-t border-gray-200 pt-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Eye, available: true },
                { id: 'graph', label: 'Network Graph', icon: Network, available: hasGraphData },
                { id: 'social', label: 'Social Intelligence', icon: Share2, available: data.social_intelligence },
                { id: 'recommendations', label: 'Recommendations', icon: TrendingUp, available: true }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => tab.available && setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : tab.available
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        : 'border-transparent text-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!tab.available}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {!tab.available && (
                      <span className="text-xs">(Unavailable)</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {(!isEnhanced || activeTab === 'overview') && (
        <>
          {/* Key Metrics */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Wallet Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Balance</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {typeof wallet_info.balance === 'object' 
                    ? formatEther(wallet_info.balance.ether)
                    : `${wallet_info.balance || 0} ETH`
                  }
                </p>
                {wallet_info.balance?.usd_value > 0 && (
                  <p className="text-sm text-gray-500">
                    ≈ ${wallet_info.balance.usd_value.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Transactions</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {wallet_info.transaction_count?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-500">Total count</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Copy className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Tokens</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {wallet_info.token_count || data.tokens?.length || 0}
                </p>
                <p className="text-sm text-gray-500">Unique tokens</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-primary-600 mr-2" />
                  <span className="text-sm font-medium text-gray-500">First Seen</span>
                </div>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {wallet_info.first_transaction 
                    ? formatTimestamp(wallet_info.first_transaction).split(',')[0]
                    : 'Unknown'
                  }
                </p>
                <p className="text-sm text-gray-500">First transaction</p>
              </div>
            </div>

            {/* Enhanced Metrics for Phase 2 */}
            {isEnhanced && data.graph_insights && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Network Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Network className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Total Connections</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {data.graph_insights.total_connections}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Network Centrality</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {data.graph_insights.network_centrality?.toFixed(3) || 'N/A'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <button
                      onClick={handleLoadGraphData}
                      disabled={loadingGraph}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
                    >
                      {loadingGraph ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      Explore Network Graph
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Risk Assessment Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="card-header">
              <h3 className="text-xl font-bold text-gray-900">Risk Assessment</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Score */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">Risk Score</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {risk_assessment.risk_score}/100
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${risk_assessment.risk_score}%`,
                      backgroundColor: risk_assessment.risk_level === 'CRITICAL' ? '#dc2626' :
                                       risk_assessment.risk_level === 'HIGH' ? '#ea580c' :
                                       risk_assessment.risk_level === 'MEDIUM' ? '#d97706' :
                                       risk_assessment.risk_level === 'LOW' ? '#65a30d' : '#16a34a'
                    }}
                  />
                </div>

                {/* Enhanced Risk Info */}
                {isEnhanced && data.risk_assessment.confidence && (
                  <div className="mb-6">
                    <span className="text-sm font-medium text-gray-500">Confidence Level: </span>
                    <span className="text-sm font-bold text-gray-900 capitalize">
                      {data.risk_assessment.confidence}
                    </span>
                  </div>
                )}

                {/* Behavioral Tags */}
                {(risk_assessment.behavioral_tags?.length > 0 || (data.behavioral_analysis?.tags?.length || 0) > 0) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Behavioral Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {(risk_assessment.behavioral_tags || data.behavioral_analysis?.tags || []).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Factors */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Risk Factors</h4>
                {(risk_assessment.risk_factors?.length > 0 || data.risk_assessment?.risk_factors?.length > 0) ? (
                  <ul className="space-y-2">
                    {(risk_assessment.risk_factors || data.risk_assessment?.risk_factors || []).map((factor: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No significant risk factors detected</p>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
                <a
                  href={`https://etherscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                >
                  View on Etherscan
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>

            <TransactionList transactions={transactions.recent || (Array.isArray(data.transactions) ? data.transactions : []) || []} />
            
            {transactions.total_count > (transactions.recent?.length || 0) && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Showing {transactions.recent?.length || 0} of {transactions.total_count?.toLocaleString() || 0} transactions
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Graph Tab (Phase 2) */}
      {isEnhanced && activeTab === 'graph' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Network Graph Analysis</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGraphControls(!showGraphControls)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
              >
                Controls
              </button>
              <button
                onClick={handleLoadGraphData}
                disabled={loadingGraph}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {loadingGraph ? 'Loading...' : 'Refresh Graph'}
              </button>
            </div>
          </div>

          {showGraphControls && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Graph Depth
                  </label>
                  <select className="w-full border border-gray-300 rounded px-3 py-1 text-sm text-black" defaultValue="2">
                    <option value="1">1 hop</option>
                    <option value="2">2 hops</option>
                    <option value="3">3 hops</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Transaction Value
                  </label>
                  <select className="w-full border border-gray-300 rounded px-3 py-1 text-sm text-black">
                    <option value="0">All transactions</option>
                    <option value="0.1">≥ 0.1 ETH</option>
                    <option value="1">≥ 1 ETH</option>
                    <option value="10">≥ 10 ETH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show Risk Labels
                  </label>
                  <input type="checkbox" defaultChecked className="mt-2" />
                </div>
              </div>
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <InvestigationCanvas
              data={graphData}
              width={1200}
              height={700}
              onNodeClick={(node) => {
                if (node.properties.hash) {
                  // In a real app, this would navigate to the new address
                  console.log('Analyze address:', node.properties.hash);
                }
              }}
              onNodeRightClick={(node) => {
                console.log('Right clicked node:', node);
              }}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Social Intelligence Tab (Phase 2) */}
      {isEnhanced && activeTab === 'social' && data.social_intelligence && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Social Media Intelligence</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Social Stats */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Social Media Overview</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Mentions:</span>
                  <span className="font-medium">{data.social_intelligence.total_mentions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Scam Alerts:</span>
                  <span className={`font-medium ${
                    data.social_intelligence.scam_alerts > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {data.social_intelligence.scam_alerts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Positive Mentions:</span>
                  <span className="font-medium text-green-600">
                    {data.social_intelligence.positive_mentions || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4">Sentiment Analysis</h4>
              <div className="space-y-2">
                {Object.entries(data.social_intelligence.sentiment_summary || {}).map(([sentiment, count]) => (
                  <div key={sentiment} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{sentiment}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            sentiment === 'positive' ? 'bg-green-500' :
                            sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{
                            width: `${(count / (data.social_intelligence?.total_mentions || 1) * 100) || 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          {(data.social_intelligence?.risk_indicators?.length || 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
              <h4 className="font-medium text-red-900 mb-3">⚠️ Risk Indicators</h4>
              <ul className="space-y-2">
                {(data.social_intelligence?.risk_indicators || []).map((indicator: string, index: number) => (
                  <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Tab */}
      {isEnhanced && activeTab === 'recommendations' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Analysis Recommendations</h3>
          
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="font-medium text-blue-900 mb-3">💡 Recommendations</h4>
              <ul className="space-y-3">
                {data.recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-3">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.next_actions && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-medium text-green-900 mb-3">🚀 Suggested Next Actions</h4>
              <ul className="space-y-3">
                {data.next_actions.map((action: string, index: number) => (
                  <li key={index} className="text-sm text-green-800 flex items-start gap-3">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Analysis Engine: {data.metadata?.analysis_engine || 'Sentinel'}</span>
            <span>•</span>
            <span>Version: {data.metadata?.analysis_version || '1.0'}</span>
            <span>•</span>
            <span>Chain: {data.metadata?.chain || 'Ethereum'}</span>
            {data.data_sources && (
              <>
                <span>•</span>
                <span>Sources: {data.data_sources.join(', ')}</span>
              </>
            )}
          </div>
          <div>
            Analyzed: {data.metadata?.analysis_timestamp ? 
              formatTimestamp(data.metadata.analysis_timestamp) : 
              formatTimestamp(data.analysis_timestamp || new Date().toISOString())
            }
          </div>
        </div>
      </div>
    </div>
  );
} 
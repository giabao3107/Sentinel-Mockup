import { WalletDashboardProps } from '@/types';
import { formatEther, formatTimestamp, formatAddress } from '@/utils';
import { AlertTriangle, Wallet, Activity, Clock, Copy, ExternalLink, Network, Eye, Share2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import RiskBadge from './RiskBadge';
import TransactionList from './TransactionList';
import AddressDisplay from './AddressDisplay';
import VisJsGraph from './VisJsGraph';
import GNNAnalysis from './GNNAnalysis';

interface GraphData {
  nodes: any[];
  edges: any[];
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

          {/* Risk Assessment Card - Enhanced Alert Section */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-red-200 p-8">
            <div className="card-header mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-red-700 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2 text-red-600" />
                  Đánh Giá Rủi Ro (Risk Assessment)
                </h3>
                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  ⚠️ Thông Tin Cảnh Báo
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Risk Score - Enhanced Display */}
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-bold text-red-700 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                    Điểm Rủi Ro (Risk Score)
                  </span>
                  <div className={`px-4 py-2 rounded-xl font-bold text-2xl border-2 shadow-lg ${
                    risk_assessment.risk_level === 'CRITICAL' ? 'bg-red-200 text-red-900 border-red-400 animate-pulse' :
                    risk_assessment.risk_level === 'HIGH' ? 'bg-orange-200 text-orange-900 border-orange-400 animate-pulse' :
                    risk_assessment.risk_level === 'MEDIUM' ? 'bg-amber-200 text-amber-900 border-amber-400' :
                    risk_assessment.risk_level === 'LOW' ? 'bg-lime-200 text-lime-900 border-lime-400' : 
                    'bg-green-200 text-green-900 border-green-400'
                  }`}>
                    {risk_assessment.risk_score}/100
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="relative w-full bg-gray-200 rounded-full h-6 mb-6 overflow-hidden shadow-inner">
                  <div 
                    className={`h-6 rounded-full transition-all duration-1000 relative ${
                      risk_assessment.risk_level === 'CRITICAL' || risk_assessment.risk_level === 'HIGH' ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      width: `${risk_assessment.risk_score}%`,
                      background: risk_assessment.risk_level === 'CRITICAL' ? 'linear-gradient(90deg, #dc2626, #ef4444)' :
                                  risk_assessment.risk_level === 'HIGH' ? 'linear-gradient(90deg, #ea580c, #f97316)' :
                                  risk_assessment.risk_level === 'MEDIUM' ? 'linear-gradient(90deg, #d97706, #f59e0b)' :
                                  risk_assessment.risk_level === 'LOW' ? 'linear-gradient(90deg, #65a30d, #84cc16)' : 
                                  'linear-gradient(90deg, #16a34a, #22c55e)'
                    }}
                  >
                    {/* Glowing effect for high risk */}
                    {(risk_assessment.risk_level === 'CRITICAL' || risk_assessment.risk_level === 'HIGH') && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    )}
                  </div>
                  
                  {/* Risk level indicator on progress bar */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-lg">
                      {risk_assessment.risk_level}
                    </span>
                  </div>
                </div>

                {/* Risk Level Badge */}
                <div className="mb-6 flex justify-center">
                  <div className={`px-6 py-3 rounded-xl border-2 shadow-lg font-bold text-lg ${
                    risk_assessment.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-900 border-red-400 animate-bounce' :
                    risk_assessment.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-900 border-orange-400 animate-pulse' :
                    risk_assessment.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-900 border-amber-400' :
                    risk_assessment.risk_level === 'LOW' ? 'bg-lime-100 text-lime-900 border-lime-400' : 
                    'bg-green-100 text-green-900 border-green-400'
                  }`}>
                    🚨 {risk_assessment.risk_level === 'CRITICAL' ? 'RỦI RO NGHIÊM TRỌNG' :
                         risk_assessment.risk_level === 'HIGH' ? 'RỦI RO CAO' :
                         risk_assessment.risk_level === 'MEDIUM' ? 'RỦI RO TRUNG BÌNH' :
                         risk_assessment.risk_level === 'LOW' ? 'RỦI RO THẤP' : 'AN TOÀN'}
                  </div>
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

              {/* Risk Factors - Enhanced Alerts */}
              <div>
                <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Cảnh Báo & Risk Factors
                </h4>
                {(risk_assessment.risk_factors?.length > 0 || data.risk_assessment?.risk_factors?.length > 0) ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="space-y-3">
                      {(risk_assessment.risk_factors || data.risk_assessment?.risk_factors || []).map((factor: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm font-medium text-red-800 bg-red-100 px-2 py-1 rounded">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-medium flex items-center">
                      <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Không phát hiện yếu tố rủi ro đáng kể
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GNN Analysis Card */}
          <GNNAnalysis address={address} />

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
                            <VisJsGraph
              data={graphData}
              width={1200}
              height={700}
              onNodeClick={(nodeId) => {
                // In a real app, this would navigate to the new address
                console.log('Analyze address:', nodeId);
              }}
              onNodeDoubleClick={(nodeId) => {
                console.log('Double clicked node:', nodeId);
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
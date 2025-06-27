import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Network, Brain, Search, Filter, Download, Settings, Maximize2, RefreshCw, Users, TrendingUp, AlertTriangle, Database, ArrowRight, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import VisJsGraph from '@/components/VisJsGraph';
import GraphStatsPanel from '@/components/GraphStatsPanel';
import { buildApiUrl, isValidEthereumAddress } from '@/utils';

interface GraphNode {
  id: string;
  label: string;
  color: string;
  size: number;
  group: string;
  title?: string;
  properties: {
    hash: string;
    risk_score?: number;
    transaction_count?: number;
    balance?: number;
  };
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  color: string;
  width: number;
  title?: string;
  properties: {
    value: number;
    timestamp?: string;
    transaction_hash?: string;
  };
}

interface GraphData {
  center_address: string;
  depth: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  visualization_config?: any;
}

interface NetworkAnalysis {
  center_address: string;
  network_depth: number;
  total_nodes: number;
  total_edges: number;
  unique_addresses: number;
  total_volume: number;
  average_transaction_value: number;
  risk_assessment: {
    overall_risk: string;
    score: number;
    risk_factors: string[];
    confidence: number;
  };
  network_metrics: {
    clustering_coefficient: number;
    betweenness_centrality: number;
    degree_distribution: number[];
  };
}

interface PathData {
  from_address: string;
  to_address: string;
  paths_found: number;
  analysis_depth: number;
  paths: Array<{
    path_id: number;
    path_length: number;
    total_value: number;
    confidence_score: number;
    nodes: GraphNode[];
    relationships: GraphEdge[];
    risk_score: number;
    risk_level: string;
  }>;
}

export default function GraphAnalysis() {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedDepth, setSelectedDepth] = useState(2);
  const [minValue, setMinValue] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'visualization' | 'analysis' | 'paths'>('visualization');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  
  // Data states
  const [dbStats, setDbStats] = useState<any>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [networkAnalysis, setNetworkAnalysis] = useState<NetworkAnalysis | null>(null);
  const [pathData, setPathData] = useState<PathData | null>(null);
  
  // Path analysis states
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');

  useEffect(() => {
    fetchDatabaseStats();
    const interval = setInterval(fetchDatabaseStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/graph/database-stats'));
      const result = await response.json();
      
      if (result.status === 'success') {
        setDbStats(result.data);
      } else {
        console.log('Database stats not available, using fallback');
        setDbStats({
          total_nodes: 0,
          total_edges: 0,
          postgres_status: "disconnected",
          fallback_mode: true,
          last_updated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      setDbStats({
        total_nodes: 0,
        total_edges: 0,
        postgres_status: "error",
        fallback_mode: true,
        last_updated: new Date().toISOString()
      });
    }
  };

  const handleAnalyzeNetwork = async () => {
    if (!searchAddress || !isValidEthereumAddress(searchAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/graph/subgraph/${searchAddress}?depth=${selectedDepth}`)
      );
      const result = await response.json();
      
      if (result.status === 'success') {
        setGraphData(result.data);
        setActiveTab('visualization');
      } else if (result.status === 'no_data') {
        // Try to import data first
        await handleImportData();
        // Then retry the analysis
        const retryResponse = await fetch(
          buildApiUrl(`/api/graph/subgraph/${searchAddress}?depth=${selectedDepth}`)
        );
        const retryResult = await retryResponse.json();
        
        if (retryResult.status === 'success') {
          setGraphData(retryResult.data);
          setActiveTab('visualization');
        } else {
          setError('No graph data available for this address. Data import may be required.');
        }
      } else {
        setError(result.message || 'Failed to analyze network');
      }
    } catch (error) {
      console.error('Error analyzing network:', error);
      setError('Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkAnalysis = async () => {
    if (!searchAddress || !isValidEthereumAddress(searchAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/graph/network-analysis/${searchAddress}?depth=${selectedDepth}&min_value=${minValue}`)
      );
      const result = await response.json();
      
      if (result.status === 'success') {
        setNetworkAnalysis(result.data.network_analysis);
        setActiveTab('analysis');
      } else {
        setError(result.message || 'Failed to perform network analysis');
      }
    } catch (error) {
      console.error('Error performing network analysis:', error);
      setError('Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionPath = async () => {
    if (!fromAddress || !toAddress || !isValidEthereumAddress(fromAddress) || !isValidEthereumAddress(toAddress)) {
      setError('Please enter valid Ethereum addresses for both fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        buildApiUrl(`/api/graph/transaction-path?from=${fromAddress}&to=${toAddress}&depth=${selectedDepth}`)
      );
      const result = await response.json();
      
      if (result.status === 'success') {
        setPathData(result.data);
        setActiveTab('paths');
      } else if (result.status === 'no_path') {
        setError('No transaction path found between these addresses');
      } else {
        setError(result.message || 'Failed to find transaction path');
      }
    } catch (error) {
      console.error('Error finding transaction path:', error);
      setError('Failed to connect to backend service');
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!searchAddress || !isValidEthereumAddress(searchAddress)) {
      return;
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/graph/import-address-data/${searchAddress}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: 1000 })
        }
      );
      
      const result = await response.json();
      if (result.status === 'success') {
        console.log('Data imported successfully:', result.data);
      }
    } catch (error) {
      console.error('Error importing data:', error);
    }
  };

  const handleExportData = () => {
    if (!graphData) return;
    
    const exportData = {
      address: searchAddress,
      timestamp: new Date().toISOString(),
      graph_data: graphData,
      network_analysis: networkAnalysis
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graph-analysis-${searchAddress}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderVisualizationTab = () => {
    if (loading) {
      return (
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analyzing Network...
            </h3>
            <p className="text-gray-500">
              Fetching graph data from PostgreSQL and building visualization
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-96 flex items-center justify-center bg-red-50 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Analysis Failed
            </h3>
            <p className="text-red-600 max-w-md mb-4">
              {error}
            </p>
            <button
              onClick={handleAnalyzeNetwork}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      );
    }

    if (graphData) {
      return (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Main Graph Visualization */}
            <div className="xl:col-span-3">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Enhanced Network Visualization</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleExportData}
                      className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </button>
                  </div>
                </div>
                
                <VisJsGraph 
                  data={graphData}
                  height={600}
                  onNodeClick={(nodeId) => {
                    console.log('Node clicked:', nodeId);
                    const node = graphData.nodes.find(n => n.id === nodeId);
                    setSelectedNode(node || null);
                    // Auto-import related data when clicking high-risk nodes
                    if (node && (node.properties.risk_score || 0) >= 60) {
                      handleImportData();
                    }
                  }}
                  onNodeDoubleClick={async (nodeId) => {
                    console.log('Node double-clicked:', nodeId);
                    // Expand network from this node
                    setSearchAddress(nodeId);
                    await handleAnalyzeNetwork();
                  }}
                  onEdgeClick={(edgeId) => {
                    console.log('Edge clicked:', edgeId);
                    // Could show transaction details
                  }}
                  className="border border-gray-200 rounded-lg shadow-lg"
                />
              </div>
            </div>

            {/* Statistics Panel */}
            <div className="xl:col-span-1">
              <GraphStatsPanel
                data={graphData}
                selectedNode={selectedNode}
                onNodeFilter={(filter) => {
                  setNodeFilter(filter);
                  console.log('Node filter changed:', filter);
                }}
                onRiskFilter={(minRisk) => {
                  console.log('Risk filter changed:', minRisk);
                  // Could implement risk-based filtering in VisJsGraph
                }}
                className="sticky top-4"
              />
            </div>
          </div>

          {/* Graph Statistics Row */}
          <div className="mt-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
            
              <h4 className="text-lg font-semibold mb-4">Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Total Nodes</div>
                  <div className="text-2xl font-bold text-blue-900">{graphData.total_nodes}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Total Edges</div>
                  <div className="text-2xl font-bold text-green-900">{graphData.total_edges}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Analysis Depth</div>
                  <div className="text-2xl font-bold text-purple-900">{graphData.depth}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Center Address</div>
                  <div className="text-sm font-mono text-gray-800">{graphData.center_address.slice(0, 8)}...</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedNode ? `Selected: ${selectedNode.id.slice(0, 8)}...` : 'Click node to select'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Network className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready for Network Analysis
          </h3>
          <p className="text-gray-500 max-w-md">
            Enter an Ethereum address above to start exploring the blockchain network. 
            Our PostgreSQL-powered graph database will show connections, patterns, and insights.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Head>
        <title>Graph Analysis - Sentinel Enhanced</title>
        <meta name="description" content="Interactive blockchain network analysis with Vis.js visualization and PostgreSQL graph database" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Graph Analysis
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Advanced network visualization and transaction flow analysis using PostgreSQL graph database
            </p>
            {dbStats?.postgres_status === 'disconnected' && (
              <div className="mt-4 inline-flex items-center bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Demo Mode - Using Sample Data
              </div>
            )}
          </div>

          {/* Main Analysis Interface */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            
            {/* Search & Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Address Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Analyze Network Starting From Address
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      placeholder="0x... (Enter Ethereum address)"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAnalyzeNetwork}
                      disabled={loading || !searchAddress}
                      className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4 mr-2" />}
                      Analyze Network
                    </button>
                  </div>
                </div>

                {/* Quick Controls */}
                <div className="flex items-end space-x-4">
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Analysis
                  </button>
                  
                  <button 
                    onClick={handleExportData}
                    disabled={!graphData}
                    className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </button>

                  {/* Sample Address Quick Test */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSearchAddress('0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
                        setTimeout(() => handleAnalyzeNetwork(), 100);
                      }}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      DeFi User
                    </button>
                    <button
                      onClick={() => {
                        setSearchAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
                        setTimeout(() => handleAnalyzeNetwork(), 100);
                      }}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                    >
                      High Activity
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Controls */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Graph Depth
                    </label>
                    <select
                      value={selectedDepth}
                      onChange={(e) => setSelectedDepth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 hop (Direct connections)</option>
                      <option value={2}>2 hops (Recommended)</option>
                      <option value={3}>3 hops (Extended network)</option>
                      <option value={4}>4 hops (Full network)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Transaction Value (ETH)
                    </label>
                    <select
                      value={minValue}
                      onChange={(e) => setMinValue(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0}>All transactions</option>
                      <option value={0.01}>≥ 0.01 ETH</option>
                      <option value={0.1}>≥ 0.1 ETH</option>
                      <option value={1}>≥ 1 ETH</option>
                      <option value={10}>≥ 10 ETH</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Analysis Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm text-black">Show risk labels</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        <span className="text-sm text-black">Cluster similar nodes</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Tabs */}
            {(graphData || networkAnalysis) && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'visualization', label: 'Graph Visualization', icon: Network },
                      { id: 'analysis', label: 'Network Analysis', icon: Brain },
                      { id: 'paths', label: 'Transaction Paths', icon: TrendingUp }
                    ].map((tab) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="p-6">
                  {/* Analysis Tab */}
                  {activeTab === 'analysis' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Path Analysis</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              From Address
                            </label>
                            <input
                              type="text"
                              value={fromAddress}
                              onChange={(e) => setFromAddress(e.target.value)}
                              placeholder="0x..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              To Address
                            </label>
                            <input
                              type="text"
                              value={toAddress}
                              onChange={(e) => setToAddress(e.target.value)}
                              placeholder="0x..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={handleTransactionPath}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                          >
                            {loading ? <LoadingSpinner size="sm" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                            Find Path
                          </button>
                        </div>
                      </div>
                      
                      {networkAnalysis && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Network Analysis Results</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{networkAnalysis.total_nodes || 0}</div>
                              <div className="text-sm text-gray-500">Total Nodes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{networkAnalysis.total_edges || 0}</div>
                              <div className="text-sm text-gray-500">Connections</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{networkAnalysis.total_volume?.toFixed(2) || '0.00'} ETH</div>
                              <div className="text-sm text-gray-500">Total Volume</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-amber-600">{networkAnalysis.risk_assessment?.score || 0}</div>
                              <div className="text-sm text-gray-500">Risk Score</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Paths Tab */}
                  {activeTab === 'paths' && (
                    <div className="space-y-6">
                      {pathData ? (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Transaction Paths: {pathData.from_address?.slice(0, 8)}... → {pathData.to_address?.slice(0, 8)}...
                          </h3>
                          
                          <div className="mb-4">
                            <div className="text-sm text-gray-600">
                              Found {pathData.paths_found} path(s) between the addresses
                            </div>
                          </div>
                          
                          {pathData.paths?.map((path: any, index: number) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-sm font-medium">Path {index + 1}</div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{path.path_length} hop(s)</span>
                                  <span>{path.total_value?.toFixed(4)} ETH</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    path.risk_level === 'LOW' ? 'bg-green-100 text-green-800' :
                                    path.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    Risk: {path.risk_score} ({path.risk_level})
                                  </span>
                                  {path.confidence_score && (
                                    <span className="text-blue-600">
                                      Confidence: {(path.confidence_score * 100).toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 overflow-x-auto">
                                {path.nodes?.map((node: any, nodeIndex: number) => (
                                  <div key={nodeIndex} className="flex items-center">
                                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs whitespace-nowrap">
                                      {node.properties?.hash?.slice(0, 8)}...
                                      {node.properties?.balance && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          {node.properties.balance.toFixed(1)} ETH
                                        </div>
                                      )}
                                    </div>
                                    {nodeIndex < path.nodes.length - 1 && (
                                      <div className="flex flex-col items-center mx-2">
                                        <ArrowRight className="h-4 w-4 text-gray-400" />
                                        {path.relationships && path.relationships[nodeIndex] && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {path.relationships[nodeIndex].properties?.value?.toFixed(2)} ETH
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                          <div className="text-gray-400 mb-4">
                            <ArrowRight className="h-12 w-12 mx-auto" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Path Data</h3>
                          <p className="text-gray-500">Use the Analysis tab to find transaction paths between addresses</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Graph Visualization Area */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Network Visualization</h2>
                    <p className="text-gray-600">Interactive graph analysis powered by Vis.js and PostgreSQL</p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <Filter className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                {/* Visualization Tab */}
                {activeTab === 'visualization' && (
                  <div className="space-y-6">
                    {renderVisualizationTab()}
                  </div>
                )}
              </div>
            </div>

            {/* Features Overview */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Network className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Graph Data</h3>
                <p className="text-gray-600">
                  Real-time network analysis with data from The Graph Protocol and stored in PostgreSQL for fast querying.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Intelligent Analysis</h3>
                <p className="text-gray-600">
                  Advanced pattern detection, risk scoring, and network clustering using graph algorithms.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Scalable Architecture</h3>
                <p className="text-gray-600">
                  PostgreSQL graph database backend ensures fast queries across millions of addresses and transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
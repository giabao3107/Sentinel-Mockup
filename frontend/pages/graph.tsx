import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { Network, Brain, Search, Filter, Download, Settings, Maximize2, RefreshCw, Users, TrendingUp, AlertTriangle, Database, ArrowRight, AlertCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { buildApiUrl, isValidEthereumAddress } from '@/utils';

interface GraphNode {
  id: string;
  labels: string[];
  properties: {
    hash: string;
    risk_score?: number;
    transaction_count?: number;
    balance?: number;
  };
  size: number;
  color: string;
  label: string;
  group: string;
}

interface GraphEdge {
  id: string;
  type: string;
  start_node: string;
  end_node: string;
  properties: {
    value: number;
    timestamp?: string;
    transaction_hash?: string;
  };
  weight: number;
  color: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: GraphEdge[];
  total_nodes: number;
  total_relationships: number;
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
    high_risk_addresses: number;
    suspicious_patterns: string[];
  };
}

export default function GraphAnalysis() {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedDepth, setSelectedDepth] = useState(2);
  const [minValue, setMinValue] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'visualization' | 'analysis' | 'paths'>('visualization');
  
  // Data states
  const [dbStats, setDbStats] = useState<any>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [networkAnalysis, setNetworkAnalysis] = useState<any>(null);
  const [pathData, setPathData] = useState<any>(null);
  
  // Path analysis states
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');

  // Mock data when backend is not available
  const mockGraphStats = {
    address_count: 7,
    transaction_count: 5,
    sent_to_count: 10,
    interacted_with_count: 2,
    neo4j_status: "connected",
    fallback_mode: false
  };

  useEffect(() => {
    const fetchDatabaseStats = async () => {
      console.log('Using offline mode - mock data only');
      
      // Use enhanced mock data instead of backend calls
      setDbStats({
        address_count: 7,
        transaction_count: 5,
        sent_to_count: 10,
        interacted_with_count: 2,
        graph_density: 0.65,
        average_connections_per_address: 2.1,
        neo4j_status: "connected",
        fallback_mode: true,
        last_updated: new Date().toISOString(),
        data_coverage: "demo_data",
        backend_status: "offline_mode"
      });
      
      setLoading(false);
    };

    fetchDatabaseStats();
    // Remove interval since we're using static mock data
  }, []);

  const handleAnalyzeNetwork = async () => {
    if (!searchAddress || !isValidEthereumAddress(searchAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Using offline mode - returning mock graph data');
    
    // Use mock data instead of backend calls
    setGraphData({
      center_address: searchAddress,
      depth: selectedDepth,
      nodes: [
        { 
          id: searchAddress, 
          type: 'address', 
          properties: { 
            hash: searchAddress, 
            risk_score: 25,
            balance: 12.5,
            transaction_count: 145
          }
        },
        { 
          id: '0x1234567890123456789012345678901234567890', 
          type: 'address', 
          properties: { 
            hash: '0x1234567890123456789012345678901234567890', 
            risk_score: 15,
            balance: 8.2,
            transaction_count: 67
          }
        },
        { 
          id: '0x9876543210987654321098765432109876543210', 
          type: 'address', 
          properties: { 
            hash: '0x9876543210987654321098765432109876543210', 
            risk_score: 45,
            balance: 25.7,
            transaction_count: 234
          }
        }
      ],
      relationships: [
        { 
          from: searchAddress, 
          to: '0x1234567890123456789012345678901234567890', 
          type: 'SENT_TO', 
          properties: { value: 1.5, timestamp: '2024-01-15T10:30:00Z' }
        },
        { 
          from: '0x1234567890123456789012345678901234567890', 
          to: '0x9876543210987654321098765432109876543210', 
          type: 'SENT_TO', 
          properties: { value: 3.2, timestamp: '2024-01-16T14:20:00Z' }
        }
      ],
      total_nodes: 3,
      total_relationships: 2,
      analysis_mode: "offline_demo"
    });
    
    setActiveTab('visualization');
    setLoading(false);
  };

  const handleNetworkAnalysis = async () => {
    if (!searchAddress || !isValidEthereumAddress(searchAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log('Using offline mode - returning mock network analysis');
    
    // Use enhanced mock data
    setNetworkAnalysis({
      network_analysis: {
        center_address: searchAddress,
        network_depth: selectedDepth,
        total_nodes: 5,
        total_edges: 8,
        unique_addresses: 5,
        total_volume: 15.7,
        average_transaction_value: 1.96,
        risk_assessment: { 
          overall_risk: 'LOW', 
          score: 25,
          risk_factors: ['Regular trading pattern', 'No flagged interactions'],
          confidence: 0.85
        },
        network_metrics: {
          clustering_coefficient: 0.45,
          betweenness_centrality: 0.23,
          degree_distribution: [1, 2, 3, 2, 1]
        }
      },
      visualization_data: {
        nodes: [
          { id: searchAddress, type: 'address', x: 0, y: 0, radius: 20 },
          { id: '0x1234567890123456789012345678901234567890', type: 'address', x: 100, y: 50, radius: 15 },
          { id: '0x9876543210987654321098765432109876543210', type: 'address', x: -80, y: 70, radius: 18 }
        ],
        edges: [
          { from: searchAddress, to: '0x1234567890123456789012345678901234567890', weight: 1.5 },
          { from: searchAddress, to: '0x9876543210987654321098765432109876543210', weight: 2.3 }
        ]
      },
      analysis_mode: "offline_demo"
    });
    
    setLoading(false);
  };

  const handleTransactionPath = async () => {
    if (!fromAddress || !toAddress || !isValidEthereumAddress(fromAddress) || !isValidEthereumAddress(toAddress)) {
      setError('Please enter valid Ethereum addresses for both fields');
      return;
    }

    setLoading(true);
    setError('');
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Using offline mode - returning mock path data');
    
    // Use enhanced mock path data
    setPathData({
      from_address: fromAddress,
      to_address: toAddress,
      paths_found: 2,
      analysis_depth: selectedDepth,
      paths: [
        {
          path_id: 1,
          path_length: 2,
          total_value: 5.0,
          confidence_score: 0.92,
          nodes: [
            { id: fromAddress, type: 'address', properties: { hash: fromAddress, balance: 15.2 }},
            { id: '0x5555555555555555555555555555555555555555', type: 'address', properties: { hash: '0x5555555555555555555555555555555555555555', balance: 8.7 }},
            { id: toAddress, type: 'address', properties: { hash: toAddress, balance: 22.1 }}
          ],
          relationships: [
            { 
              from: fromAddress, 
              to: '0x5555555555555555555555555555555555555555', 
              type: 'SENT_TO', 
              properties: { value: 3.0, timestamp: '2024-01-20T09:15:00Z', gas_used: 21000 }
            },
            { 
              from: '0x5555555555555555555555555555555555555555', 
              to: toAddress, 
              type: 'SENT_TO', 
              properties: { value: 2.8, timestamp: '2024-01-20T09:16:30Z', gas_used: 21000 }
            }
          ],
          risk_score: 20,
          risk_level: 'LOW'
        },
        {
          path_id: 2,
          path_length: 3,
          total_value: 3.2,
          confidence_score: 0.78,
          nodes: [
            { id: fromAddress, type: 'address', properties: { hash: fromAddress, balance: 15.2 }},
            { id: '0x7777777777777777777777777777777777777777', type: 'address', properties: { hash: '0x7777777777777777777777777777777777777777', balance: 45.6 }},
            { id: '0x8888888888888888888888888888888888888888', type: 'address', properties: { hash: '0x8888888888888888888888888888888888888888', balance: 12.3 }},
            { id: toAddress, type: 'address', properties: { hash: toAddress, balance: 22.1 }}
          ],
          relationships: [
            { 
              from: fromAddress, 
              to: '0x7777777777777777777777777777777777777777', 
              type: 'SENT_TO', 
              properties: { value: 1.2, timestamp: '2024-01-18T14:30:00Z', gas_used: 21000 }
            },
            { 
              from: '0x7777777777777777777777777777777777777777', 
              to: '0x8888888888888888888888888888888888888888', 
              type: 'SENT_TO', 
              properties: { value: 1.0, timestamp: '2024-01-18T14:35:00Z', gas_used: 21000 }
            },
            { 
              from: '0x8888888888888888888888888888888888888888', 
              to: toAddress, 
              type: 'SENT_TO', 
              properties: { value: 0.9, timestamp: '2024-01-18T14:40:00Z', gas_used: 21000 }
            }
          ],
          risk_score: 35,
          risk_level: 'MEDIUM'
        }
      ],
      analysis_mode: "offline_demo"
    });
    
    setActiveTab('paths');
    setLoading(false);
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

  const renderVisualizationPlaceholder = () => {
    if (loading) {
      return (
        <div className="h-96 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analyzing Network...
            </h3>
            <p className="text-gray-500">
              Fetching graph data and building visualization
            </p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-96 flex items-center justify-center bg-red-50">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Analysis Failed
            </h3>
            <p className="text-red-600 max-w-md">
              {error}
            </p>
            <button
              onClick={handleAnalyzeNetwork}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      );
    }

    if (graphData) {
      return (
        <div className="h-96 bg-gray-900 relative overflow-hidden">
          {/* Graph visualization would go here - placeholder for D3.js */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <Network className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                Graph Loaded: {graphData.total_nodes} nodes, {graphData.total_relationships} edges
              </h3>
                                    <p className="text-gray-400">
                        D3.js visualization would render here with interactive network graph
                      </p>
            </div>
          </div>
          
          {/* Sample network overlay */}
          <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-3 text-white text-sm">
            <div>Center: {searchAddress.slice(0, 8)}...</div>
            <div>Depth: {selectedDepth} hops</div>
            <div>Nodes: {graphData.total_nodes}</div>
            <div>Edges: {graphData.total_relationships}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-96 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Network className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready for Network Analysis
          </h3>
          <p className="text-gray-500 max-w-md">
            Enter an Ethereum address above to start exploring the blockchain network. 
            Our advanced graph visualization will show connections, patterns, and insights.
          </p>
        </div>
      </div>
    );
  };

  // Network Visualization Component
  const NetworkVisualization = ({ data }: { data: any }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    
    useEffect(() => {
      if (!data || !svgRef.current) return;
      
      const svg = svgRef.current;
      const width = 600;
      const height = 400;
      
      // Clear previous content
      svg.innerHTML = '';
      
      // Create SVG content
      const svgContent = `
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>
      `;
      
      svg.innerHTML = svgContent;
      
      // Position nodes in a circle layout
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.25;
      
      data.nodes?.forEach((node: any, index: number) => {
        let x, y;
        
        if (node.id === data.center_address) {
          // Center node in the middle
          x = centerX;
          y = centerY;
        } else {
          // Other nodes in a circle around center
          const angle = ((index - 1) * 2 * Math.PI) / (data.nodes.length - 1);
          x = centerX + radius * Math.cos(angle);
          y = centerY + radius * Math.sin(angle);
        }
        
        const nodeRadius = node.id === data.center_address ? 25 : 20;
        const riskScore = node.properties?.risk_score || 0;
        
        // Create node circle with risk-based coloring
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x.toString());
        circle.setAttribute('cy', y.toString());
        circle.setAttribute('r', nodeRadius.toString());
        
        // Risk-based coloring
        let fillColor;
        if (node.id === data.center_address) {
          fillColor = '#3b82f6'; // Blue for center
        } else if (riskScore < 30) {
          fillColor = '#10b981'; // Green for low risk
        } else if (riskScore < 60) {
          fillColor = '#f59e0b'; // Yellow for medium risk
        } else {
          fillColor = '#ef4444'; // Red for high risk
        }
        
        circle.setAttribute('fill', fillColor);
        circle.setAttribute('stroke', '#ffffff');
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('class', 'cursor-pointer hover:opacity-80 transition-all duration-200');
        circle.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
        circle.style.cursor = 'pointer';
        
        // Add click interaction
        circle.addEventListener('click', () => {
          const message = `🔍 Address Details:\n\nAddress: ${node.properties?.hash}\nRisk Score: ${riskScore}/100\nBalance: ${node.properties?.balance || 0} ETH\nTransactions: ${node.properties?.transaction_count || 0}\n\n${node.id === data.center_address ? '🎯 Center Address' : '🔗 Connected Address'}`;
          alert(message);
        });
        
        // Add hover effects
        circle.addEventListener('mouseenter', () => {
          circle.setAttribute('r', (nodeRadius + 3).toString());
          circle.setAttribute('stroke-width', '4');
        });
        
        circle.addEventListener('mouseleave', () => {
          circle.setAttribute('r', nodeRadius.toString());
          circle.setAttribute('stroke-width', '3');
        });
        
        // Add hover tooltip effect
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${node.properties?.hash}\nRisk: ${riskScore}\nBalance: ${node.properties?.balance || 0} ETH`;
        circle.appendChild(title);
        
        // Create node label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x.toString());
        text.setAttribute('y', (y + nodeRadius + 15).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'text-xs fill-gray-700 font-medium');
        text.textContent = `${node.properties?.hash?.slice(0, 6)}...`;
        
        // Risk score badge inside the circle
        const riskText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        riskText.setAttribute('x', x.toString());
        riskText.setAttribute('y', (y + 4).toString());
        riskText.setAttribute('text-anchor', 'middle');
        riskText.setAttribute('class', 'text-xs fill-white font-bold');
        riskText.textContent = riskScore.toString();
        
        svg.appendChild(circle);
        svg.appendChild(text);
        svg.appendChild(riskText);
        
        // Store position for edges
        node._x = x;
        node._y = y;
        node._radius = nodeRadius;
      });
      
      // Draw edges
      data.relationships?.forEach((rel: any) => {
        const fromNode = data.nodes.find((n: any) => n.id === rel.from);
        const toNode = data.nodes.find((n: any) => n.id === rel.to);
        
        if (fromNode && toNode) {
          // Calculate edge start/end points on circle perimeters
          const dx = toNode._x - fromNode._x;
          const dy = toNode._y - fromNode._y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          const fromRadius = fromNode._radius || 20;
          const toRadius = toNode._radius || 20;
          
          const x1 = fromNode._x + (dx / length) * fromRadius;
          const y1 = fromNode._y + (dy / length) * fromRadius;
          const x2 = toNode._x - (dx / length) * toRadius;
          const y2 = toNode._y - (dy / length) * toRadius;
          
          // Create animated line
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x1.toString());
          line.setAttribute('y1', y1.toString());
          line.setAttribute('x2', x2.toString());
          line.setAttribute('y2', y2.toString());
          line.setAttribute('stroke', '#6b7280');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('marker-end', 'url(#arrowhead)');
          line.setAttribute('class', 'opacity-70 hover:opacity-100 transition-opacity duration-200');
          line.style.cursor = 'pointer';
          
          // Add edge click interaction
          line.addEventListener('click', () => {
            alert(`Transaction: ${rel.from.slice(0, 8)}... → ${rel.to.slice(0, 8)}...\nValue: ${rel.properties?.value?.toFixed(3)} ETH\nTimestamp: ${rel.properties?.timestamp || 'N/A'}`);
          });
          
          // Add dash animation for active connections
          line.setAttribute('stroke-dasharray', '5,5');
          line.setAttribute('stroke-dashoffset', '0');
          
          const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animate.setAttribute('attributeName', 'stroke-dashoffset');
          animate.setAttribute('values', '0;-10');
          animate.setAttribute('dur', '1s');
          animate.setAttribute('repeatCount', 'indefinite');
          line.appendChild(animate);
          
          svg.insertBefore(line, svg.firstChild?.nextSibling || svg.firstChild);
          
          // Edge label with enhanced styling
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          
          // Background for label
          const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const labelText = `${rel.properties?.value?.toFixed(1)} ETH`;
          const textWidth = labelText.length * 6; // Approximate width
          
          labelBg.setAttribute('x', (midX - textWidth/2 - 4).toString());
          labelBg.setAttribute('y', (midY - 10).toString());
          labelBg.setAttribute('width', (textWidth + 8).toString());
          labelBg.setAttribute('height', '16');
          labelBg.setAttribute('fill', '#ffffff');
          labelBg.setAttribute('stroke', '#e5e7eb');
          labelBg.setAttribute('stroke-width', '1');
          labelBg.setAttribute('rx', '4');
          labelBg.setAttribute('class', 'opacity-90');
          
          const edgeLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          edgeLabel.setAttribute('x', midX.toString());
          edgeLabel.setAttribute('y', (midY - 1).toString());
          edgeLabel.setAttribute('text-anchor', 'middle');
          edgeLabel.setAttribute('class', 'text-xs fill-blue-600 font-semibold');
          edgeLabel.textContent = labelText;
          
          svg.appendChild(labelBg);
          svg.appendChild(edgeLabel);
        }
      });
      
    }, [data]);
    
    if (!data) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Network className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No graph data to visualize</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox="0 0 600 400"
          className="border border-gray-200 rounded-lg bg-white"
        />
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-3 rounded-lg text-xs shadow-lg border border-gray-200">
          <div className="space-y-2">
            <div className="font-semibold text-gray-800 mb-2">Legend</div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-800">Center Address</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-800">Low Risk (0-29)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-800">Medium Risk (30-59)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-800">High Risk (60+)</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-gray-500 mr-2" style={{
                  background: 'repeating-linear-gradient(to right, #6b7280 0, #6b7280 5px, transparent 5px, transparent 10px)'
                }}></div>
                <span className="text-gray-800">Transaction Flow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Head>
        <title>Graph Analysis - Sentinel Enhanced</title>
        <meta name="description" content="Interactive blockchain network analysis with D3.js visualization and Neo4j graph database" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Graph Analysis
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Advanced network visualization and transaction flow analysis using Neo4j graph database
            </p>
            {dbStats?.backend_status === 'offline_mode' && (
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
                              <div className="text-2xl font-bold text-blue-600">{networkAnalysis.network_analysis?.total_nodes || 0}</div>
                              <div className="text-sm text-gray-500">Total Nodes</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{networkAnalysis.network_analysis?.total_edges || 0}</div>
                              <div className="text-sm text-gray-500">Connections</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{networkAnalysis.network_analysis?.total_volume?.toFixed(2) || '0.00'} ETH</div>
                              <div className="text-sm text-gray-500">Total Volume</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-amber-600">{networkAnalysis.network_analysis?.risk_assessment?.score || 0}</div>
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
                    <p className="text-gray-600">Interactive graph analysis powered by D3.js and Neo4j</p>
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
                    {graphData ? (
                      <div className="space-y-6">
                        {/* Network Graph */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Network Visualization: {graphData.center_address?.slice(0, 8)}...
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{graphData.total_nodes} nodes</span>
                              <span>•</span>
                              <span>{graphData.total_relationships} connections</span>
                              {graphData.analysis_mode === 'offline_demo' && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-600">Demo Data</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <NetworkVisualization data={graphData} />
                        </div>
                        
                        {/* Graph Statistics */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h4 className="text-md font-semibold text-gray-900 mb-4">Graph Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{graphData.total_nodes}</div>
                              <div className="text-sm text-blue-700">Total Nodes</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{graphData.total_relationships}</div>
                              <div className="text-sm text-green-700">Relationships</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">{graphData.depth}</div>
                              <div className="text-sm text-purple-700">Analysis Depth</div>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg">
                              <div className="text-2xl font-bold text-amber-600">
                                {Math.round(graphData.nodes?.reduce((sum: number, node: any) => sum + (node.properties?.risk_score || 0), 0) / (graphData.nodes?.length || 1))}
                              </div>
                              <div className="text-sm text-amber-700">Avg Risk Score</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Node Details */}
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                          <h4 className="text-md font-semibold text-gray-900 mb-4">Node Details</h4>
                          <div className="space-y-3">
                            {graphData.nodes?.map((node: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-4 h-4 rounded-full ${
                                    node.id === graphData.center_address ? 'bg-blue-500' : 'bg-green-500'
                                  }`}></div>
                                  <div>
                                    <div className="font-mono text-sm">{node.properties?.hash?.slice(0, 20)}...</div>
                                    <div className="text-xs text-gray-500">
                                      {node.properties?.balance && `${node.properties.balance} ETH`}
                                      {node.properties?.transaction_count && ` • ${node.properties.transaction_count} txns`}
                                    </div>
                                  </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  (node.properties?.risk_score || 0) < 30 ? 'bg-green-100 text-green-800' :
                                  (node.properties?.risk_score || 0) < 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  Risk: {node.properties?.risk_score || 0}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
                        <div className="text-gray-400 mb-4">
                          <Network className="h-12 w-12 mx-auto" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Graph Data</h3>
                        <p className="text-gray-500 mb-4">Enter an address above and click "Analyze Network" to visualize the transaction graph</p>
                      </div>
                    )}
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
                  Real-time network analysis with data from The Graph Protocol and stored in Neo4j for fast querying.
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
                  Neo4j graph database backend ensures fast queries across millions of addresses and transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
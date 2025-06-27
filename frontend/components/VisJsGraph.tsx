/**
 * Enhanced Vis.js Graph Visualization Component
 * Advanced interactive graph visualization for blockchain analysis
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface GraphNode {
  id: string;
  label: string;
  color: string;
  size: number;
  group: string;
  title?: string;
  properties: {
    hash?: string;
    risk_score?: number;
    transaction_count?: number;
    balance?: number;
    [key: string]: any;
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
    value?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  center_address?: string;
  depth?: number;
  visualization_config?: any;
}

interface VisJsGraphProps {
  data: GraphData | null;
  width?: string | number;
  height?: string | number;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  className?: string;
}

const VisJsGraph: React.FC<VisJsGraphProps> = ({
  data,
  width = '100%',
  height = 600,
  onNodeClick,
  onNodeDoubleClick,
  onEdgeClick,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [nodeFilter, setNodeFilter] = useState<string>('all');
  const [highlightConnected, setHighlightConnected] = useState(true);

  // Get risk color based on score
  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return '#dc2626'; // red-600
    if (riskScore >= 60) return '#ea580c'; // orange-600
    if (riskScore >= 40) return '#d97706'; // amber-600
    if (riskScore >= 20) return '#65a30d'; // lime-600
    return '#16a34a'; // green-600
  };

  // Get node size based on properties
  const getNodeSize = (node: GraphNode) => {
    const baseSize = 15;
    const riskMultiplier = (node.properties.risk_score || 0) / 100;
    const transactionMultiplier = Math.log10((node.properties.transaction_count || 1) + 1) / 3;
    return baseSize + (riskMultiplier * 15) + (transactionMultiplier * 10);
  };

  // Filter nodes based on criteria
  const filterNodes = useCallback((nodes: GraphNode[]) => {
    if (nodeFilter === 'all') return nodes;
    if (nodeFilter === 'high-risk') return nodes.filter(n => (n.properties.risk_score || 0) >= 60);
    if (nodeFilter === 'high-activity') return nodes.filter(n => (n.properties.transaction_count || 0) >= 10);
    return nodes;
  }, [nodeFilter]);

  // Highlight connected nodes
  const highlightNode = useCallback((nodeId: string | null) => {
    if (!networkRef.current || !data) return;

    const allNodes = data.nodes.map(node => node.id);
    const allEdges = data.edges.map(edge => `${edge.from}-${edge.to}`);

    if (!nodeId || !highlightConnected) {
      // Reset all nodes and edges
      networkRef.current.setData({
        nodes: new DataSet(data.nodes.map(node => ({
          id: node.id,
          color: {
            background: getRiskColor(node.properties.risk_score || 0),
            border: '#000000'
          },
          opacity: 1
        }))),
        edges: new DataSet(data.edges.map(edge => ({
          id: `${edge.from}-${edge.to}`,
          color: { color: edge.color },
          opacity: 1
        })))
      });
      return;
    }

    // Find connected nodes
    const connectedNodes = new Set([nodeId]);
    const connectedEdges = new Set<string>();

    data.edges.forEach(edge => {
      if (edge.from === nodeId || edge.to === nodeId) {
        connectedNodes.add(edge.from);
        connectedNodes.add(edge.to);
        connectedEdges.add(`${edge.from}-${edge.to}`);
      }
    });

    // Update node styles
    const updatedNodes = data.nodes.map(node => ({
      id: node.id,
      color: {
        background: getRiskColor(node.properties.risk_score || 0),
        border: connectedNodes.has(node.id) ? '#ffffff' : '#000000'
      },
      opacity: connectedNodes.has(node.id) ? 1 : 0.3
    }));

    // Update edge styles
    const updatedEdges = data.edges.map(edge => ({
      id: `${edge.from}-${edge.to}`,
      color: { 
        color: connectedEdges.has(`${edge.from}-${edge.to}`) ? edge.color : '#cccccc' 
      },
      opacity: connectedEdges.has(`${edge.from}-${edge.to}`) ? 1 : 0.3
    }));

    networkRef.current.setData({
      nodes: new DataSet(updatedNodes),
      edges: new DataSet(updatedEdges)
    });
  }, [data, highlightConnected]);

  // Initialize Vis.js network
  const initializeNetwork = useCallback(() => {
    if (!containerRef.current || !data || data.nodes.length === 0) return;

    try {
      setIsLoading(true);

      const filteredNodes = filterNodes(data.nodes);

      // Create datasets with enhanced styling
      const nodes = new DataSet(filteredNodes.map(node => ({
        id: node.id,
        label: node.label,
        color: {
          background: getRiskColor(node.properties.risk_score || 0),
          border: selectedNode?.id === node.id ? '#ffffff' : '#000000',
          highlight: {
            background: getRiskColor(node.properties.risk_score || 0),
            border: '#ffffff'
          }
        },
        size: getNodeSize(node),
        title: `
          <div style="padding: 8px; font-family: monospace;">
            <strong>${node.label}</strong><br/>
            Risk Score: ${node.properties.risk_score || 0}<br/>
            Transactions: ${node.properties.transaction_count || 0}<br/>
            ${node.properties.balance ? `Balance: ${node.properties.balance} ETH<br/>` : ''}
            Type: ${node.group}
          </div>
        `,
        group: node.group,
        font: {
          color: '#ffffff',
          size: 14,
          strokeWidth: 2,
          strokeColor: '#000000'
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.3)',
          size: 10,
          x: 3,
          y: 3
        },
        borderWidth: 3
      })));

      const edges = new DataSet(data.edges.map(edge => ({
        id: `${edge.from}-${edge.to}`,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        color: {
          color: edge.color,
          highlight: '#ff6b6b'
        },
        width: Math.max(2, (edge.properties.value || 0) / 10),
        title: `
          <div style="padding: 8px; font-family: monospace;">
            ${edge.from.slice(0, 8)}... → ${edge.to.slice(0, 8)}...<br/>
            Value: ${edge.properties.value || 0} ETH<br/>
            ${edge.properties.timestamp ? `Time: ${edge.properties.timestamp}<br/>` : ''}
          </div>
        `,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 1.2,
            type: 'arrow'
          }
        },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.3
        },
        shadow: {
          enabled: true,
          color: 'rgba(0,0,0,0.2)',
          size: 5,
          x: 2,
          y: 2
        }
      })));

      // Enhanced network options
      const options = {
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -80,
            centralGravity: 0.02,
            springLength: 150,
            springConstant: 0.12,
            damping: 0.6,
            avoidOverlap: 1
          },
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 25
          },
          adaptiveTimestep: true
        },
        nodes: {
          shape: 'dot',
          scaling: {
            min: 15,
            max: 40,
            label: {
              enabled: true,
              min: 12,
              max: 18
            }
          }
        },
        edges: {
          scaling: {
            min: 1,
            max: 8
          },
          smooth: {
            enabled: true,
            type: 'continuous',
            roundness: 0.3
          }
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: false,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true
        },
        layout: {
          improvedLayout: true,
          clusterThreshold: 150
        }
      };

      // Create new network
      if (networkRef.current) {
        networkRef.current.destroy();
      }
      
      networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

      // Enhanced event listeners
      networkRef.current.on('click', (event) => {
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0];
          const node = data.nodes.find(n => n.id === nodeId);
          setSelectedNode(node || null);
          setSelectedEdge(null);
          highlightNode(nodeId);
          onNodeClick?.(nodeId);
        } else if (event.edges.length > 0) {
          const edgeId = event.edges[0];
          const edge = data.edges.find(e => `${e.from}-${e.to}` === edgeId);
          setSelectedEdge(edge || null);
          setSelectedNode(null);
          onEdgeClick?.(edgeId);
        } else {
          setSelectedNode(null);
          setSelectedEdge(null);
          highlightNode(null);
        }
      });

      networkRef.current.on('doubleClick', (event) => {
        if (event.nodes.length > 0) {
          const nodeId = event.nodes[0];
          onNodeDoubleClick?.(nodeId);
          // Focus on node
          networkRef.current?.focus(nodeId, {
            scale: 1.5,
            animation: {
              duration: 800,
              easingFunction: 'easeInOutCubic'
            }
          });
        }
      });

      networkRef.current.on('hoverNode', (event) => {
        document.body.style.cursor = 'pointer';
      });

      networkRef.current.on('blurNode', () => {
        document.body.style.cursor = 'default';
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing Vis.js network:', error);
      setIsLoading(false);
    }
  }, [data, selectedNode, nodeFilter, filterNodes, highlightNode, onNodeClick, onNodeDoubleClick, onEdgeClick]);

  useEffect(() => {
    initializeNetwork();
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [initializeNetwork]);

  // Control functions
  const fitNetwork = () => {
    networkRef.current?.fit({
      animation: {
        duration: 800,
        easingFunction: 'easeInOutCubic'
      }
    });
  };

  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  const togglePhysics = () => {
    if (networkRef.current) {
      const newPhysicsState = !physicsEnabled;
      networkRef.current.setOptions({ physics: { enabled: newPhysicsState } });
      setPhysicsEnabled(newPhysicsState);
    }
  };

  if (!data || data.nodes.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-2">No Graph Data</div>
          <div className="text-gray-500 text-sm">
            Import address data to visualize transaction networks
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        style={{ width, height }}
        className="border border-gray-300 rounded-lg bg-gray-900"
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Initializing Enhanced Graph...</div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-200 space-y-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={fitNetwork}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Fit View
            </button>
            <button
              onClick={togglePhysics}
              className={`px-3 py-1 text-white rounded text-sm transition-colors ${
                physicsEnabled 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Physics: {physicsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Filter Nodes:</label>
            <select
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
              className="w-full text-xs border rounded px-2 py-1"
            >
              <option value="all">All Nodes</option>
              <option value="high-risk">High Risk (≥60)</option>
              <option value="high-activity">High Activity (≥10 tx)</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="highlight"
              checked={highlightConnected}
              onChange={(e) => setHighlightConnected(e.target.checked)}
              className="text-xs"
            />
            <label htmlFor="highlight" className="text-xs text-gray-600">
              Highlight Connected
            </label>
          </div>
        </div>
      )}

      {/* Node Detail Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 rounded-lg p-4 shadow-lg border border-gray-200 min-w-64">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-mono text-xs">
                  {selectedNode.id.slice(0, 10)}...{selectedNode.id.slice(-8)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Score:</span>
                <span className={`font-semibold ${
                  (selectedNode.properties.risk_score || 0) >= 60 ? 'text-red-600' : 
                  (selectedNode.properties.risk_score || 0) >= 40 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {selectedNode.properties.risk_score || 0}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Transactions:</span>
                <span>{selectedNode.properties.transaction_count || 0}</span>
              </div>
              
              {selectedNode.properties.balance && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Balance:</span>
                  <span>{selectedNode.properties.balance} ETH</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="capitalize">{selectedNode.group}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graph Info Panel */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg border border-gray-200 text-sm">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">Graph Info</span>
            <button
              onClick={() => setShowControls(!showControls)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showControls ? 'Hide' : 'Show'} Controls
            </button>
          </div>
          <div className="text-gray-600">Nodes: {filterNodes(data.nodes).length}/{data.nodes.length}</div>
          <div className="text-gray-600">Edges: {data.edges.length}</div>
          {data.center_address && (
            <div className="text-gray-600">
              Center: {data.center_address.slice(0, 8)}...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisJsGraph; 
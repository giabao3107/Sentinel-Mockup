/**
 * Investigation Canvas - Phase 2 Interactive Graph Visualization
 * D3.js force-directed graph for network analysis
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GraphNode {
  id: string;
  type: 'address' | 'transaction' | 'contract';
  properties: {
    hash?: string;
    risk_score?: number;
    transaction_count?: number;
    balance?: number;
    [key: string]: any;
  };
  size: number;
  color: string;
  label: string;
  group: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

interface GraphRelationship {
  id: string;
  type: 'SENT_TO' | 'INTERACTED_WITH';
  start_node: string;
  end_node: string;
  properties: {
    value?: number;
    timestamp?: string;
    [key: string]: any;
  };
  weight: number;
  color: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  center_address?: string;
  depth?: number;
  visualization_config?: any;
}

interface InvestigationCanvasProps {
  data: GraphData | null;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeRightClick?: (node: GraphNode) => void;
  onRelationshipClick?: (relationship: GraphRelationship) => void;
  className?: string;
}

const InvestigationCanvas: React.FC<InvestigationCanvasProps> = ({
  data,
  width = 1200,
  height = 800,
  onNodeClick,
  onNodeRightClick,
  onRelationshipClick,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simplified visualization without D3 for now - will be enhanced in actual implementation
  const renderSimpleGraph = useCallback(() => {
    if (!data || !canvasRef.current) return;

    const container = canvasRef.current;
    container.innerHTML = '';

    // Create a simple network visualization
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());
    svg.style.background = '#fafafa';

    // Position nodes in a circle for simple layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    data.nodes.forEach((node, index) => {
      const angle = (index / data.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      // Create node circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', node.size.toString());
      circle.setAttribute('fill', node.color);
      circle.setAttribute('stroke', selectedNode === node.id ? '#1f2937' : '#ffffff');
      circle.setAttribute('stroke-width', selectedNode === node.id ? '3' : '1');
      circle.style.cursor = 'pointer';

      // Add click handler
      circle.addEventListener('click', () => {
        setSelectedNode(node.id);
        onNodeClick?.(node);
      });

      // Add context menu handler
      circle.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        onNodeRightClick?.(node);
      });

      svg.appendChild(circle);

      // Add label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', (y + node.size + 15).toString());
      text.setAttribute('text-anchor', 'middle');
      text.textContent = node.label;
      text.style.fontSize = '12px';
      text.style.fontFamily = 'Inter, sans-serif';
      text.style.fill = '#374151';
      text.style.pointerEvents = 'none';

      svg.appendChild(text);

      // Add risk indicator for high-risk nodes
      if (node.properties.risk_score && node.properties.risk_score >= 70) {
        const warning = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        warning.setAttribute('x', (x + node.size - 5).toString());
        warning.setAttribute('y', (y - node.size + 5).toString());
        warning.textContent = '⚠️';
        warning.style.fontSize = '14px';
        warning.style.pointerEvents = 'none';
        svg.appendChild(warning);
      }

      // Store position for relationships
      node.x = x;
      node.y = y;
    });

    // Draw relationships
    data.relationships.forEach(rel => {
      const sourceNode = data.nodes.find(n => n.id === rel.start_node);
      const targetNode = data.nodes.find(n => n.id === rel.end_node);

      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        line.setAttribute('stroke', rel.color);
        line.setAttribute('stroke-width', Math.max(1, rel.weight).toString());
        line.style.cursor = 'pointer';

        // Add click handler
        line.addEventListener('click', () => {
          onRelationshipClick?.(rel);
        });

        svg.appendChild(line);
      }
    });

    container.appendChild(svg);
  }, [data, width, height, selectedNode, onNodeClick, onNodeRightClick, onRelationshipClick]);

  useEffect(() => {
    renderSimpleGraph();
  }, [renderSimpleGraph]);

  const centerGraph = useCallback(() => {
    // Reset to center view
    renderSimpleGraph();
  }, [renderSimpleGraph]);

  const zoomToFit = useCallback(() => {
    // Fit graph to view
    renderSimpleGraph();
  }, [renderSimpleGraph]);

  const expandNode = useCallback((nodeId: string) => {
    setIsLoading(true);
    // This would trigger expansion of a node's connections
    console.log('Expanding node:', nodeId);
    // Implementation would call API to get expanded subgraph
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  if (!data || data.nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg ${className}`} 
           style={{ width, height }}>
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
    <div className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={centerGraph}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          Center
        </button>
        <button
          onClick={zoomToFit}
          className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 shadow-sm"
        >
          Fit
        </button>
        <div className="px-3 py-1 bg-white border border-gray-300 rounded text-sm shadow-sm">
          Nodes: {data.nodes.length}
        </div>
      </div>

      {/* Graph Info */}
      <div className="absolute top-4 right-4 z-10 bg-white border border-gray-300 rounded p-3 shadow-sm">
        <div className="text-sm font-medium text-gray-900">Network Stats</div>
        <div className="text-xs text-gray-600 mt-1">
          <div>Nodes: {data.nodes.length}</div>
          <div>Edges: {data.relationships.length}</div>
          {data.center_address && (
            <div>Center: {data.center_address.slice(0, 8)}...</div>
          )}
          {data.depth && (
            <div>Depth: {data.depth}</div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white border border-gray-300 rounded p-3 shadow-sm">
        <div className="text-sm font-medium text-gray-900 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Medium Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>High Risk</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Smart Contract</span>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span>Expanding network...</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full"
        style={{ width, height }}
      />

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute top-20 right-4 z-10 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
          {(() => {
            const node = data.nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            
            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Node Details</h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {node.type}
                  </div>
                  {node.properties.hash && (
                    <div>
                      <span className="font-medium">Address:</span>
                      <div className="font-mono text-xs break-all">{node.properties.hash}</div>
                    </div>
                  )}
                  {node.properties.risk_score !== undefined && (
                    <div>
                      <span className="font-medium">Risk Score:</span> {node.properties.risk_score}/100
                    </div>
                  )}
                  {node.properties.transaction_count && (
                    <div>
                      <span className="font-medium">Transactions:</span> {node.properties.transaction_count}
                    </div>
                  )}
                  {node.properties.balance && (
                    <div>
                      <span className="font-medium">Balance:</span> {node.properties.balance} ETH
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => expandNode(node.id)}
                    className="w-full px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Expand Connections
                  </button>
                  {onNodeClick && (
                    <button
                      onClick={() => onNodeClick(node)}
                      className="w-full px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default InvestigationCanvas; 
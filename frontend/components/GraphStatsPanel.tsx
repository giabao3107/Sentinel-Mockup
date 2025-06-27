/**
 * Graph Statistics Panel Component
 * Real-time statistics and advanced controls for graph visualization
 */

import React from 'react';
import { TrendingUp, Users, Activity, AlertTriangle, Target, Zap } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  color: string;
  size: number;
  group: string;
  properties: {
    risk_score?: number;
    transaction_count?: number;
    balance?: number;
    [key: string]: any;
  };
}

interface GraphEdge {
  from: string;
  to: string;
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
}

interface GraphStatsPanelProps {
  data: GraphData | null;
  selectedNode: GraphNode | null;
  onNodeFilter: (filter: string) => void;
  onRiskFilter: (minRisk: number) => void;
  className?: string;
}

const GraphStatsPanel: React.FC<GraphStatsPanelProps> = ({
  data,
  selectedNode,
  onNodeFilter,
  onRiskFilter,
  className = ''
}) => {
  if (!data || data.nodes.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="text-center text-gray-500">
          No graph data available
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalNodes = data.nodes.length;
  const totalEdges = data.edges.length;
  const highRiskNodes = data.nodes.filter(n => (n.properties.risk_score || 0) >= 60).length;
  const totalValue = data.edges.reduce((sum, edge) => sum + (edge.properties.value || 0), 0);
  const avgRiskScore = data.nodes.reduce((sum, node) => sum + (node.properties.risk_score || 0), 0) / totalNodes;
  const highActivityNodes = data.nodes.filter(n => (n.properties.transaction_count || 0) >= 10).length;

  // Node type distribution
  const nodeTypes = data.nodes.reduce((acc, node) => {
    acc[node.group] = (acc[node.group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Risk distribution
  const riskRanges = {
    'Low (0-20)': data.nodes.filter(n => (n.properties.risk_score || 0) < 20).length,
    'Medium (20-40)': data.nodes.filter(n => {
      const risk = n.properties.risk_score || 0;
      return risk >= 20 && risk < 40;
    }).length,
    'High (40-60)': data.nodes.filter(n => {
      const risk = n.properties.risk_score || 0;
      return risk >= 40 && risk < 60;
    }).length,
    'Critical (60+)': data.nodes.filter(n => (n.properties.risk_score || 0) >= 60).length
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
          Network Statistics
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Total Nodes</div>
                <div className="text-2xl font-bold text-blue-900">{totalNodes}</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">Total Edges</div>
                <div className="text-2xl font-bold text-green-900">{totalEdges}</div>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-red-600 font-medium">High Risk</div>
                <div className="text-2xl font-bold text-red-900">{highRiskNodes}</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-purple-600 font-medium">Total Volume</div>
                <div className="text-2xl font-bold text-purple-900">{totalValue.toFixed(2)}</div>
                <div className="text-xs text-purple-600">ETH</div>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Average Risk Score */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Average Risk Score</span>
            <span className={`text-lg font-bold ${
              avgRiskScore >= 60 ? 'text-red-600' : 
              avgRiskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {avgRiskScore.toFixed(1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                avgRiskScore >= 60 ? 'bg-red-500' : 
                avgRiskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${avgRiskScore}%` }}
            ></div>
          </div>
        </div>

        {/* Node Type Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Node Types</h4>
          <div className="space-y-2">
            {Object.entries(nodeTypes).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{type}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{count}</span>
                  <button
                    onClick={() => onNodeFilter(type)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Filter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Distribution</h4>
          <div className="space-y-2">
            {Object.entries(riskRanges).map(([range, count]) => {
              const percentage = totalNodes > 0 ? (count / totalNodes * 100) : 0;
              const [label, rangeText] = range.split(' ');
              const isHigh = label === 'Critical' || label === 'High';
              
              return (
                <div key={range} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{range}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      {isHigh && count > 0 && (
                        <button
                          onClick={() => onRiskFilter(label === 'Critical' ? 60 : 40)}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                        >
                          Focus
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        isHigh ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Target className="h-4 w-4 mr-1" />
              Selected Node
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Address:</span>
                <span className="text-xs font-mono">{selectedNode.id.slice(0, 8)}...{selectedNode.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Risk Score:</span>
                <span className={`text-xs font-semibold ${
                  (selectedNode.properties.risk_score || 0) >= 60 ? 'text-red-600' : 
                  (selectedNode.properties.risk_score || 0) >= 40 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {selectedNode.properties.risk_score || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-600">Transactions:</span>
                <span className="text-xs font-medium">{selectedNode.properties.transaction_count || 0}</span>
              </div>
              {selectedNode.properties.balance && (
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Balance:</span>
                  <span className="text-xs font-medium">{selectedNode.properties.balance} ETH</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onNodeFilter('all')}
              className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              Show All
            </button>
            <button
              onClick={() => onRiskFilter(60)}
              className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              High Risk Only
            </button>
            <button
              onClick={() => onNodeFilter('high-activity')}
              className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              High Activity
            </button>
            <button
              onClick={() => onRiskFilter(0)}
              className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphStatsPanel; 
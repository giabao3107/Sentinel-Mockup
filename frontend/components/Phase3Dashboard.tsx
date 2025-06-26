import React, { useState, useEffect } from 'react';

// Phase 3 Intelligence Interface Types
interface Phase3Intelligence {
  address: string;
  analysis_version: string;
  services_used: string[];
  intelligence_summary: {
    gnn_risk_score: number;
    gnn_classification: string;
    cross_chain_risk_score: number;
    aggregate_risk_score: number;
    aggregate_risk_level: string;
    confidence_score: number;
    total_chains: number;
  };
  detailed_analysis: {
    gnn_assessment: any;
    multichain_analysis: any;
    network_analysis: any;
  };
  actionable_intelligence: {
    immediate_actions: string[];
    recommendations: string[];
    monitoring_suggestions: string[];
    next_steps: string[];
  };
}

interface Phase3DashboardProps {
  address: string;
}

const Phase3Dashboard: React.FC<Phase3DashboardProps> = ({ address }) => {
  const [intelligence, setIntelligence] = useState<Phase3Intelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'gnn' | 'multichain' | 'network' | 'alerts'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchIntelligence();
    }
  }, [address]);

  const fetchIntelligence = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/v3/intelligence/${address}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setIntelligence(data.data);
      } else {
        setError(data.error || 'Failed to fetch intelligence');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    if (score >= 20) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing with Phase 3 Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="mt-4 text-red-600">{error}</p>
          <button
            onClick={fetchIntelligence}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Enter an address to begin Phase 3 analysis</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Phase 3 Intelligence</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Advanced Threat Intelligence • {intelligence.analysis_version}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  {intelligence.services_used.length} AI Services
                </span>
                <div className="flex items-center">
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(intelligence.intelligence_summary.aggregate_risk_score)}`}>
                    Risk Score: {intelligence.intelligence_summary.aggregate_risk_score}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'gnn', name: 'GNN Analysis', icon: '🧠' },
              { id: 'multichain', name: 'Multi-Chain', icon: '⛓️' },
              { id: 'network', name: 'Network', icon: '🕸️' },
              { id: 'alerts', name: 'Alerts', icon: '🚨' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab intelligence={intelligence} />
        )}
        {activeTab === 'gnn' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🧠 GNN Analysis</h3>
            <p className="text-gray-600">Advanced neural network analysis results will be displayed here.</p>
          </div>
        )}
        {activeTab === 'multichain' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">⛓️ Multi-Chain Analysis</h3>
            <p className="text-gray-600">Cross-chain activity analysis will be displayed here.</p>
          </div>
        )}
        {activeTab === 'network' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🕸️ Network Analysis</h3>
            <p className="text-gray-600">Network behavior and cluster analysis will be displayed here.</p>
          </div>
        )}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🚨 Alert System</h3>
            <p className="text-gray-600">Alert management and monitoring suggestions will be displayed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ intelligence: Phase3Intelligence }> = ({ intelligence }) => {
  const summary = intelligence.intelligence_summary;
  
  return (
    <div className="space-y-6">
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">🧠</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">GNN Risk Score</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.gnn_risk_score}</p>
              <p className="text-sm text-gray-600">{summary.gnn_classification}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">⛓️</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cross-Chain Risk</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.cross_chain_risk_score}</p>
              <p className="text-sm text-gray-600">{summary.total_chains} chains</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">📈</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aggregate Risk</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.aggregate_risk_score}</p>
              <p className="text-sm text-gray-600">{summary.aggregate_risk_level}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl">🎯</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Confidence</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(summary.confidence_score * 100)}%</p>
              <p className="text-sm text-gray-600">Analysis Quality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Used */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">AI Services Utilized</h3>
        <div className="flex flex-wrap gap-2">
          {intelligence.services_used.map((service, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
            >
              {service.replace('_', ' ').toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Actionable Intelligence Preview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Immediate Actions Required</h3>
        {intelligence.actionable_intelligence.immediate_actions.length > 0 ? (
          <ul className="space-y-2">
            {intelligence.actionable_intelligence.immediate_actions.map((action, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">⚠️</span>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No immediate actions required</p>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
        <ul className="space-y-2">
          {intelligence.actionable_intelligence.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-gray-700">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Phase3Dashboard;
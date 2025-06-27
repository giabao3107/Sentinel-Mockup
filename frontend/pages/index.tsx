import { useState } from 'react';
import Head from 'next/head';
import { Search, Activity, TrendingUp, Network, Zap, Globe, Brain, AlertTriangle, ChevronRight, Star, GitBranch, Shield } from 'lucide-react';
import WalletSearch from '@/components/WalletSearch';
import WalletDashboard from '@/components/WalletDashboard';
import Layout from '@/components/Layout';
import { WalletAnalysisResponse } from '@/types';
import { buildApiUrl, fetchWithFallback } from '@/utils';

export default function Home() {
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<WalletAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWalletSearch = async (address: string) => {
    setLoading(true);
    setError(null);
    setCurrentAddress(address);
    
    try {
      const response = await fetchWithFallback(buildApiUrl(`/api/v1/wallet/${address}`));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze wallet');
      }
      
      const data: WalletAnalysisResponse = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Sentinel - Enhanced Threat Intelligence Platform</title>
        <meta name="description" content="Advanced blockchain threat intelligence with graph analysis, social intelligence, and real-time monitoring" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
            <div className="text-center">
              {/* Logo with Animation */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <Shield className="h-12 w-12 text-primary-600" />
                  </div>
                </div>
              </div>
              
              {/* Enhanced Title */}
              <div className="mb-6">
                <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 mb-4">
                  Sentinel
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Enhanced</span>
                </h1>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    Phase 2 • Graph Analysis
                  </span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    Live
                  </span>
                </div>
              </div>
              
              <p className="text-xl lg:text-2xl text-gray-600 mb-6 max-w-4xl mx-auto">
                Next-Generation Blockchain Threat Intelligence Platform
              </p>
              
              <p className="text-lg text-gray-500 mb-16 max-w-3xl mx-auto">
                Advanced wallet forensics with graph neural networks, social intelligence, 
                and real-time threat monitoring for comprehensive Web3 security analysis.
              </p>

              {/* Enhanced Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
                <div className="group bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Network className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Graph Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Interactive network visualization with D3.js and Neo4j graph database
                  </p>
                </div>
                
                <div className="group bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Intelligence</h3>
                  <p className="text-gray-600 text-sm">
                    Machine learning models for pattern recognition and threat detection
                  </p>
                </div>
                
                <div className="group bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Globe className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Intel</h3>
                  <p className="text-gray-600 text-sm">
                    Off-chain data correlation from social media and reputation systems
                  </p>
                </div>

                <div className="group bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                      <Zap className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Alerts</h3>
                  <p className="text-gray-600 text-sm">
                    Proactive monitoring with custom triggers and instant notifications
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Enhanced Forensics Dashboard
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                Enter an Ethereum wallet address to perform comprehensive threat intelligence analysis 
                with graph visualization, social correlation, and behavioral profiling.
              </p>
            </div>
            
            <WalletSearch 
              onSearch={handleWalletSearch}
              loading={loading}
            />

            {/* Quick Demo Addresses */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-3">Try these example addresses:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: "High Activity", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
                  { label: "DeFi User", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" },
                  { label: "Exchange", address: "0x28C6c06298d514Db089934071355E5743bf21d60" }
                ].map((demo, index) => (
                  <button
                    key={index}
                    onClick={() => handleWalletSearch(demo.address)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(analysisData || loading || error) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <WalletDashboard
              address={currentAddress}
              data={analysisData}
              loading={loading}
              error={error}
            />
          </div>
        )}

        {/* Phase Comparison Section */}
        <div className="bg-white/50 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Evolution</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover the complete journey of Sentinel's transformation from basic monitoring to advanced threat intelligence
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Phase 1 */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 opacity-75">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-gray-600">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Phase 1: Foundation</h3>
                    <span className="text-sm text-gray-500">Completed</span>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Search className="h-4 w-4 mr-2 text-gray-400" />
                    Basic Wallet Lookup
                  </li>
                  <li className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-gray-400" />
                    Simple Risk Scoring
                  </li>
                  <li className="flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-gray-400" />
                    Etherscan Integration
                  </li>
                  <li className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-gray-400" />
                    Transaction Flagging
                  </li>
                </ul>
              </div>

              {/* Phase 2 - Current */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
                  Current
                </div>
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-white">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Phase 2: Enhanced Intelligence</h3>
                    <span className="text-sm text-blue-600">Production Ready</span>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-center">
                    <Network className="h-4 w-4 mr-2 text-blue-500" />
                    Interactive Graph Visualization
                  </li>
                  <li className="flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-blue-500" />
                    Neo4j Graph Database
                  </li>
                  <li className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-blue-500" />
                    Social Intelligence Layer
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-blue-500" />
                    Real-time Alert System
                  </li>
                </ul>
              </div>

              {/* Phase 3 - Future */}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 relative">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-purple-600">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Phase 3: AI-Powered Analytics</h3>
                    <span className="text-sm text-purple-600">Development Roadmap</span>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-purple-400" />
                    Graph Neural Networks (GNN)
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-purple-400" />
                    Predictive Risk Modeling
                  </li>
                  <li className="flex items-center">
                    <Globe className="h-4 w-4 mr-2 text-purple-400" />
                    Multi-chain Support
                  </li>
                  <li className="flex items-center">
                    <Network className="h-4 w-4 mr-2 text-purple-400" />
                    Enterprise API Gateway
                  </li>
                </ul>
              </div>
            </div>

            {/* Enhanced stats */}
            <div className="mt-16 text-center">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-blue-600 mb-2">1M+</div>
                  <div className="text-sm text-gray-600">Addresses Analyzed</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-green-600 mb-2">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime SLA</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-purple-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Real-time Monitoring</div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-amber-600 mb-2">50ms</div>
                  <div className="text-sm text-gray-600">Average Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </Layout>
  );
} 
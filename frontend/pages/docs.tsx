import Head from 'next/head';
import { 
  BookOpen, Code, Zap, Shield, Users, Download, Settings, Terminal, 
  Database, Globe, Brain, Network, AlertCircle, Mail, Github, 
  ExternalLink, Play, CheckCircle, Copy, ArrowRight, Star, Layers,
  Activity, TrendingUp, MessageSquare, Twitter, Heart, Eye, FileText
} from 'lucide-react';
import Layout from '@/components/Layout';

export default function Documentation() {
  return (
    <Layout>
      <Head>
        <title>Documentation - Sentinel Enhanced</title>
        <meta name="description" content="Documentation and API reference for Sentinel platform" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <BookOpen className="h-12 w-12 text-indigo-600" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Documentation</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
                Complete guides, API reference, and developer resources
              </p>
              
              <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
                Everything you need to integrate Sentinel's threat intelligence platform into your 
                security workflow, from basic usage to advanced customization.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/90 hover:shadow-xl hover:border-green-200 transition-all duration-300">
                  <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-center">Getting Started</h3>
                  <p className="text-sm text-gray-600 text-center">Quick start guide and basic concepts</p>
                  <div className="mt-4 flex justify-center">
                    <ArrowRight className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                
                <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/90 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
                  <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Code className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-center">API Reference</h3>
                  <p className="text-sm text-gray-600 text-center">Complete endpoint documentation</p>
                  <div className="mt-4 flex justify-center">
                    <ArrowRight className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                
                <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/90 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
                  <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                    <Shield className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-center">Advanced Features</h3>
                  <p className="text-sm text-gray-600 text-center">Graph analysis and customization</p>
                  <div className="mt-4 flex justify-center">
                    <ArrowRight className="h-4 w-4 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Quick Start Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <Zap className="h-8 w-8 text-green-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Quick Start Guide</h2>
              </div>
              
              <div className="space-y-8">
                <div className="border-l-4 border-green-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Download className="h-6 w-6 text-green-500 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">1. Installation</h3>
                  </div>
                  <p className="text-gray-600 mb-3">Clone the repository and install dependencies</p>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto relative group">
                    <button className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="h-4 w-4" />
                    </button>
                    <code className="text-green-400 text-sm">
                      git clone https://github.com/giabao3107/Sentinel_Mockup.git<br/>
                      cd Sentinel_Mockup<br/>
                      npm install && pip install -r requirements.txt
                    </code>
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Settings className="h-6 w-6 text-blue-500 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">2. Configuration</h3>
                  </div>
                  <p className="text-gray-600 mb-3">Set up your environment variables</p>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto relative group">
                    <button className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="h-4 w-4" />
                    </button>
                    <code className="text-green-400 text-sm">
                      # Copy environment template<br/>
                      cp .env.example .env<br/>
                      <br/>
                      # Configure your settings<br/>
                      ETHERSCAN_API_KEY=your_api_key_here<br/>
                      DATABASE_URL=postgresql://sentinel:password@localhost:5432/sentinel
                    </code>
                  </div>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6">
                  <div className="flex items-center mb-3">
                    <Play className="h-6 w-6 text-purple-500 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900">3. Start Services</h3>
                  </div>
                  <p className="text-gray-600 mb-3">Launch all required services</p>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto relative group">
                    <button className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Copy className="h-4 w-4" />
                    </button>
                    <code className="text-green-400 text-sm">
                      # Start PostgreSQL database<br/>
                      docker-compose up postgres -d<br/>
                      <br/>
                      # Start backend API<br/>
                      cd backend && python run.py<br/>
                      <br/>
                      # Start frontend (new terminal)<br/>
                      cd frontend && npm run dev
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">Platform Status</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-700">Frontend:</span>
                    </div>
                    <span className="flex items-center font-medium text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Phase 2 Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center">
                      <Terminal className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-700">Backend API:</span>
                    </div>
                    <span className="flex items-center font-medium text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Production
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-700">Graph Database:</span>
                    </div>
                    <span className="flex items-center font-medium text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      PostgreSQL
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-700">Alert System:</span>
                    </div>
                    <span className="flex items-center font-medium text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
                <div className="flex items-center mb-4">
                  <Star className="h-6 w-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-purple-900">Core Features</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center p-2 bg-white/50 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-600 mr-3" />
                    <span className="text-purple-700">Wallet Risk Analysis</span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg">
                    <Network className="h-4 w-4 text-purple-600 mr-3" />
                    <span className="text-purple-700">Graph Visualization</span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-purple-600 mr-3" />
                    <span className="text-purple-700">Social Intelligence</span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-purple-600 mr-3" />
                    <span className="text-purple-700">Real-time Alerts</span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg">
                    <Code className="h-4 w-4 text-purple-600 mr-3" />
                    <span className="text-purple-700">REST API</span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 rounded-lg">
                    <Layers className="h-4 w-4 text-purple-600 mr-3" />
                    <span className="text-purple-700">Multi-chain Support</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg">
                <div className="flex items-center mb-4">
                  <Heart className="h-6 w-6 text-amber-600 mr-2" />
                  <h3 className="text-lg font-semibold text-amber-900">Quick Links</h3>
                </div>
                <div className="space-y-2">
                  <a 
                    href="https://github.com/giabao3107/Sentinel_Mockup.git"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center p-3 bg-white/60 hover:bg-white/80 rounded-lg transition-colors group"
                  >
                    <Github className="h-4 w-4 text-amber-600 mr-3" />
                    <span className="text-amber-700 font-medium">View Source Code</span>
                    <ArrowRight className="h-4 w-4 text-amber-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <button className="w-full flex items-center p-3 bg-white/60 hover:bg-white/80 rounded-lg transition-colors group">
                    <FileText className="h-4 w-4 text-amber-600 mr-3" />
                    <span className="text-amber-700 font-medium">Release Notes</span>
                    <ArrowRight className="h-4 w-4 text-amber-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="w-full flex items-center p-3 bg-white/60 hover:bg-white/80 rounded-lg transition-colors group">
                    <Users className="h-4 w-4 text-amber-600 mr-3" />
                    <span className="text-amber-700 font-medium">Join Community</span>
                    <ArrowRight className="h-4 w-4 text-amber-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* API Documentation */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
            <div className="flex items-center mb-6">
              <Code className="h-8 w-8 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">API Reference</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Endpoints</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-center mb-2">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">GET</span>
                      <code className="ml-2 text-sm font-mono">/api/v1/wallet/{`{address}`}</code>
                      <Copy className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                    <p className="text-gray-600 text-sm">Analyze wallet risk and transaction patterns</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-center mb-2">
                      <Network className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">GET</span>
                      <code className="ml-2 text-sm font-mono">/api/graph/subgraph/{`{address}`}</code>
                      <Copy className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                    <p className="text-gray-600 text-sm">Get network graph for address visualization</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">POST</span>
                      <code className="ml-2 text-sm font-mono">/api/alerts/create</code>
                      <Copy className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                    <p className="text-gray-600 text-sm">Create custom alert rules for monitoring</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow group">
                    <div className="flex items-center mb-2">
                      <MessageSquare className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-medium">GET</span>
                      <code className="ml-2 text-sm font-mono">/api/social/mentions/{`{address}`}</code>
                      <Copy className="h-4 w-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                    <p className="text-gray-600 text-sm">Get social media mentions and sentiment</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Response</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
{`{
  "address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "risk_assessment": {
    "risk_score": 25,
    "risk_level": "LOW",
    "risk_factors": ["High transaction volume"]
  },
  "wallet_info": {
    "balance": "15.7 ETH",
    "transaction_count": 1247,
    "first_transaction": "2021-03-15T10:30:00Z"
  },
  "graph_insights": {
    "total_connections": 89,
    "network_centrality": 0.15
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <Shield className="h-8 w-8 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Advanced Features</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group border rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Network className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Graph Analysis</h3>
                </div>
                <p className="text-gray-600 mb-4">Visualize wallet connections using PostgreSQL and Vis.js</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 text-blue-500 mr-2" />
                    <span>Interactive network graphs</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowRight className="h-3 w-3 text-blue-500 mr-2" />
                    <span>Multi-hop transaction paths</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-3 w-3 text-blue-500 mr-2" />
                    <span>Risk propagation analysis</span>
                  </div>
                  <div className="flex items-center">
                    <Layers className="h-3 w-3 text-blue-500 mr-2" />
                    <span>Clustering algorithms</span>
                  </div>
                </div>
              </div>
              
              <div className="group border rounded-lg p-6 hover:shadow-lg hover:border-red-300 transition-all duration-300 bg-gradient-to-br from-red-50/50 to-orange-50/50">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Alert System</h3>
                </div>
                <p className="text-gray-600 mb-4">Real-time monitoring with custom triggers</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <TrendingUp className="h-3 w-3 text-red-500 mr-2" />
                    <span>Risk score thresholds</span>
                  </div>
                  <div className="flex items-center">
                    <Activity className="h-3 w-3 text-red-500 mr-2" />
                    <span>Large transaction alerts</span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 text-red-500 mr-2" />
                    <span>Mixer interaction detection</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-3 w-3 text-red-500 mr-2" />
                    <span>Multi-channel notifications</span>
                  </div>
                </div>
              </div>
              
              <div className="group border rounded-lg p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Globe className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 ml-3">Social Intelligence</h3>
                </div>
                <p className="text-gray-600 mb-4">Off-chain data correlation and sentiment analysis</p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Twitter className="h-3 w-3 text-green-500 mr-2" />
                    <span>Twitter mention tracking</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 text-green-500 mr-2" />
                    <span>Telegram group monitoring</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3 w-3 text-green-500 mr-2" />
                    <span>Discord reputation system</span>
                  </div>
                  <div className="flex items-center">
                    <Brain className="h-3 w-3 text-green-500 mr-2" />
                    <span>Automated threat detection</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg">
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">Need Help?</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a href="https://github.com/giabao3107/Sentinel_Mockup.git" 
                   target="_blank"
                   rel="noopener noreferrer"
                   className="group flex items-center justify-between p-4 bg-white/70 hover:bg-white/90 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-md">
                  <div className="flex items-center">
                    <Github className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-700">GitHub Repository</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="mailto:support@sentinel-platform.io" 
                   className="group flex items-center justify-between p-4 bg-white/70 hover:bg-white/90 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-md">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-700">Technical Support</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="/community" 
                   className="group flex items-center justify-between p-4 bg-white/70 hover:bg-white/90 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-md">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="font-medium text-blue-700">Community Forum</span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
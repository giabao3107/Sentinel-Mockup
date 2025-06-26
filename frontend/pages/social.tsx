import { useState } from 'react';
import Head from 'next/head';
import { Globe, Twitter, MessageSquare, Users, TrendingUp, AlertTriangle, Search, Filter, Calendar, ExternalLink } from 'lucide-react';
import Layout from '@/components/Layout';

export default function SocialIntelligence() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data for demonstration
  const socialData = [
    {
      platform: 'Twitter',
      mentions: 156,
      sentiment: 'positive',
      reach: '2.4M',
      engagement: '12.3%',
      icon: Twitter,
      color: 'text-blue-500'
    },
    {
      platform: 'Telegram',
      mentions: 89,
      sentiment: 'neutral',
      reach: '890K',
      engagement: '8.7%',
      icon: MessageSquare,
      color: 'text-cyan-500'
    },
    {
      platform: 'Discord',
      mentions: 234,
      sentiment: 'positive',
      reach: '1.2M',
      engagement: '15.6%',
      icon: Users,
      color: 'text-purple-500'
    }
  ];

  const recentMentions = [
    {
      id: 1,
      platform: 'Twitter',
      user: '@cryptoanalyst',
      content: 'Suspicious activity detected on address 0x123... Multiple high-value transactions to unknown wallets.',
      sentiment: 'negative',
      timestamp: '2 hours ago',
      engagement: 45
    },
    {
      id: 2,
      platform: 'Telegram',
      user: 'Security Alert Bot',
      content: 'Address flagged by multiple users as potential scam. Exercise caution.',
      sentiment: 'negative',
      timestamp: '4 hours ago',
      engagement: 127
    },
    {
      id: 3,
      platform: 'Discord',
      user: 'DeFiWatch',
      content: 'Clean address history, no red flags detected in recent analysis.',
      sentiment: 'positive',
      timestamp: '6 hours ago',
      engagement: 23
    }
  ];

  return (
    <Layout>
      <Head>
        <title>Social Intelligence - Sentinel Enhanced</title>
        <meta name="description" content="Social media monitoring and reputation analysis" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <Globe className="h-12 w-12 text-green-600" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                Social <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Intelligence</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
                Off-chain Threat Intelligence & Reputation Monitoring
              </p>
              
              <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
                Monitor social media mentions, analyze sentiment, and track reputation scores across 
                Twitter, Telegram, Discord, and other platforms for comprehensive threat intelligence.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Twitter className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Twitter Monitoring</h3>
                  <p className="text-sm text-gray-600">Real-time tweet analysis and sentiment tracking</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <MessageSquare className="h-8 w-8 text-cyan-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Telegram Alerts</h3>
                  <p className="text-sm text-gray-600">Monitor group discussions and threat warnings</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Users className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Community Intel</h3>
                  <p className="text-sm text-gray-600">Discord and forum reputation tracking</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Threat Detection</h3>
                  <p className="text-sm text-gray-600">Automated alerts for suspicious mentions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Search Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search addresses, mentions, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-black"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
                <button className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </button>
              </div>
            </div>
          </div>

          {/* Platform Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {socialData.map((platform, index) => {
              const IconComponent = platform.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <IconComponent className={`h-8 w-8 ${platform.color} mr-3`} />
                      <h3 className="text-lg font-semibold text-gray-900">{platform.platform}</h3>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      platform.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                      platform.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {platform.sentiment}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mentions</span>
                      <span className="font-semibold text-gray-900">{platform.mentions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reach</span>
                      <span className="font-semibold text-gray-900">{platform.reach}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement</span>
                      <span className="font-semibold text-gray-900">{platform.engagement}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: TrendingUp },
                  { id: 'mentions', label: 'Recent Mentions', icon: MessageSquare },
                  { id: 'analytics', label: 'Analytics', icon: Users }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-green-500 text-green-600'
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
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Total Mentions</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {socialData.reduce((sum, platform) => sum + platform.mentions, 0)}
                      </p>
                      <p className="text-sm text-blue-700">Across all platforms</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">Positive Sentiment</h4>
                      <p className="text-2xl font-bold text-green-600">67%</p>
                      <p className="text-sm text-green-700">↑ 12% from last week</p>
                    </div>
                    
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Risk Alerts</h4>
                      <p className="text-2xl font-bold text-red-600">3</p>
                      <p className="text-sm text-red-700">Require attention</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Total Reach</h4>
                      <p className="text-2xl font-bold text-purple-600">4.59M</p>
                      <p className="text-sm text-purple-700">Combined audience</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Mentions Tab */}
              {activeTab === 'mentions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Social Media Mentions</h3>
                  
                  {recentMentions.map((mention) => {
                    const IconComponent = mention.platform === 'Twitter' ? Twitter : 
                                        mention.platform === 'Telegram' ? MessageSquare : Users;
                    return (
                      <div key={mention.id} className={`rounded-lg p-4 border-l-4 ${
                        mention.sentiment === 'positive' ? 'bg-green-50 border-green-400' :
                        mention.sentiment === 'negative' ? 'bg-red-50 border-red-400' :
                        'bg-yellow-50 border-yellow-400'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                              <span className="font-medium text-gray-900">{mention.user}</span>
                              <span className="text-sm text-gray-500">on {mention.platform}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                mention.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                mention.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {mention.sentiment}
                              </span>
                            </div>
                            <p className="text-gray-700 mb-2">{mention.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{mention.timestamp}</span>
                              <span>•</span>
                              <span>{mention.engagement} interactions</span>
                            </div>
                          </div>
                          
                          <button className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Sentiment Analysis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Sentiment Distribution</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Positive</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="w-2/3 h-full bg-green-500"></div>
                            </div>
                            <span className="text-sm font-medium">67%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Neutral</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="w-1/4 h-full bg-yellow-500"></div>
                            </div>
                            <span className="text-sm font-medium">25%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Negative</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="w-1/12 h-full bg-red-500"></div>
                            </div>
                            <span className="text-sm font-medium">8%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Top Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {['blockchain', 'security', 'scam', 'defi', 'wallet', 'ethereum', 'suspicious', 'analysis'].map((keyword, index) => (
                          <span key={index} className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
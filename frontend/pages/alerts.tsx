import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  AlertTriangle, 
  Bell, 
  Shield, 
  Settings, 
  Plus, 
  Search,
  Filter,
  Edit3,
  Trash2,
  Play,
  Pause,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Webhook,
  ExternalLink,
  FileText,
  CheckCircle
} from 'lucide-react';
import Layout from '@/components/Layout';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  rule_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'paused' | 'disabled';
  target_addresses: string[];
  notification_channels: string[];
  created_at: string;
  last_triggered?: string;
  trigger_count: number;
  conditions: any;
}

interface AlertEvent {
  id: string;
  rule_id: string;
  address: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  notification_sent: boolean;
}

export default function AlertSystem() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'rules' | 'events' | 'create'>('rules');

  // Form state for creating new alert
  const [newAlert, setNewAlert] = useState({
    name: '',
    description: '',
    rule_type: 'risk_score_threshold',
    severity: 'medium' as const,
    target_addresses: [''],
    notification_channels: ['email'],
    conditions: {},
    // Rule-specific parameters
    threshold: 80,
    threshold_eth: 10,
    condition: 'above',
    time_window_minutes: 5,
    min_transaction_count: 5,
    max_age_hours: 24,
    cooldown_minutes: 60
  });

  // Load data from API
  useEffect(() => {
    loadAlertData();
  }, []);

  const loadAlertData = async () => {
    setLoading(true);
    try {
      // Load alert rules and events from API
      await Promise.all([
        loadAlertRules(),
        loadAlertEvents()
      ]);
    } catch (error) {
      console.error('Failed to load alert data:', error);
      // Fallback to mock data if API fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadAlertRules = async () => {
    try {
      const response = await fetch('/api/alerts/rules');
      const data = await response.json();
      
      if (data.success) {
        setAlertRules(data.rules);
      } else {
        console.error('Failed to load alert rules:', data.error);
        loadMockRules();
      }
    } catch (error) {
      console.error('API error loading rules:', error);
      loadMockRules();
    }
  };

  const loadAlertEvents = async () => {
    try {
      const response = await fetch('/api/alerts/events');
      const data = await response.json();
      
      if (data.success) {
        setAlertEvents(data.events);
      } else {
        console.error('Failed to load alert events:', data.error);
        loadMockEvents();
      }
    } catch (error) {
      console.error('API error loading events:', error);
      loadMockEvents();
    }
  };

  const loadMockRules = () => {
    setAlertRules([
      {
        id: 'alert_20241226_001',
        name: 'High Risk Address Monitor',
        description: 'Monitor 0x742d35Cc... for any suspicious activity',
        rule_type: 'risk_score_threshold',
        severity: 'critical',
        status: 'active',
        target_addresses: ['0x742d35Cc6634C0532925a3b8D4e4FC4C8A59cFc5'],
        notification_channels: ['email', 'telegram'],
        created_at: '2024-12-25T10:30:00Z',
        last_triggered: '2024-12-26T08:15:00Z',
        trigger_count: 3,
        conditions: { threshold: 80 }
      },
      {
        id: 'alert_20241226_002',
        name: 'Large Transaction Alert',
        description: 'Alert for transactions exceeding 100 ETH',
        rule_type: 'large_transaction',
        severity: 'high',
        status: 'active',
        target_addresses: [],
        notification_channels: ['email', 'discord'],
        created_at: '2024-12-24T15:20:00Z',
        last_triggered: '2024-12-25T14:30:00Z',
        trigger_count: 7,
        conditions: { threshold_eth: 100 }
      },
      {
        id: 'alert_20241226_003',
        name: 'Mixer Interaction Detection',
        description: 'Detect interactions with known mixers',
        rule_type: 'mixer_interaction',
        severity: 'medium',
        status: 'paused',
        target_addresses: [],
        notification_channels: ['email'],
        created_at: '2024-12-23T09:10:00Z',
        trigger_count: 1,
        conditions: { mixer_addresses: ['0x8ba1f109551bD432803012645Hac136c22C0A3A8'] }
      }
    ]);
  };

  const loadMockEvents = () => {
    setAlertEvents([
      {
        id: 'event_001',
        rule_id: 'alert_20241226_001',
        address: '0x742d35Cc6634C0532925a3b8D4e4FC4C8A59cFc5',
        event_type: 'risk_score_threshold',
        severity: 'critical',
        message: '🚨 SENTINEL ALERT: High Risk Address Monitor\nAddress: 0x742d35Cc...\nSeverity: CRITICAL\nRisk score (85) exceeded threshold (80)',
        timestamp: '2024-12-26T08:15:00Z',
        notification_sent: true
      },
      {
        id: 'event_002',
        rule_id: 'alert_20241226_002',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        event_type: 'large_transaction',
        severity: 'high',
        message: '🚨 SENTINEL ALERT: Large Transaction Alert\nAddress: 0xd8dA6BF...\nSeverity: HIGH\nLarge transaction detected: 150.5 ETH (threshold: 100 ETH)',
        timestamp: '2024-12-25T14:30:00Z',
        notification_sent: true
      }
    ]);
  };

  const loadMockData = () => {
    loadMockRules();
    loadMockEvents();
  };

  const handleCreateAlert = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAlert,
          conditions: {}
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Add new rule to the list
        if (data.rule) {
          setAlertRules(prev => [...prev, data.rule]);
        }
        
        // Reset form
        setActiveTab('rules');
        setNewAlert({
          name: '',
          description: '',
          rule_type: 'risk_score_threshold',
          severity: 'medium',
          target_addresses: [''],
          notification_channels: ['email'],
          conditions: {},
          // Rule-specific parameters
          threshold: 80,
          threshold_eth: 10,
          condition: 'above',
          time_window_minutes: 5,
          min_transaction_count: 5,
          max_age_hours: 24,
          cooldown_minutes: 60
        });
        
        // Show success message
        setError(null);
      } else {
        setError(data.error || 'Failed to create alert rule');
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      setError('Network error occurred while creating alert');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlertStatus = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/manage?action=toggle&rule_id=${alertId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAlertRules(rules => 
          rules.map(rule => 
            rule.id === alertId 
              ? { ...rule, status: data.status }
              : rule
          )
        );
      } else {
        console.error('Failed to toggle alert status:', data.error);
      }
    } catch (error) {
      console.error('Failed to toggle alert status:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/manage?rule_id=${alertId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAlertRules(rules => rules.filter(rule => rule.id !== alertId));
      } else {
        console.error('Failed to delete alert:', data.error);
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-50 border-red-200';
      case 'high': return 'text-orange-800 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-800 bg-blue-50 border-blue-200';
      default: return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-800 bg-green-50 border-green-200';
      case 'paused': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'disabled': return 'text-gray-800 bg-gray-50 border-gray-200';
      default: return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const NotificationIcon = ({ channel }: { channel: string }) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3 text-gray-800" />;
      case 'telegram': return <MessageSquare className="h-3 w-3 text-gray-800" />;
      case 'discord': return <Users className="h-3 w-3 text-gray-800" />;
      case 'webhook': return <Webhook className="h-3 w-3 text-gray-800" />;
      default: return <Bell className="h-3 w-3 text-gray-800" />;
    }
  };

  const ruleTypes = [
    { value: 'risk_score_threshold', label: 'Risk Score Threshold' },
    { value: 'large_transaction', label: 'Large Transaction' },
    { value: 'new_connection', label: 'New Connection' },
    { value: 'suspicious_pattern', label: 'Suspicious Pattern' },
    { value: 'mixer_interaction', label: 'Mixer Interaction' },
    { value: 'rapid_transactions', label: 'Rapid Transactions' },
    { value: 'balance_threshold', label: 'Balance Threshold' },
    { value: 'whitelist_violation', label: 'Whitelist Violation' },
    { value: 'blacklist_interaction', label: 'Blacklist Interaction' }
  ];

  return (
    <Layout>
      <Head>
        <title>Alert System - Sentinel Enhanced</title>
        <meta name="description" content="Real-time threat monitoring and alert management system" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative p-4 bg-white rounded-2xl shadow-xl border border-gray-200">
                    <AlertTriangle className="h-12 w-12 text-red-600" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                Alert <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">System</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
                Advanced Threat Monitoring & Proactive Alert Management
              </p>
              
              <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
                Configure custom alerts for address monitoring, suspicious activity detection, 
                and threat intelligence updates with multiple notification channels.
              </p>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Bell className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Active Rules</h3>
                  <p className="text-2xl font-bold text-blue-600">{alertRules.filter(r => r.status === 'active').length}</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Recent Events</h3>
                  <p className="text-2xl font-bold text-red-600">{alertEvents.length}</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Shield className="h-8 w-8 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Addresses Monitored</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {new Set(alertRules.flatMap(r => r.target_addresses).filter(a => a)).size}
                  </p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Settings className="h-8 w-8 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Rule Types</h3>
                  <p className="text-2xl font-bold text-purple-600">9</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          
          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'rules', label: 'Alert Rules', icon: Settings, count: alertRules.length },
                  { id: 'events', label: 'Recent Events', icon: Clock, count: alertEvents.length },
                  { id: 'create', label: 'Create Alert', icon: Plus, count: null }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              
              {/* Alert Rules Tab */}
              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Alert Rules Management</h3>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </button>
                      <button 
                        onClick={() => setActiveTab('create')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Rule
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {alertRules.map((rule) => (
                      <div key={rule.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(rule.severity)}`}>
                                {rule.severity.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(rule.status)}`}>
                                {rule.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{rule.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Rule Type:</span>
                                <p className="text-gray-600 capitalize">{rule.rule_type.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Triggers:</span>
                                <p className="text-gray-600">{rule.trigger_count}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Last Triggered:</span>
                                <p className="text-gray-600">
                                  {rule.last_triggered 
                                    ? new Date(rule.last_triggered).toLocaleDateString()
                                    : 'Never'
                                  }
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Notifications:</span>
                                <div className="flex space-x-1 mt-1">
                                  {rule.notification_channels.map((channel, idx) => (
                                    <div key={idx} className="p-2 bg-white rounded border border-gray-300 shadow-sm">
                                      <NotificationIcon channel={channel} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button 
                              onClick={() => toggleAlertStatus(rule.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                rule.status === 'active' 
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {rule.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                            <button className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteAlert(rule.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Events Tab */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Alert Events</h3>
                  
                  <div className="space-y-4">
                    {alertEvents.map((event) => (
                      <div key={event.id} className={`rounded-lg p-4 border-l-4 ${
                        event.severity === 'critical' ? 'bg-red-50 border-red-400' :
                        event.severity === 'high' ? 'bg-orange-50 border-orange-400' :
                        event.severity === 'medium' ? 'bg-yellow-50 border-yellow-400' :
                        'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className={`h-4 w-4 ${
                                event.severity === 'critical' ? 'text-red-500' :
                                event.severity === 'high' ? 'text-orange-500' :
                                event.severity === 'medium' ? 'text-yellow-500' :
                                'text-blue-500'
                              }`} />
                              <span className="font-medium text-gray-900">
                                {alertRules.find(r => r.id === event.rule_id)?.name || 'Unknown Rule'}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(event.severity)}`}>
                                {event.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 whitespace-pre-line mb-2">
                              {event.message}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(event.timestamp).toLocaleString()} • 
                              Notification: {event.notification_sent ? ' ✅ Sent' : ' ❌ Failed'}
                            </div>
                          </div>
                          
                          <button className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <ExternalLink className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Alert Tab */}
              {activeTab === 'create' && (
                <div className="w-full max-w-5xl mx-auto">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 sm:p-6 mb-6 border border-red-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="p-2 sm:p-3 bg-red-100 rounded-xl flex-shrink-0">
                        <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Alert Rule</h3>
                        <p className="text-red-600 mt-1 text-sm sm:text-base">Configure advanced monitoring with custom triggers and multi-channel notifications</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
                    <div className="space-y-6 lg:space-y-8">
                      {/* Basic Information Section */}
                      <div className="border-b border-gray-200 pb-4 lg:pb-6">
                        <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                          <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 mr-2" />
                          Basic Information
                        </h4>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Alert Name *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={newAlert.name}
                                onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., High Risk Monitor"
                                className="w-full px-3 py-2.5 lg:px-4 lg:py-3 pl-9 lg:pl-10 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-gray-50 hover:bg-white transition-colors text-sm lg:text-base"
                                required
                              />
                              <AlertTriangle className="absolute left-3 top-2.5 lg:top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                            </div>
                            {!newAlert.name && (
                              <p className="text-xs text-red-500">Alert name is required</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Rule Type *
                            </label>
                            <div className="relative">
                              <select
                                value={newAlert.rule_type}
                                onChange={(e) => setNewAlert(prev => ({ ...prev, rule_type: e.target.value }))}
                                className="w-full px-3 py-2.5 lg:px-4 lg:py-3 pl-9 lg:pl-10 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-red-500 text-black bg-gray-50 hover:bg-white transition-colors appearance-none text-sm lg:text-base"
                              >
                                {ruleTypes.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                              <Shield className="absolute left-3 top-2.5 lg:top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description Section */}
                      <div className="border-b border-gray-200 pb-4 lg:pb-6">
                        <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                          <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 mr-2" />
                          Description & Details
                        </h4>
                        
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Description *
                          </label>
                          <div className="relative">
                            <textarea
                              value={newAlert.description}
                              onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                              placeholder="Describe what this alert monitors and when it should trigger..."
                              className="w-full px-3 py-2.5 lg:px-4 lg:py-3 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-gray-50 hover:bg-white transition-colors resize-none text-sm lg:text-base"
                              required
                            />
                          </div>
                          {!newAlert.description && (
                            <p className="text-xs text-red-500">Description is required</p>
                          )}
                          <p className="text-xs text-gray-500">Provide a clear description of what this alert monitors and its purpose.</p>
                        </div>
                      </div>

                      {/* Configuration Section */}
                      <div className="border-b border-gray-200 pb-4 lg:pb-6">
                        <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                          <Settings className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600 mr-2" />
                          Alert Configuration
                        </h4>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Severity Level
                            </label>
                            <div className="relative">
                              <select
                                value={newAlert.severity}
                                onChange={(e) => setNewAlert(prev => ({ ...prev, severity: e.target.value as any }))}
                                className="w-full px-3 py-2.5 lg:px-4 lg:py-3 pl-9 lg:pl-10 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-red-500 text-black bg-gray-50 hover:bg-white transition-colors appearance-none text-sm lg:text-base"
                              >
                                <option value="low">🟢 Low - Informational</option>
                                <option value="medium">🟡 Medium - Warning</option>
                                <option value="high">🟠 High - Important</option>
                                <option value="critical">🔴 Critical - Urgent</option>
                              </select>
                              <AlertTriangle className="absolute left-3 top-2.5 lg:top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Target Address (Optional)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={newAlert.target_addresses[0]}
                                onChange={(e) => setNewAlert(prev => ({ 
                                  ...prev, 
                                  target_addresses: [e.target.value] 
                                }))}
                                placeholder="0x... (leave empty for global monitoring)"
                                className="w-full px-3 py-2.5 lg:px-4 lg:py-3 pl-9 lg:pl-10 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-black bg-gray-50 hover:bg-white transition-colors text-sm lg:text-base"
                              />
                              <Shield className="absolute left-3 top-2.5 lg:top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500">Leave empty to monitor all addresses globally</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Notification Channels Section */}
                      <div className="pb-4 lg:pb-6">
                        <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4 flex items-center">
                          <Bell className="h-4 w-4 lg:h-5 lg:w-5 text-orange-600 mr-2" />
                          Notification Channels
                        </h4>
                        
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">Choose how you want to receive notifications when this alert triggers</p>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                            {[
                              { id: 'email', icon: Mail, label: 'Email', desc: 'Instant email alerts' },
                              { id: 'telegram', icon: MessageSquare, label: 'Telegram', desc: 'Bot notifications' },
                              { id: 'discord', icon: Users, label: 'Discord', desc: 'Server webhooks' },
                              { id: 'webhook', icon: Webhook, label: 'Webhook', desc: 'Custom integrations' }
                            ].map((channel) => {
                              const IconComponent = channel.icon;
                              const isSelected = newAlert.notification_channels.includes(channel.id);
                              
                              return (
                                <label 
                                  key={channel.id} 
                                  className={`relative flex flex-col p-3 lg:p-4 rounded-lg lg:rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                    isSelected 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewAlert(prev => ({
                                          ...prev,
                                          notification_channels: [...prev.notification_channels, channel.id]
                                        }));
                                      } else {
                                        setNewAlert(prev => ({
                                          ...prev,
                                          notification_channels: prev.notification_channels.filter(c => c !== channel.id)
                                        }));
                                      }
                                    }}
                                    className="sr-only"
                                  />
                                  
                                  <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-lg mb-2 lg:mb-3 mx-auto ${
                                    isSelected ? 'bg-blue-100' : 'bg-white'
                                  }`}>
                                    <IconComponent className={`h-5 w-5 lg:h-6 lg:w-6 ${
                                      isSelected ? 'text-blue-600' : 'text-gray-500'
                                    }`} />
                                  </div>
                                  
                                  <div className="text-center">
                                    <h5 className={`font-medium mb-1 text-sm lg:text-base ${
                                      isSelected ? 'text-blue-900' : 'text-gray-900'
                                    }`}>
                                      {channel.label}
                                    </h5>
                                    <p className={`text-xs ${
                                      isSelected ? 'text-blue-600' : 'text-gray-500'
                                    }`}>
                                      {channel.desc}
                                    </p>
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="absolute top-1.5 lg:top-2 right-1.5 lg:right-2 w-5 h-5 lg:w-6 lg:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          
                          {newAlert.notification_channels.length === 0 && (
                            <p className="text-xs text-red-500 mt-2">Please select at least one notification channel</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 lg:pt-6 border-t border-gray-200">
                        <button
                          onClick={handleCreateAlert}
                          disabled={loading || !newAlert.name || !newAlert.description || newAlert.notification_channels.length === 0}
                          className="flex-1 sm:flex-none px-6 lg:px-8 py-3 lg:py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg lg:rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium shadow-lg hover:shadow-xl text-sm lg:text-base"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                              Creating Alert...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3" />
                              Create Alert Rule
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('rules')}
                          className="flex-1 sm:flex-none px-6 lg:px-8 py-3 lg:py-4 bg-gray-100 text-gray-700 rounded-lg lg:rounded-xl hover:bg-gray-200 transition-colors font-medium border border-gray-300 text-sm lg:text-base"
                        >
                          Cancel
                        </button>
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
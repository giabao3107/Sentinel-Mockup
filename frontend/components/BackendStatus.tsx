import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Clock } from 'lucide-react';
import { checkBackendHealth, wakeUpBackend } from '@/utils';

type BackendStatus = 'checking' | 'online' | 'offline' | 'error' | 'sleeping' | 'waking';

export default function BackendStatus() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [backendInfo, setBackendInfo] = useState<any>(null);

  const checkBackendStatus = async () => {
    if (isWakingUp) return; // Don't check while waking up
    
    setStatus('checking');
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackendInfo(data);
        setStatus('online');
      } else if (response.status === 502 || response.status === 504) {
        setStatus('sleeping');
      } else {
        setStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('timeout') || errorMessage.includes('Failed to fetch')) {
        setStatus('sleeping');
      } else {
        setStatus('offline');
      }
    } finally {
      setLastChecked(new Date());
    }
  };

  const handleWakeUp = async () => {
    setIsWakingUp(true);
    setStatus('waking');
    
    try {
      const success = await wakeUpBackend();
      if (success) {
        // Wait a moment then check status
        setTimeout(() => {
          checkBackendStatus();
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setIsWakingUp(false);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'sleeping':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'waking':
        return <Zap className="h-4 w-4 text-purple-600 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking...';
      case 'online':
        return backendInfo ? `Backend Online (${backendInfo.analysis_mode})` : 'Backend Online';
      case 'offline':
        return 'Backend Offline';
      case 'error':
        return 'Backend Error';
      case 'sleeping':
        return 'Backend Sleeping (Free Tier)';
      case 'waking':
        return 'Waking Up Backend...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'checking':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'online':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'error':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'sleeping':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'waking':
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="mb-6">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {lastChecked && (
          <span className="text-xs opacity-75">
            • {lastChecked.toLocaleTimeString()}
          </span>
        )}
        
        {/* Wake up button for sleeping backend */}
        {status === 'sleeping' && (
          <button
            onClick={handleWakeUp}
            disabled={isWakingUp}
            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            title="Wake up backend"
          >
            <Zap className="h-3 w-3 inline mr-1" />
            Wake Up
          </button>
        )}
        
        {/* Refresh button */}
        <button
          onClick={checkBackendStatus}
          disabled={isWakingUp || status === 'checking'}
          className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Additional info for online status */}
      {status === 'online' && backendInfo && (
        <div className="mt-2 text-xs text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span>Services: {Object.entries(backendInfo.services || {})
              .filter(([_, status]) => status === 'available')
              .map(([name]) => name)
              .join(', ')}</span>
            {backendInfo.database?.node_count && (
              <span>Nodes: {backendInfo.database.node_count}</span>
            )}
            {backendInfo.version && (
              <span>v{backendInfo.version}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Help text for sleeping status */}
      {status === 'sleeping' && (
        <div className="mt-2 text-xs text-blue-600">
          💡 Free tier backend sleeps after 15 minutes of inactivity. Click "Wake Up" to restart it.
        </div>
      )}
    </div>
  );
} 
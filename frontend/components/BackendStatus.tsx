import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function BackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkBackendStatus = async () => {
    setStatus('checking');
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        timeout: 5000,
      } as RequestInit);
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('offline');
    } finally {
      setLastChecked(new Date());
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
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking...';
      case 'online':
        return 'Backend Online';
      case 'offline':
        return 'Backend Offline';
      case 'error':
        return 'Backend Error';
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
        <button
          onClick={checkBackendStatus}
          className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          title="Refresh status"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
} 
/**
 * Sentinel Frontend Utilities
 */

import { type ClassValue, clsx } from 'clsx';
import { RiskLevel, FormatOptions } from '@/types';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(address);
}

/**
 * Format Ethereum address for display
 */
export function formatAddress(address: string, short: boolean = false): string {
  if (!address || !isValidEthereumAddress(address)) {
    return 'Invalid Address';
  }
  
  if (short) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  return address;
}

/**
 * Format Wei to Ether
 */
export function formatWeiToEther(wei: string | number): number {
  try {
    const weiNum = typeof wei === 'string' ? parseInt(wei) : wei;
    return weiNum / Math.pow(10, 18);
  } catch (error) {
    return 0;
  }
}

/**
 * Format numbers for display
 */
export function formatNumber(
  value: number, 
  options: FormatOptions = {}
): string {
  const { decimals = 2, currency = false, compact = false } = options;
  
  if (compact && value >= 1000) {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(decimals)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(decimals)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(decimals)}K`;
    }
  }
  
  const formatted = value.toFixed(decimals);
  
  if (currency) {
    return `$${formatted}`;
  }
  
  return formatted;
}

/**
 * Format Ether values for display
 */
export function formatEther(value: number, options: FormatOptions = {}): string {
  const { decimals = 4, compact = false } = options;
  
  if (value === 0) return '0 ETH';
  
  const formatted = formatNumber(value, { decimals, compact });
  return `${formatted} ETH`;
}

/**
 * Get risk color for UI elements
 */
export function getRiskColor(riskLevel: RiskLevel): string {
  const colors = {
    MINIMAL: '#16a34a',
    LOW: '#65a30d',
    MEDIUM: '#d97706',
    HIGH: '#ea580c',
    CRITICAL: '#dc2626',
  };
  
  return colors[riskLevel];
}

/**
 * Get risk badge CSS classes
 */
export function getRiskBadgeClasses(riskLevel: RiskLevel): string {
  const baseClasses = 'risk-badge';
  
  const levelClasses = {
    MINIMAL: 'risk-minimal',
    LOW: 'risk-low',
    MEDIUM: 'risk-medium',
    HIGH: 'risk-high',
    CRITICAL: 'risk-critical',
  };
  
  return `${baseClasses} ${levelClasses[riskLevel]}`;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid Date';
  }
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Failed to copy to clipboard:', fallbackError);
      return false;
    }
  }
}

/**
 * Parse method signature
 */
export function parseMethodSignature(methodId: string | null | undefined): string {
  if (!methodId) return 'Unknown';
  
  const methodMap: Record<string, string> = {
    '0xa9059cbb': 'transfer',
    '0x095ea7b3': 'approve',
    '0x23b872dd': 'transferFrom',
    '0x18160ddd': 'totalSupply',
    '0x70a08231': 'balanceOf',
    '0xdd62ed3e': 'allowance',
    '0x': 'ETH Transfer',
  };
  
  return methodMap[methodId] || `Unknown (${methodId.slice(0, 8)}...)`;
}

/**
 * Generate transaction Etherscan URL
 */
export function getEtherscanUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  const baseUrl = 'https://etherscan.io';
  
  if (type === 'tx') {
    return `${baseUrl}/tx/${hash}`;
  } else {
    return `${baseUrl}/address/${hash}`;
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Local storage utilities
 */
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

/**
 * API endpoint builder
 */
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  // In production, use the endpoint directly (will be handled by rewrites)
  // In development, use the full backend URL
  const isProduction = process.env.NODE_ENV === 'production';
  const backendUrl = process.env.BACKEND_URL;
  
  let url: string;
  
  if (isProduction && (!backendUrl || backendUrl === '')) {
    // Production without backend - use relative path
    url = endpoint;
  } else {
    // Development or production with backend URL
    const baseUrl = backendUrl || 'http://localhost:5000';
    url = `${baseUrl}${endpoint}`;
  }
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
} 
/**
 * Sentinel Frontend Type Definitions
 */

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Wallet Analysis Types
export interface WalletAnalysisResponse {
  address: string;
  analysis_timestamp: string;
  wallet_info: WalletInfo;
  risk_assessment: RiskAssessment;
  transactions: TransactionData;
  tokens: Token[];
  metadata: AnalysisMetadata;
}

export interface WalletInfo {
  balance: {
    wei: string;
    ether: number;
    usd_value: number;
  };
  transaction_count: number;
  token_count: number;
  first_transaction: string | null;
  last_transaction: string | null;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: string[];
  behavioral_tags: string[];
  analysis_details?: {
    total_transactions: number;
    balance_ether: number;
    assessment_timestamp: string;
  };
}

export interface TransactionData {
  recent: Transaction[];
  total_count: number;
  volume_stats: VolumeStats;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value_wei: number;
  value_ether: number;
  timestamp: string;
  block_number: number;
  gas_used: number;
  gas_price: number;
  transaction_fee: number;
  is_error: boolean;
  method_id?: string;
}

export interface VolumeStats {
  total_sent_wei: number;
  total_received_wei: number;
  total_sent_ether: number;
  total_received_ether: number;
  net_balance_change_wei: number;
  net_balance_change_ether: number;
}

export interface Token {
  contract_address: string;
  name: string;
  symbol: string;
  decimals: number;
  latest_transfer?: string;
}

export interface AnalysisMetadata {
  data_sources: string[];
  analysis_engine: string;
  chain: string;
}

// Risk Level Enum
export type RiskLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Component Props Types
export interface WalletSearchProps {
  onSearch: (address: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export interface WalletDashboardProps {
  address: string;
  data: WalletAnalysisResponse;
  loading?: boolean;
  error?: string | null;
}

export interface RiskBadgeProps {
  riskLevel: RiskLevel;
  riskScore: number;
  size?: 'sm' | 'md' | 'lg';
}

export interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface AddressDisplayProps {
  address: string;
  short?: boolean;
  copyable?: boolean;
  className?: string;
}

// Form Types
export interface SearchFormData {
  address: string;
}

// Error Types
export interface ApiError {
  message: string;
  status?: number;
  details?: Record<string, any>;
}

// Chart Data Types
export interface RiskChartData {
  name: string;
  value: number;
  color: string;
}

export interface TransactionVolumeData {
  date: string;
  sent: number;
  received: number;
}

// Navigation Types
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Utility Types
export interface FormatOptions {
  decimals?: number;
  currency?: boolean;
  compact?: boolean;
}

// Hook Return Types
export interface UseWalletAnalysisReturn {
  data: WalletAnalysisResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<void>;
}

// Constants
export const RISK_COLORS: Record<RiskLevel, string> = {
  MINIMAL: '#16a34a',
  LOW: '#65a30d',
  MEDIUM: '#d97706',
  HIGH: '#ea580c',
  CRITICAL: '#dc2626',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  MINIMAL: 'Minimal Risk',
  LOW: 'Low Risk',
  MEDIUM: 'Medium Risk',
  HIGH: 'High Risk',
  CRITICAL: 'Critical Risk',
}; 
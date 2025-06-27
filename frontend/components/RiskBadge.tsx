import { RiskBadgeProps } from '@/types';
import { getRiskBadgeClasses } from '@/utils';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

export default function RiskBadge({ riskLevel, riskScore, size = 'md' }: RiskBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-3',
    lg: 'text-lg px-6 py-4',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };

  const getRiskIcon = () => {
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      return <AlertTriangle className={`${iconSizeClasses[size]} animate-pulse`} />;
    } else if (riskLevel === 'MEDIUM') {
      return <Shield className={iconSizeClasses[size]} />;
    } else {
      return <CheckCircle className={iconSizeClasses[size]} />;
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'MINIMAL':
        return 'An Toàn (Minimal)';
      case 'LOW':
        return 'Rủi Ro Thấp (Low)';
      case 'MEDIUM':
        return 'Rủi Ro Trung Bình (Medium)';
      case 'HIGH':
        return 'Rủi Ro Cao (High)';
      case 'CRITICAL':
        return 'Rủi Ro Nghiêm Trọng (Critical)';
      default:
        return 'Unknown Risk';
    }
  };

  const getRiskBadgeStyle = () => {
    const baseClasses = 'relative inline-flex items-center rounded-xl font-bold border-2 shadow-lg transition-all duration-300 hover:scale-105';
    
    switch (riskLevel) {
      case 'MINIMAL':
        return `${baseClasses} bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 shadow-green-200/50`;
      case 'LOW':
        return `${baseClasses} bg-gradient-to-r from-lime-100 to-lime-200 text-lime-800 border-lime-300 shadow-lime-200/50`;
      case 'MEDIUM':
        return `${baseClasses} bg-gradient-to-r from-yellow-100 to-amber-200 text-amber-800 border-amber-300 shadow-amber-200/50 animate-pulse`;
      case 'HIGH':
        return `${baseClasses} bg-gradient-to-r from-orange-100 to-red-200 text-red-800 border-red-300 shadow-red-200/50 animate-pulse`;
      case 'CRITICAL':
        return `${baseClasses} bg-gradient-to-r from-red-200 to-red-300 text-red-900 border-red-500 shadow-red-300/50 animate-pulse`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`;
    }
  };

  const getGlowEffect = () => {
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      return 'before:absolute before:inset-0 before:rounded-xl before:bg-red-500/20 before:blur-lg before:-z-10';
    } else if (riskLevel === 'MEDIUM') {
      return 'before:absolute before:inset-0 before:rounded-xl before:bg-amber-500/20 before:blur-lg before:-z-10';
    }
    return '';
  };

  return (
    <div className={`${getRiskBadgeStyle()} ${sizeClasses[size]} ${getGlowEffect()}`}>
      <div className="flex items-center space-x-2">
        {getRiskIcon()}
        <div className="flex flex-col items-start">
          <span className="font-bold leading-tight">{getRiskLabel()}</span>
          <span className="text-xs opacity-75 font-semibold">Score: {riskScore}/100</span>
        </div>
        {/* Risk level indicator dot */}
        <div className={`w-3 h-3 rounded-full ml-2 ${
          riskLevel === 'CRITICAL' ? 'bg-red-600 animate-ping' :
          riskLevel === 'HIGH' ? 'bg-orange-600 animate-pulse' :
          riskLevel === 'MEDIUM' ? 'bg-amber-600' :
          riskLevel === 'LOW' ? 'bg-lime-600' : 'bg-green-600'
        }`}></div>
      </div>
    </div>
  );
} 
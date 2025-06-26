import { RiskBadgeProps } from '@/types';
import { getRiskBadgeClasses } from '@/utils';
import { AlertTriangle, Shield, CheckCircle } from 'lucide-react';

export default function RiskBadge({ riskLevel, riskScore, size = 'md' }: RiskBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getRiskIcon = () => {
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      return <AlertTriangle className={iconSizeClasses[size]} />;
    } else if (riskLevel === 'MEDIUM') {
      return <Shield className={iconSizeClasses[size]} />;
    } else {
      return <CheckCircle className={iconSizeClasses[size]} />;
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'MINIMAL':
        return 'Minimal Risk';
      case 'LOW':
        return 'Low Risk';
      case 'MEDIUM':
        return 'Medium Risk';
      case 'HIGH':
        return 'High Risk';
      case 'CRITICAL':
        return 'Critical Risk';
      default:
        return 'Unknown Risk';
    }
  };

  return (
    <div className={`${getRiskBadgeClasses(riskLevel)} ${sizeClasses[size]}`}>
      <div className="flex items-center space-x-1.5">
        {getRiskIcon()}
        <span className="font-medium">{getRiskLabel()}</span>
        <span className="opacity-75">({riskScore})</span>
      </div>
    </div>
  );
} 
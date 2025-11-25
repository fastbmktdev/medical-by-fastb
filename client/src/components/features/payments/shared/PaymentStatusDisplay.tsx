/**
 * Shared payment status display component
 * Consolidates status display logic across payment components
 */

'use client';

import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { PaymentStatus, getStatusInfo } from './paymentUtils';

interface PaymentStatusDisplayProps {
  status: PaymentStatus;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PaymentStatusDisplay({
  status,
  showIcon = true,
  showText = true,
  size = 'md',
  className = '',
}: PaymentStatusDisplayProps) {
  const statusInfo = getStatusInfo(status);
  
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
    
    switch (status) {
      case 'succeeded':
        return <CheckCircleIcon className={`${iconSize} text-green-500`} />;
      case 'failed':
        return <XCircleIcon className={`${iconSize} text-red-500`} />;
      case 'pending':
      case 'processing':
        return <ClockIcon className={`${iconSize} text-yellow-500`} />;
      case 'canceled':
        return <XCircleIcon className={`${iconSize} text-gray-500`} />;
      case 'refunded':
        return <ArrowPathIcon className={`${iconSize} text-blue-500`} />;
      default:
        return <ExclamationTriangleIcon className={`${iconSize} text-gray-500`} />;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && getStatusIcon()}
      {showText && (
        <span className={`font-medium ${statusInfo.color} ${getTextSize()}`}>
          {statusInfo.text}
        </span>
      )}
    </div>
  );
}
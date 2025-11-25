/**
 * Shared payment error display component
 * Consolidates error display logic across payment components
 */

'use client';

import { 
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PaymentError } from './paymentUtils';

interface PaymentErrorDisplayProps {
  error: PaymentError;
  retryCount?: number;
  onRetry?: () => void;
}

export default function PaymentErrorDisplay({
  error,
  retryCount = 0,
  onRetry,
}: PaymentErrorDisplayProps) {
  return (
    <div className={` border p-6 ${
      error.retryable
        ? 'bg-yellow-600/10 border-yellow-600/50'
        : 'bg-brand-primary/10 border-red-600/50'
    }`}>
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          {error.retryable ? (
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
          ) : (
            <XCircleIcon className="w-8 h-8 text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg mb-2 ${
            error.retryable ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {error.title}
          </h3>
          <p className="mb-3 text-sm">
            {error.message}
          </p>
          {error.suggestion && (
            <div className="bg-zinc-100/50 mb-3 p-3 ">
              <p className="text-zinc-300 text-xs">
                💡 <strong>คำแนะนำ:</strong> {error.suggestion}
              </p>
            </div>
          )}
          {error.retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2  font-semibold text-sm transition-colors"
              aria-label="ลองชำระเงินใหม่อีกครั้ง"
            >
              <ArrowPathIcon className="w-4 h-4" />
              ลองใหม่อีกครั้ง
            </button>
          )}
          {retryCount > 0 && (
            <p className="mt-2 text-zinc-400 text-xs">
              จำนวนครั้งที่ลอง: {retryCount + 1}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
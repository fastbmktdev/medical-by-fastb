/**
 * Shared payment data hook
 * Consolidates payment data fetching logic
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentRecord {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  payment_type: 'gym_booking' | 'product' | 'ticket';
  created_at: string;
  updated_at: string;
  order_number?: string;
  metadata?: Record<string, unknown>;
}

export interface UsePaymentDataResult {
  payments: PaymentRecord[];
  loading: boolean;
  error: string | null;
  refreshPayments: () => Promise<void>;
}

/**
 * Hook for fetching and managing payment data
 */
export const usePaymentData = (): UsePaymentDataResult => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/payments/user-payments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshPayments = async () => {
    setLoading(true);
    await fetchPayments();
  };

  useEffect(() => {
    fetchPayments();
  }, [user, fetchPayments]);

  return {
    payments,
    loading,
    error,
    refreshPayments,
  };
};
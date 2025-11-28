'use client';

import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentRecord } from './shared';
import { Loading, LoadingSpinner } from '@/components/design-system/primitives/Loading';

interface RetryPaymentButtonProps {
  payment: PaymentRecord & { retry_count?: number; failure_reason?: string };
  onRetrySuccess?: () => void;
  savedPaymentMethods?: Array<{ id: string; stripe_payment_method_id: string; last4?: string; brand?: string; is_default?: boolean }>;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function RetryPaymentForm({
  payment,
  onRetrySuccess,
  savedPaymentMethods,
  onCancel,
}: RetryPaymentButtonProps & { onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(
    savedPaymentMethods?.find(m => m.is_default)?.stripe_payment_method_id || null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Retry payment
      const retryResponse = await fetch('/api/payments/retry-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: payment.id,
          payment_method_id: selectedPaymentMethod || undefined,
        }),
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new Error(errorData.error || 'Failed to retry payment');
      }

      const retryData = await retryResponse.json();

      // If using saved payment method, confirm immediately
      if (selectedPaymentMethod && retryData.clientSecret) {
        const { error: confirmError } = await stripe.confirmPayment({
          elements,
          clientSecret: retryData.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard/transactions?retry=success`,
          },
        });

        if (confirmError) {
          throw confirmError;
        }
      } else if (retryData.clientSecret) {
        // Need to collect payment method
        const { error: submitError } = await stripe.confirmPayment({
          elements,
          clientSecret: retryData.clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard/transactions?retry=success`,
          },
        });

        if (submitError) {
          throw submitError;
        }
      } else {
        // Payment might have been confirmed automatically
        if (onRetrySuccess) {
          onRetrySuccess();
        }
        onCancel();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลองชำระเงินใหม่');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50  p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {savedPaymentMethods && savedPaymentMethods.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            เลือกบัตรเครดิตที่บันทึกไว้
          </label>
          <div className="space-y-2">
            {savedPaymentMethods.map((method) => (
              <label
                key={method.id}
                className="flex items-center space-x-3 p-3 bg-zinc-100  cursor-pointer hover:bg-zinc-600 transition-colors"
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method.stripe_payment_method_id}
                  checked={selectedPaymentMethod === method.stripe_payment_method_id}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-red-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">
                      {method.brand?.toUpperCase() || 'Card'} •••• {method.last4}
                    </span>
                    {method.is_default && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 ">
                        เริ่มต้น
                      </span>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {(!selectedPaymentMethod || (savedPaymentMethods && savedPaymentMethods.length === 0)) && (
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            ข้อมูลบัตรเครดิต
          </label>
          <div className="bg-zinc-100  p-4">
            <PaymentElement />
          </div>
        </div>
      )}

      {payment.retry_count !== undefined && payment.retry_count >= 2 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50  p-3">
          <p className="text-yellow-400 text-sm">
            ⚠️ คุณได้ลองชำระเงินแล้ว {payment.retry_count + 1} ครั้ง (สูงสุด 3 ครั้ง)
          </p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-600 hover:bg-zinc-500 px-4 py-2  font-medium transition-colors"
          disabled={isProcessing}
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-red-600 hover:bg-red-600 px-4 py-2  font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
          <LoadingSpinner size="xs" />
              <span>กำลังประมวลผล...</span>
            </>
          ) : (
            <>
              <ArrowPathIcon className="w-4 h-4" />
              <span>ลองชำระเงินใหม่</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function RetryPaymentButton({
  payment,
  onRetrySuccess,
  savedPaymentMethods,
}: RetryPaymentButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);

  // Check if payment can be retried
  const canRetry = payment.status === 'failed' && (payment.retry_count || 0) < 3;

  if (!canRetry) {
    if (payment.status === 'failed' && (payment.retry_count || 0) >= 3) {
      return (
        <div className="text-zinc-400 text-sm">
          ไม่สามารถลองชำระเงินได้ (ลองครบ 3 ครั้งแล้ว)
        </div>
      );
    }
    return null;
  }

  const handleOpenModal = async () => {
    setShowModal(true);
    
    // If no saved payment methods, create setup intent for new card
    if (!savedPaymentMethods || savedPaymentMethods.length === 0) {
      try {
        const response = await fetch('/api/payments/setup-intent', {
          method: 'POST',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSetupIntentClientSecret(data.clientSecret);
        }
      } catch (error) {
        console.error('Error creating setup intent:', error);
      }
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center space-x-2 bg-red-600 hover:bg-red-600 px-4 py-2  text-sm font-medium transition-colors"
        aria-label="Retry payment"
      >
        <ArrowPathIcon className="w-4 h-4" />
        <span>ลองชำระเงินใหม่</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800  p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                ลองชำระเงินใหม่
              </h3>
              <p className="text-zinc-400 text-sm">
                จำนวนเงิน: <span className="text-white font-medium">฿{(payment.amount || 0).toLocaleString()}</span>
              </p>
              {payment.failure_reason && (
                <p className="text-zinc-400 text-sm mt-1">
                  สาเหตุที่ล้มเหลว: <span className="text-red-400">{payment.failure_reason}</span>
                </p>
              )}
            </div>

            {setupIntentClientSecret || savedPaymentMethods ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: setupIntentClientSecret || undefined,
                  appearance: {
                    theme: 'night',
                  },
                }}
              >
                <RetryPaymentForm
                  payment={payment}
                  onRetrySuccess={onRetrySuccess}
                  savedPaymentMethods={savedPaymentMethods}
                  onCancel={() => setShowModal(false)}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <Loading centered size="lg" text="กำลังโหลด..." />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


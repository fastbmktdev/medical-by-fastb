'use client';

import { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { SavedPaymentMethod } from '@/services/payment.service';
import { Loading, LoadingSpinner } from '@/components/design-system/primitives/Loading';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface SavedPaymentMethodsProps {
  onSelectMethod?: (methodId: string) => void;
  showAddButton?: boolean;
}

function AddPaymentMethodForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create setup intent
      const setupResponse = await fetch('/api/payments/setup-intent', {
        method: 'POST',
      });

      if (!setupResponse.ok) {
        const errorData = await setupResponse.json();
        throw new Error(errorData.error || 'Failed to create setup intent');
      }

      const setupData = await setupResponse.json();

      // Confirm setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret: setupData.clientSecret,
        redirect: 'if_required',
      });

      if (confirmError) {
        throw confirmError;
      }

      if (setupIntent?.status === 'succeeded' && setupIntent.payment_method) {
        // Save payment method
        const saveResponse = await fetch('/api/payments/saved-methods', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            setup_intent_id: setupIntent.id,
          }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || 'Failed to save payment method');
        }

        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกบัตรเครดิต');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          ข้อมูลบัตรเครดิต
        </label>
        <div className="bg-zinc-700 rounded-lg p-4">
          <PaymentElement />
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-zinc-600 hover:bg-zinc-500 px-4 py-2 rounded-lg font-medium transition-colors"
          disabled={isProcessing}
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-red-600 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <LoadingSpinner size="xs" />
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4" />
              <span>บันทึกบัตร</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function SavedPaymentMethods({
  onSelectMethod,
  showAddButton = true,
}: SavedPaymentMethodsProps) {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMethods = async () => {
    try {
      setError(null);
      const response = await fetch('/api/payments/saved-methods');
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved payment methods');
      }

      const data = await response.json();
      setMethods(data.methods || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleDelete = async (methodId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบัตรเครดิตนี้?')) {
      return;
    }

    setDeletingId(methodId);
    try {
      const response = await fetch(`/api/payments/saved-methods?method_id=${methodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete payment method');
      }

      await fetchMethods();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบบัตรเครดิต');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const response = await fetch('/api/payments/saved-methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method_id: methodId,
          is_default: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default payment method');
      }

      await fetchMethods();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการตั้งค่าบัตรเริ่มต้น');
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    
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
  };

  const getCardBrandIcon = (_brand?: string) => {
    // Can be extended to show different icons for different card brands
    // const brandLower = _brand?.toLowerCase() || '';
    // if (brandLower === 'visa') return <VisaIcon />;
    // if (brandLower === 'mastercard') return <MastercardIcon />;
    return <CreditCardIcon className="w-6 h-6" />;
  };

  if (loading) {
    return (
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="text-center py-12">
          <Loading centered size="xl" text="กำลังโหลดบัตรเครดิตที่บันทึกไว้..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">บัตรเครดิตที่บันทึกไว้</h3>
            <p className="text-zinc-400">จัดการบัตรเครดิตของคุณ</p>
          </div>
          {showAddButton && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>เพิ่มบัตรใหม่</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      {methods.length === 0 ? (
        <div className="bg-zinc-800 rounded-lg p-6">
          <div className="text-center py-12">
            <CreditCardIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">ยังไม่มีบัตรเครดิตที่บันทึกไว้</h3>
            <p className="text-zinc-400">เพิ่มบัตรเครดิตเพื่อให้การชำระเงินเร็วขึ้น</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`bg-zinc-800 rounded-lg p-6 border-2 ${
                method.is_default ? 'border-red-500' : 'border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-zinc-700 rounded-lg p-3">
                    {getCardBrandIcon(method.brand)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-semibold text-white">
                        {method.brand?.toUpperCase() || 'Card'} •••• {method.last4}
                      </h4>
                      {method.is_default && (
                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-medium">
                          เริ่มต้น
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">
                      หมดอายุ: {method.exp_month?.toString().padStart(2, '0')}/{method.exp_year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!method.is_default && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      ตั้งเป็นเริ่มต้น
                    </button>
                  )}
                  {onSelectMethod && (
                    <button
                      onClick={() => onSelectMethod(method.stripe_payment_method_id)}
                      className="bg-red-600 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      เลือก
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    disabled={deletingId === method.id}
                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    aria-label="Delete payment method"
                  >
                    {deletingId === method.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                เพิ่มบัตรเครดิตใหม่
              </h3>
              <p className="text-zinc-400 text-sm">
                บัตรเครดิตของคุณจะถูกบันทึกไว้เพื่อการชำระเงินในอนาคต
              </p>
            </div>

            {setupIntentClientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: setupIntentClientSecret,
                  appearance: {
                    theme: 'night',
                  },
                }}
              >
                <AddPaymentMethodForm
                  onSuccess={() => {
                    setShowAddModal(false);
                    setSetupIntentClientSecret(null);
                    fetchMethods();
                  }}
                  onCancel={() => {
                    setShowAddModal(false);
                    setSetupIntentClientSecret(null);
                  }}
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
    </div>
  );
}


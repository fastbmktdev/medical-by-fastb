'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@shared/lib/payments';
import PaymentMethods from '@/components/features/payments/PaymentMethods';
import PaymentStatus from '@/components/features/payments/PaymentStatus';
import PaymentHistory from '@/components/features/payments/PaymentHistory';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Loading } from '@/components/design-system/primitives/Loading';
import { logger } from '@shared/lib/utils/logger';

interface PaymentData {
  amount: number;
  paymentType: 'hospital_booking' | 'product' | 'ticket';
  metadata: Record<string, string>;
  orderNumber?: string;
}

export default function PaymentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'process' | 'history' | 'status'>('process');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push(`/${locale}/login`);
    }
  }, [user, router, locale]);

  // Load payment data from URL params or session storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount');
    const paymentType = urlParams.get('paymentType') as 'hospital_booking' | 'product' | 'ticket';
    const metadata = urlParams.get('metadata');

    if (amount && paymentType) {
      setPaymentData({
        amount: parseFloat(amount),
        paymentType,
        metadata: metadata ? JSON.parse(decodeURIComponent(metadata)) : {},
      });
    }
  }, []);

  const createPaymentIntent = async () => {
    if (!paymentData || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          paymentType: paymentData.paymentType,
          metadata: paymentData.metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const result = await response.json();
      setClientSecret(result.clientSecret);
      setPaymentData(prev => prev ? { ...prev, orderNumber: result.orderNumber } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment intent');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setActiveTab('status');
    // Trigger fetching payment status after successful payment
    fetch(`/api/payments/status?payment_intent_id=${paymentIntentId}`)
      .then(res => res.json())
      .then(statusData => {
        // You can set the fetched status data to state here if desired
        logger.info("Fetched payment status", { statusData });
        // Example: setPaymentStatus(statusData); (requires additional state)
      })
      .catch(err => {
        logger.error("Failed to fetch payment status", { error: err }, err instanceof Error ? err : new Error(String(err)));
      });
    logger.info("Payment successful", { paymentIntentId });
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loading centered size="xl" />
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-zinc-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">ระบบชำระเงิน</h1>
          <p className="text-gray-600">จัดการการชำระเงินของคุณได้ที่นี่</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-gray-300  p-1 flex">
            <button
              onClick={() => setActiveTab('process')}
              className={`px-6 py-3  font-medium transition-colors ${
                activeTab === 'process'
                  ? 'bg-brand-primary text-white'
                  : 'text-zinc-950 hover:text-gray-700'
              }`}
            >
              <CreditCardIcon className="w-5 h-5 inline mr-2" />
              ชำระเงิน
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-6 py-3  font-medium transition-colors ${
                activeTab === 'status'
                  ? 'bg-brand-primary text-white'
                  : 'text-zinc-950 hover:text-gray-700'
              }`}
            >
              <ClockIcon className="w-5 h-5 inline mr-2" />
              สถานะการชำระ
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3  font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-brand-primary text-white'
                  : 'text-zinc-950 hover:text-gray-700'
              }`}
            >
              <BanknotesIcon className="w-5 h-5 inline mr-2" />
              ประวัติการชำระ
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'process' && (
            <div className="bg-white border border-gray-300  p-6">
              {!paymentData ? (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-zinc-950">ไม่พบข้อมูลการชำระเงิน</h3>
                  <p className="text-gray-600 mb-6">
                    กรุณาเริ่มต้นกระบวนการชำระเงินจากหน้าอื่น
                  </p>
                  <button
                    onClick={() => router.push(`/${locale}`)}
                    className="bg-brand-primary hover:bg-red-600 px-6 py-3  font-medium transition-colors"
                  >
                    กลับหน้าหลัก
                  </button>
                </div>
              ) : (
                <div>
                  {/* Payment Summary */}
                  <div className="bg-white border border-gray-300  p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-zinc-950">สรุปการชำระเงิน</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ประเภท:</span>
                        <span className="text-zinc-950">
                          {paymentData.paymentType === 'hospital_booking' && 'จองโรงพยาบาล'}
                          {paymentData.paymentType === 'product' && 'ซื้อสินค้า'}
                          {paymentData.paymentType === 'ticket' && 'ซื้อตั๋ว'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">จำนวนเงิน:</span>
                        <span className="text-zinc-950 font-semibold">
                          ฿{paymentData.amount.toLocaleString()}
                        </span>
                      </div>
                      {paymentData.orderNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">หมายเลขคำสั่งซื้อ:</span>
                          <span className="text-zinc-950 font-mono text-sm">
                            {paymentData.orderNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  {!clientSecret ? (
                    <div className="text-center">
                      <button
                        onClick={createPaymentIntent}
                        disabled={isLoading}
                        className="bg-brand-primary hover:bg-red-600 disabled:bg-gray-400 disabled:opacity-50 px-8 py-4  font-semibold text-lg transition-colors disabled:cursor-not-allowed"
                        aria-label="เริ่มต้นกระบวนการชำระเงิน"
                      >
                        {isLoading ? 'กำลังสร้างการชำระเงิน...' : 'เริ่มต้นการชำระเงิน'}
                      </button>
                      {error && (
                        <div className="mt-4 p-4 bg-brand-primary/10 border border-red-600/50 ">
                          <p className="text-red-400">{error}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Elements stripe={getStripe()} options={{ clientSecret }}>
                      <PaymentMethods
                        amount={paymentData.amount}
                        paymentType={paymentData.paymentType}
                        metadata={paymentData.metadata}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <PaymentStatus />
          )}

          {activeTab === 'history' && (
            <PaymentHistory />
          )}
        </div>
      </div>
    </div>
  );
}

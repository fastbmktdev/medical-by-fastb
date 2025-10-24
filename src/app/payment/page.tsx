'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/payments';
import PaymentMethods from '@/components/features/payments/PaymentMethods';
import PaymentStatus from '@/components/features/payments/PaymentStatus';
import PaymentHistory from '@/components/features/payments/PaymentHistory';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PaymentData {
  amount: number;
  paymentType: 'gym_booking' | 'product' | 'ticket';
  metadata: Record<string, string>;
  orderNumber?: string;
}

export default function PaymentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'process' | 'history' | 'status'>('process');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load payment data from URL params or session storage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const amount = urlParams.get('amount');
    const paymentType = urlParams.get('paymentType') as 'gym_booking' | 'product' | 'ticket';
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
    // You can add additional success handling here
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ระบบชำระเงิน</h1>
          <p className="text-zinc-400">จัดการการชำระเงินของคุณได้ที่นี่</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-zinc-800 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('process')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'process'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CreditCardIcon className="w-5 h-5 inline mr-2" />
              ชำระเงิน
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'status'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ClockIcon className="w-5 h-5 inline mr-2" />
              สถานะการชำระ
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white'
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
            <div className="bg-zinc-800 rounded-lg p-6">
              {!paymentData ? (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">ไม่พบข้อมูลการชำระเงิน</h3>
                  <p className="text-zinc-400 mb-6">
                    กรุณาเริ่มต้นกระบวนการชำระเงินจากหน้าอื่น
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    กลับหน้าหลัก
                  </button>
                </div>
              ) : (
                <div>
                  {/* Payment Summary */}
                  <div className="bg-zinc-700 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">สรุปการชำระเงิน</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-zinc-400">ประเภท:</span>
                        <span className="text-white">
                          {paymentData.paymentType === 'gym_booking' && 'จองค่ายมวย'}
                          {paymentData.paymentType === 'product' && 'ซื้อสินค้า'}
                          {paymentData.paymentType === 'ticket' && 'ซื้อตั๋ว'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">จำนวนเงิน:</span>
                        <span className="text-white font-semibold">
                          ฿{paymentData.amount.toLocaleString()}
                        </span>
                      </div>
                      {paymentData.orderNumber && (
                        <div className="flex justify-between">
                          <span className="text-zinc-400">หมายเลขคำสั่งซื้อ:</span>
                          <span className="text-white font-mono text-sm">
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
                        className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:opacity-50 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'กำลังสร้างการชำระเงิน...' : 'เริ่มต้นการชำระเงิน'}
                      </button>
                      {error && (
                        <div className="mt-4 p-4 bg-red-600/10 border border-red-600/50 rounded-lg">
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

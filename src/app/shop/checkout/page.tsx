'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentWrapper from '@/components/payments/PaymentWrapper';

export default function ShopCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get product details from URL params (in real app, you'd fetch from cart)
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const amount = parseFloat(searchParams.get('amount') || '0');

  useEffect(() => {
    if (!productId || !amount) {
      setError('ข้อมูลสินค้าไม่ครบถ้วน');
      setLoading(false);
      return;
    }

    createPaymentIntent();
  }, [productId, amount]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentType: 'product',
          metadata: {
            productId,
            productName: productName || 'Product',
            quantity,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setOrderNumber(data.orderNumber);
    } catch (err) {
      setError('ไม่สามารถเริ่มการชำระเงินได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    router.push(`/shop/order-success?orderId=${orderId}&orderNumber=${orderNumber}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดระบบชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              เกิดข้อผิดพลาด
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              กลับไปหน้าก่อนหน้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            ชำระเงินค่าสินค้า
          </h1>

          {/* Order Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">รายละเอียดคำสั่งซื้อ</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">หรายการสั่งซื้อ:</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">สินค้า:</span>
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวน:</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-semibold">ยอดรวม:</span>
                <span className="text-blue-600 font-bold text-lg">
                  ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {clientSecret && (
            <PaymentWrapper
              clientSecret={clientSecret}
              returnUrl={`${process.env.NEXT_PUBLIC_APP_URL}/shop/order-success?orderId=${orderId}&orderNumber=${orderNumber}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PaymentWrapper } from '@/components/features/payments';
import CouponCodeInput, { type CouponDiscount } from '@/components/features/payments/CouponCodeInput';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<CouponDiscount | null>(null);
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false);

  // Get product details from URL params (in real app, you'd fetch from cart)
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const originalAmount = parseFloat(searchParams.get('amount') || '0');
  
  // Calculate final amount after discount
  const finalAmount = couponDiscount ? couponDiscount.finalPrice : originalAmount;

  const createPaymentIntent = useCallback(async () => {
    if (paymentIntentCreated) return; // Prevent multiple calls
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalAmount,
          paymentType: 'product',
          metadata: {
            productId,
            productName: productName || 'Product',
            quantity,
            promotionId: couponDiscount ? couponDiscount.promotionId : undefined,
            originalAmount,
            discountAmount: couponDiscount ? couponDiscount.discountAmount : 0,
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
      setPaymentIntentCreated(true);
    } catch (err) {
      setError('ไม่สามารถเริ่มการชำระเงินได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId, finalAmount, productName, quantity, couponDiscount, originalAmount, paymentIntentCreated]);

  const handleCouponApplied = (discount: CouponDiscount | null) => {
    setCouponDiscount(discount);
    // Reset payment intent if coupon changes
    if (paymentIntentCreated) {
      setPaymentIntentCreated(false);
      setClientSecret(null);
      setOrderId(null);
      setOrderNumber(null);
    }
  };

  const handleProceedToPayment = () => {
    if (!productId || !originalAmount) {
      setError('ข้อมูลสินค้าไม่ครบถ้วน');
      return;
    }
    createPaymentIntent();
  };

  const handlePaymentSuccess = (_paymentIntentId: string) => {
    router.push(`/shop/order-success?orderId=${orderId}&orderNumber=${orderNumber}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading && paymentIntentCreated) {
    return (
      <div className="flex justify-center items-center bg-gray-50 min-h-screen">
        <div className="text-center">
          <div className="mx-auto border-blue-600 border-b-2  w-12 h-12 animate-spin"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดระบบชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center bg-gray-50 p-4 min-h-screen">
        <div className="bg-white shadow-lg p-6  w-full max-w-md">
          <div className="text-center">
            <div className="mb-4 text-red-600 text-5xl">⚠️</div>
            <h1 className="mb-2 font-semibold text-gray-900 text-2xl">
              เกิดข้อผิดพลาด
            </h1>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2  transition-colors"
            >
              กลับไปหน้าก่อนหน้า
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="mx-auto max-w-2xl">
        <div className="bg-white shadow-lg p-6 md:p-8 ">
          <h1 className="mb-6 font-semibold text-gray-900 text-2xl">
            ชำระเงินค่าสินค้า
          </h1>

          {/* Order Summary */}
          <div className="bg-gray-50 mb-6 p-4 ">
            <h2 className="mb-3 font-semibold text-lg">รายละเอียดคำสั่งซื้อ</h2>
            <div className="space-y-2 text-sm">
              {orderNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">เลขที่สั่งซื้อ:</span>
                  <span className="font-medium">{orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">สินค้า:</span>
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวน:</span>
                <span className="font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ราคารวม:</span>
                <span className="font-medium">
                  ฿{originalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {couponDiscount && couponDiscount.discountAmount > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>ส่วนลด:</span>
                    <span className="font-medium">
                      -฿{couponDiscount.discountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {couponDiscount.freeShipping && (
                    <div className="flex justify-between text-green-600">
                      <span>ค่าจัดส่ง:</span>
                      <span className="font-medium">ฟรี</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between pt-2 border-gray-200 border-t">
                <span className="font-semibold text-gray-900">ยอดรวมทั้งสิ้น:</span>
                <span className="font-semibold text-blue-600 text-lg">
                  ฿{finalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Code Input */}
          {!paymentIntentCreated && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-gray-900">โค้ดส่วนลด</h3>
              <CouponCodeInput
                originalAmount={originalAmount}
                paymentType="product"
                productId={productId || undefined}
                onCouponApplied={handleCouponApplied}
                onError={(err) => setError(err)}
              />
            </div>
          )}

          {/* Payment Form */}
          {!paymentIntentCreated ? (
            <button
              onClick={handleProceedToPayment}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white  hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'กำลังเตรียมการชำระเงิน...' : 'ดำเนินการชำระเงิน'}
            </button>
          ) : clientSecret ? (
            <PaymentWrapper
              clientSecret={clientSecret}
              returnUrl={`${process.env.NEXT_PUBLIC_APP_URL}/shop/order-success?orderId=${orderId}&orderNumber=${orderNumber}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ShopCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-gray-50 min-h-screen">
          <div className="border-blue-600 border-b-2  w-12 h-12 animate-spin"></div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PaymentWrapper } from '@/components/features/payments';

function TicketCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get event details from URL params
  const eventId = searchParams.get('eventId');
  const eventName = searchParams.get('eventName');
  const eventDate = searchParams.get('eventDate');
  const ticketCount = parseInt(searchParams.get('ticketCount') || '1');
  const ticketType = searchParams.get('ticketType') || 'general';
  const amount = parseFloat(searchParams.get('amount') || '0');

  const createPaymentIntent = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentType: 'ticket',
          metadata: {
            eventId,
            eventName: eventName || 'Event',
            eventDate,
            ticketCount,
            ticketType,
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
  }, [eventId, amount, eventName, eventDate, ticketCount, ticketType]);

  useEffect(() => {
    if (!eventId || !amount) {
      setError('ข้อมูลการจองไม่ครบถ้วน');
      setLoading(false);
      return;
    }

    createPaymentIntent();
  }, [eventId, amount, createPaymentIntent]);

  const handlePaymentSuccess = (_paymentIntentId: string) => {
    router.push(`/tickets/appointment-success?orderId=${orderId}&orderNumber=${orderNumber}`);
  };

  const handlePaymentError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (loading) {
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
            ชำระเงินค่าตั๋ว
          </h1>

          {/* appointment Summary */}
          <div className="bg-gray-50 mb-8 p-4 ">
            <h2 className="mb-3 font-semibold text-lg">รายละเอียดการจอง</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">เลขที่การจอง:</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">งาน/อีเว้นท์:</span>
                <span className="font-medium">{eventName}</span>
              </div>
              {eventDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">วันที่จัดงาน:</span>
                  <span className="font-medium">
                    {new Date(eventDate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">ประเภทตั๋ว:</span>
                <span className="font-medium capitalize">{ticketType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">จำนวนตั๋ว:</span>
                <span className="font-medium">{ticketCount} ใบ</span>
              </div>
              <div className="flex justify-between pt-2 border-gray-200 border-t">
                <span className="font-semibold text-gray-900">ยอดรวม:</span>
                <span className="font-semibold text-blue-600 text-lg">
                  ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {clientSecret && (
            <PaymentWrapper
              clientSecret={clientSecret}
              returnUrl={`${process.env.NEXT_PUBLIC_APP_URL}/tickets/appointment-success?orderId=${orderId}&orderNumber=${orderNumber}`}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TicketCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-gray-50 min-h-screen">
          <div className="border-blue-600 border-b-2  w-12 h-12 animate-spin"></div>
        </div>
      }
    >
      <TicketCheckoutContent />
    </Suspense>
  );
}

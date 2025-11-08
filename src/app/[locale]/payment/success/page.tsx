'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
// import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  HomeIcon,
  DocumentTextIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface PaymentSuccessData {
  paymentIntentId: string;
  amount: number;
  orderNumber?: string;
  paymentType: string;
  timestamp: string;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  // const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment data from URL params
    const paymentIntentId = searchParams.get('payment_intent');
    const amount = searchParams.get('amount');
    const orderNumber = searchParams.get('order_number');
    const paymentType = searchParams.get('payment_type');

    if (paymentIntentId && amount) {
      setPaymentData({
        paymentIntentId,
        amount: parseFloat(amount),
        orderNumber: orderNumber || undefined,
        paymentType: paymentType || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }

    setLoading(false);
  }, [searchParams]);

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'gym_booking':
        return 'จองค่ายมวย';
      case 'product':
        return 'ซื้อสินค้า';
      case 'ticket':
        return 'ซื้อตั๋ว';
      default:
        return 'การชำระเงิน';
    }
  };

  const handleGoHome = () => {
    router.push(`/${locale}`);
  };

  const handleViewOrders = () => {
    router.push(`/${locale}/dashboard/transactions`);
  };

  const handleViewPayments = () => {
    router.push(`/${locale}/payment?tab=history`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className=" text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">การชำระเงินสำเร็จ!</h1>
            <p className="text-zinc-400 text-lg">
              ขอบคุณสำหรับการชำระเงินของคุณ
            </p>
          </div>

          {/* Payment Details */}
          {paymentData && (
            <div className="bg-zinc-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">รายละเอียดการชำระเงิน</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">ประเภท:</span>
                  <span className=" font-medium">
                    {getPaymentTypeText(paymentData.paymentType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">จำนวนเงิน:</span>
                  <span className=" font-semibold text-lg">
                    ฿{paymentData.amount.toLocaleString()}
                  </span>
                </div>
                {paymentData.orderNumber && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">หมายเลขคำสั่งซื้อ:</span>
                    <span className=" font-mono text-sm">
                      {paymentData.orderNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">วันที่ชำระ:</span>
                  <span className="text-white">
                    {new Date(paymentData.timestamp).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">สถานะ:</span>
                  <span className="text-green-400 font-medium">สำเร็จ</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-zinc-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">ขั้นตอนต่อไป</h3>
            <div className="space-y-4">
              {paymentData?.paymentType === 'gym_booking' && (
                <div className="flex items-start gap-3 p-4 bg-blue-600/10 border border-blue-600/50 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white">การจองค่ายมวย</h4>
                    <p className="text-zinc-400 text-sm">
                      การจองของคุณได้รับการยืนยันแล้ว กรุณามาที่ค่ายมวยตามเวลาที่กำหนด
                    </p>
                  </div>
                </div>
              )}
              
              {paymentData?.paymentType === 'product' && (
                <div className="flex items-start gap-3 p-4 bg-green-600/10 border border-green-600/50 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white">การสั่งซื้อสินค้า</h4>
                    <p className="text-zinc-400 text-sm">
                      ใบเสร็จจะถูกส่งไปยังอีเมลของคุณ และสินค้าจะถูกจัดส่งภายใน 1-3 วันทำการ
                    </p>
                  </div>
                </div>
              )}
              
              {paymentData?.paymentType === 'ticket' && (
                <div className="flex items-start gap-3 p-4 bg-purple-600/10 border border-purple-600/50 rounded-lg">
                  <DocumentTextIcon className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-white">การซื้อตั๋ว</h4>
                    <p className="text-zinc-400 text-sm">
                      ตั๋วของคุณได้รับการยืนยันแล้ว กรุณานำ QR Code ไปแสดงที่งาน
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              <HomeIcon className="w-5 h-5" />
              กลับหน้าหลัก
            </button>
            
            <button
              onClick={handleViewOrders}
              className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              <DocumentTextIcon className="w-5 h-5" />
              ดูรายการสั่งซื้อ
            </button>
            
            <button
              onClick={handleViewPayments}
              className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              <ArrowRightIcon className="w-5 h-5" />
              ดูประวัติการชำระเงิน
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-zinc-800/50 rounded-lg">
            <h4 className="font-medium mb-2">ข้อมูลเพิ่มเติม</h4>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>• ใบเสร็จจะถูกส่งไปยังอีเมลของคุณภายใน 5 นาที</p>
              <p>• หากมีคำถาม กรุณาติดต่อทีมสนับสนุน</p>
              <p>• คุณสามารถดูรายละเอียดการชำระเงินได้ในหน้าประวัติ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className=" text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

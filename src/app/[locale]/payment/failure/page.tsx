'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { 
  XCircleIcon, 
  ArrowRightIcon,
  HomeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface PaymentFailureData {
  error: string;
  amount?: number;
  paymentType?: string;
  timestamp: string;
}

function PaymentFailureContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<PaymentFailureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment data from URL params
    const error = searchParams.get('error');
    const amount = searchParams.get('amount');
    const paymentType = searchParams.get('payment_type');

    if (error) {
      setPaymentData({
        error: decodeURIComponent(error),
        amount: amount ? parseFloat(amount) : undefined,
        paymentType: paymentType || undefined,
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

  const getErrorTitle = (error: string) => {
    if (error.includes('card_declined')) {
      return 'บัตรถูกปฏิเสธ';
    } else if (error.includes('insufficient_funds')) {
      return 'ยอดเงินไม่เพียงพอ';
    } else if (error.includes('expired_card')) {
      return 'บัตรหมดอายุ';
    } else if (error.includes('incorrect_cvc')) {
      return 'รหัส CVV ไม่ถูกต้อง';
    } else if (error.includes('processing_error')) {
      return 'เกิดข้อผิดพลาดในการประมวลผล';
    } else {
      return 'การชำระเงินล้มเหลว';
    }
  };

  const getErrorSuggestion = (error: string) => {
    if (error.includes('card_declined')) {
      return 'กรุณาลองใช้บัตรอื่น หรือติดต่อธนาคารของคุณ';
    } else if (error.includes('insufficient_funds')) {
      return 'กรุณาใช้บัตรอื่น หรือเติมเงินในบัญชีของคุณ';
    } else if (error.includes('expired_card')) {
      return 'กรุณาใช้บัตรที่ยังไม่หมดอายุ';
    } else if (error.includes('incorrect_cvc')) {
      return 'กรุณาตรวจสอบรหัส CVV 3 หลักด้านหลังบัตร';
    } else if (error.includes('processing_error')) {
      return 'กรุณาลองใหม่อีกครั้งในภายหลัง';
    } else {
      return 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง';
    }
  };

  const handleRetryPayment = () => {
    router.push(`/${locale}/payment`);
  };

  const handleGoHome = () => {
    router.push(`/${locale}`);
  };

  const handleContactSupport = () => {
    router.push(`/${locale}/contact`);
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
          {/* Failure Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">การชำระเงินล้มเหลว</h1>
            <p className="text-zinc-400 text-lg">
              ขออภัยในความไม่สะดวก
            </p>
          </div>

          {/* Error Details */}
          {paymentData && (
            <div className="bg-zinc-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">รายละเอียดข้อผิดพลาด</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">ประเภท:</span>
                  <span className=" font-medium">
                    {paymentData.paymentType ? getPaymentTypeText(paymentData.paymentType) : 'การชำระเงิน'}
                  </span>
                </div>
                {paymentData.amount && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">จำนวนเงิน:</span>
                    <span className=" font-semibold text-lg">
                      ฿{paymentData.amount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">วันที่:</span>
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
                  <span className="text-red-400 font-medium">ล้มเหลว</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {paymentData && (
            <div className="bg-brand-primary/10 border border-red-600/50 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-400 mb-2">
                    {getErrorTitle(paymentData.error)}
                  </h3>
                  <p className="text-zinc-300 mb-3">
                    {paymentData.error}
                  </p>
                  <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <p className="text-zinc-300 text-sm">
                      💡 <strong>คำแนะนำ:</strong> {getErrorSuggestion(paymentData.error)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Common Solutions */}
          <div className="bg-zinc-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">วิธีแก้ไขปัญหา</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-600/10 border border-blue-600/50 rounded-lg">
                <ArrowPathIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">ลองใหม่อีกครั้ง</h4>
                  <p className="text-zinc-400 text-sm">
                    ตรวจสอบข้อมูลบัตรและลองชำระเงินอีกครั้ง
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-600/10 border border-green-600/50 rounded-lg">
                <PhoneIcon className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">ใช้วิธีการชำระเงินอื่น</h4>
                  <p className="text-zinc-400 text-sm">
                    ลองใช้พร้อมเพย์ หรือโอนเงินผ่านธนาคาร
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-purple-600/10 border border-purple-600/50 rounded-lg">
                <PhoneIcon className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">ติดต่อทีมสนับสนุน</h4>
                  <p className="text-zinc-400 text-sm">
                    หากปัญหายังคงเกิดขึ้น กรุณาติดต่อทีมสนับสนุน
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRetryPayment}
              className="flex items-center justify-center gap-2 bg-brand-primary hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              <ArrowPathIcon className="w-5 h-5" />
              ลองใหม่อีกครั้ง
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              <HomeIcon className="w-5 h-5" />
              กลับหน้าหลัก
            </button>
            
            <button
              onClick={handleContactSupport}
              className="flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-lg font-semibold transition-colors"
             aria-label="Button">
              <PhoneIcon className="w-5 h-5" />
              ติดต่อสนับสนุน
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-zinc-800/50 rounded-lg">
            <h4 className="font-medium mb-2">ข้อมูลเพิ่มเติม</h4>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>• การชำระเงินของคุณไม่ถูกเรียกเก็บ</p>
              <p>• หากมีคำถาม กรุณาติดต่อทีมสนับสนุน</p>
              <p>• คุณสามารถลองชำระเงินใหม่ได้ตลอดเวลา</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className=" text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}

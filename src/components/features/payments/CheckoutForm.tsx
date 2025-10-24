'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface CheckoutFormProps {
  returnUrl?: string;
  userPhone?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

type ErrorType = 'card_declined' | 'insufficient_funds' | 'expired_card' | 'incorrect_cvc' | 'processing_error' | 'network_error' | 'generic';

interface PaymentError {
  type: ErrorType;
  title: string;
  message: string;
  retryable: boolean;
  suggestion?: string;
}

export default function CheckoutForm({
  returnUrl,
  userPhone,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>(userPhone || '');
  const [retryCount, setRetryCount] = useState(0);

  // Map Stripe error codes to user-friendly messages
  const parseStripeError = (error: { code?: string; decline_code?: string; message?: string }): PaymentError => {
    const code = error.code || error.decline_code;

    switch (code) {
      case 'card_declined':
        return {
          type: 'card_declined',
          title: 'บัตรถูกปฏิเสธ',
          message: 'ธนาคารของคุณปฏิเสธการทำรายการ',
          retryable: true,
          suggestion: 'กรุณาลองใช้บัตรอื่น หรือติดต่อธนาคารของคุณ',
        };
      case 'insufficient_funds':
        return {
          type: 'insufficient_funds',
          title: 'ยอดเงินไม่เพียงพอ',
          message: 'บัตรของคุณมีวงเงินไม่เพียงพอสำหรับการทำรายการนี้',
          retryable: true,
          suggestion: 'กรุณาใช้บัตรอื่น หรือเติมเงินในบัญชีของคุณ',
        };
      case 'expired_card':
        return {
          type: 'expired_card',
          title: 'บัตรหมดอายุ',
          message: 'บัตรของคุณหมดอายุแล้ว',
          retryable: false,
          suggestion: 'กรุณาใช้บัตรที่ยังไม่หมดอายุ',
        };
      case 'incorrect_cvc':
      case 'invalid_cvc':
        return {
          type: 'incorrect_cvc',
          title: 'รหัส CVV ไม่ถูกต้อง',
          message: 'รหัส CVV ที่คุณกรอกไม่ถูกต้อง',
          retryable: true,
          suggestion: 'กรุณาตรวจสอบรหัส CVV 3 หลักด้านหลังบัตร',
        };
      case 'processing_error':
        return {
          type: 'processing_error',
          title: 'เกิดข้อผิดพลาดในการประมวลผล',
          message: 'ธนาคารไม่สามารถดำเนินการได้ในขณะนี้',
          retryable: true,
          suggestion: 'กรุณาลองใหม่อีกครั้งในภายหลัง',
        };
      default:
        return {
          type: 'generic',
          title: 'เกิดข้อผิดพลาด',
          message: error.message || 'ไม่สามารถดำเนินการชำระเงินได้',
          retryable: true,
          suggestion: 'กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง',
        };
    }
  };

  const handleRetry = () => {
    setPaymentError(null);
    setRetryCount(prev => prev + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate phone number
    if (!phoneNumber || phoneNumber.length < 9) {
      setPaymentError({
        type: 'generic',
        title: 'ข้อมูลไม่ครบถ้วน',
        message: 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง',
        retryable: true,
      });
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl || `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              phone: phoneNumber,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        const parsedError = parseStripeError(error);
        setPaymentError(parsedError);
        onError?.(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess?.(paymentIntent.id);
        if (returnUrl) {
          router.push(returnUrl);
        }
      }
    } catch (err) {
      setPaymentError({
        type: 'network_error',
        title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
        retryable: true,
        suggestion: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
      });
      onError?.('Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Phone Number Field */}
      <div>
        <label
          htmlFor="phone"
          className="block mb-2 font-medium text-white text-sm"
        >
          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="0812345678"
          className="bg-zinc-700 px-4 py-3 border border-zinc-600 focus:border-red-500 rounded-lg focus:ring-2 focus:ring-red-500 w-full text-white placeholder-zinc-500"
          required
        />
        <p className="mt-1 text-zinc-400 text-xs">
          เบอร์โทรศัพท์สำหรับติดต่อกรณีมีปัญหา
        </p>
      </div>

      {/* Payment Element */}
      <div>
        <label className="block mb-2 font-medium text-white text-sm">
          เลือกวิธีการชำระเงิน
        </label>
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'alipay', 'promptpay'],
          }}
        />
      </div>

      {/* Error Display */}
      {paymentError && (
        <div className={`rounded-lg border p-6 ${
          paymentError.retryable
            ? 'bg-yellow-600/10 border-yellow-600/50'
            : 'bg-red-600/10 border-red-600/50'
        }`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {paymentError.retryable ? (
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-400" />
              ) : (
                <XCircleIcon className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold text-lg mb-2 ${
                paymentError.retryable ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {paymentError.title}
              </h3>
              <p className="mb-3 text-white text-sm">
                {paymentError.message}
              </p>
              {paymentError.suggestion && (
                <div className="bg-zinc-950/50 mb-3 p-3 rounded-md">
                  <p className="text-zinc-300 text-xs">
                    💡 <strong>คำแนะนำ:</strong> {paymentError.suggestion}
                  </p>
                </div>
              )}
              {paymentError.retryable && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-semibold text-white text-sm transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  ลองใหม่อีกครั้ง
                </button>
              )}
              {retryCount > 0 && (
                <p className="mt-2 text-zinc-400 text-xs">
                  จำนวนครั้งที่ลอง: {retryCount + 1}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="bg-red-600 hover:bg-red-700 disabled:bg-zinc-600 disabled:opacity-50 px-4 py-3 rounded-lg w-full font-semibold text-white transition-colors disabled:cursor-not-allowed"
      >
        {isProcessing ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
      </button>
    </form>
  );
}

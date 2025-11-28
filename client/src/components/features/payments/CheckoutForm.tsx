'use client';

import { useState, FormEvent } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared';
import { 
  parseStripeError, 
  isValidPhoneNumber,
  PaymentError,
  PaymentErrorDisplay
} from './shared';

interface CheckoutFormProps {
  returnUrl?: string;
  userPhone?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
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
    if (!isValidPhoneNumber(phoneNumber)) {
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
          className="block mb-2 font-medium text-sm"
        >
          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="0812345678"
          className="bg-zinc-100 px-4 py-3 border border-zinc-600 focus:border-red-500  focus:ring-2 focus:ring-red-500 w-full placeholder-zinc-500"
          required
        />
        <p className="mt-1 text-zinc-400 text-xs">
          เบอร์โทรศัพท์สำหรับติดต่อกรณีมีปัญหา
        </p>
      </div>

      {/* Payment Element */}
      <div>
        <label className="block mb-2 font-medium text-sm">
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
        <PaymentErrorDisplay
          error={paymentError}
          retryCount={retryCount}
          onRetry={handleRetry}
        />
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        loading={isProcessing}
        loadingText="กำลังดำเนินการ..."
        fullWidth
        size="lg"
      >
        ชำระเงิน
      </Button>
    </form>
  );
}

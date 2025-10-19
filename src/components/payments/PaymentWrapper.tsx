'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';
import CheckoutForm from './CheckoutForm';

interface PaymentWrapperProps {
  clientSecret: string;
  returnUrl?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentWrapper({
  clientSecret,
  returnUrl,
  onSuccess,
  onError,
}: PaymentWrapperProps) {
  const stripePromise = getStripe();

  if (!stripePromise) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          ไม่สามารถโหลดระบบชำระเงินได้ กรุณาลองใหม่อีกครั้ง
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#dc2626',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
          },
        },
      }}
    >
      <CheckoutForm
        returnUrl={returnUrl}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

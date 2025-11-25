'use client';

import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@shared/lib/payments';
import CheckoutForm from './CheckoutForm';

interface PaymentWrapperProps {
  clientSecret: string;
  returnUrl?: string;
  userPhone?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

export default function PaymentWrapper({
  clientSecret,
  returnUrl,
  userPhone,
  onSuccess,
  onError,
}: PaymentWrapperProps) {
  const stripePromise = getStripe();

  if (!stripePromise) {
    return (
      <div className="bg-red-50 p-4 ">
        <p className="text-red-800 text-sm">
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
          theme: 'night',
          variables: {
            colorPrimary: '#dc2626',
            colorBackground: '#27272a',
            colorText: '#ffffff',
            colorDanger: '#ef4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            borderRadius: '8px',
            colorTextPlaceholder: '#71717a',
          },
          rules: {
            '.Label': {
              color: '#ffffff',
              fontWeight: '500',
            },
            '.Input': {
              backgroundColor: '#3f3f46',
              color: '#ffffff',
              border: '1px solid #52525b',
            },
            '.Input:focus': {
              border: '1px solid #dc2626',
              boxShadow: '0 0 0 1px #dc2626',
            },
          },
        },
      }}
    >
      <CheckoutForm
        returnUrl={returnUrl}
        userPhone={userPhone}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

import Stripe from 'stripe';

// Lazy load Stripe secret key
function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ STRIPE_SECRET_KEY not found. Payment features will be disabled.');
  }

  return key || null;
}

// Initialize Stripe lazily
let stripeInstance: Stripe | null | undefined = undefined;

export const stripe: Stripe | null = new Proxy({} as Stripe, {
  get(_, prop: keyof Stripe) {
    if (stripeInstance === undefined) {
      const key = getStripeSecretKey();
      stripeInstance = key
        ? new Stripe(key, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            apiVersion: '2025-10-29.clover' as any, // Latest API version - types may not be updated yet
            typescript: true,
          })
        : null;
    }

    if (!stripeInstance) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    return stripeInstance[prop];
  }
});

// Helper to check if Stripe is configured
export const isStripeConfigured = () => !!getStripeSecretKey();

// Currency configuration
export const CURRENCY = 'thb'; // Thai Baht
export const CURRENCY_SYMBOL = '฿';

const CURRENCY_MULTIPLIERS: Record<string, number> = {
  BIF: 1,
  CLP: 1,
  DJF: 1,
  GNF: 1,
  JPY: 1,
  KMF: 1,
  KRW: 1,
  MGA: 1,
  PYG: 1,
  RWF: 1,
  VND: 1,
  VUV: 1,
  XAF: 1,
  XOF: 1,
  XPF: 1,
  BHD: 1000,
  IQD: 1000,
  JOD: 1000,
  KWD: 1000,
  LYD: 1000,
  OMR: 1000,
  TND: 1000,
};

// Helper function to format amount for Stripe (convert to smallest currency unit)
export function formatAmountForStripe(amount: number, currency: string = CURRENCY): number {
  const normalizedCurrency = currency.toUpperCase();
  const multiplier = CURRENCY_MULTIPLIERS[normalizedCurrency] ?? 100;

  return Math.round(amount * multiplier);
}

// Helper function to format amount for display
export function formatAmountForDisplay(amount: number, currency: string = CURRENCY): string {
  const numberFormat = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'symbol',
  });
  return numberFormat.format(amount);
}

// Payment metadata types
export type PaymentType = 'product' | 'ticket' | 'hospital_booking';

export interface PaymentMetadata {
  type: PaymentType;
  userId: string;
  userEmail: string;
  userName?: string;
}

export interface ProductPaymentMetadata extends PaymentMetadata {
  type: 'product';
  productId: string;
  productName: string;
  quantity: number;
}

export interface TicketPaymentMetadata extends PaymentMetadata {
  type: 'ticket';
  eventId: string;
  eventName: string;
  ticketCount: number;
  ticketType?: string;
}

export interface HospitalBookingPaymentMetadata extends PaymentMetadata {
  type: 'hospital_booking';
  hospitalId: string;
  hospitalName: string;
  startDate: string;
  endDate: string;
  packageType: string;
}

// Backward compatibility alias
export type GymBookingPaymentMetadata = HospitalBookingPaymentMetadata;

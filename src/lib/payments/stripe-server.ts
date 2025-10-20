import Stripe from 'stripe';

// Check if Stripe is configured
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY not found. Payment features will be disabled.');
}

// Initialize Stripe with the secret key (or use a dummy key if not configured)
export const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null;

// Helper to check if Stripe is configured
export const isStripeConfigured = () => !!STRIPE_SECRET_KEY;

// Currency configuration
export const CURRENCY = 'thb'; // Thai Baht
export const CURRENCY_SYMBOL = '฿';

// Helper function to format amount for Stripe (convert to smallest currency unit)
export function formatAmountForStripe(amount: number, currency: string = CURRENCY): number {
  // Stripe expects amounts in smallest currency unit (satang for THB)
  // 1 THB = 100 satang
  return Math.round(amount * 100);
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
export type PaymentType = 'product' | 'ticket' | 'gym_booking';

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

export interface GymBookingPaymentMetadata extends PaymentMetadata {
  type: 'gym_booking';
  gymId: string;
  gymName: string;
  startDate: string;
  endDate: string;
  packageType: string;
}

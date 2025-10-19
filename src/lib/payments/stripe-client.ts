import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;

    if (!key) {
      console.error('Missing STRIPE_PUBLISHABLE_KEY');
      return null;
    }

    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

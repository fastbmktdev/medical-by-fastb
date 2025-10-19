/**
 * Payment Service
 * Business logic for payment operations
 */

import { createClient } from '@/lib/database/supabase/server';
import { stripe, formatAmountForStripe, CURRENCY } from '@/lib/payments';

export interface CreatePaymentIntentInput {
  user_id: string;
  user_email: string;
  amount: number;
  payment_type: 'gym_booking' | 'product' | 'ticket';
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  orderNumber: string;
}

/**
 * Validate payment data
 */
export function validatePaymentData(data: CreatePaymentIntentInput): string[] {
  const errors: string[] = [];

  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('Invalid amount');
  }

  if (!data.payment_type) {
    errors.push('Missing payment type');
  }

  if (!data.metadata) {
    errors.push('Missing metadata');
  }

  return errors;
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  userEmail: string
): Promise<string> {
  const supabase = await createClient();

  // Check if user already has a Stripe customer ID
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .single();

  if (existingPayment?.stripe_customer_id) {
    return existingPayment.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: userEmail,
    metadata: {
      supabase_user_id: userId,
    },
  });

  return customer.id;
}

/**
 * Generate order number
 */
export async function generateOrderNumber(): Promise<string> {
  const supabase = await createClient();

  // Try to use database function if available
  const { data: orderNumberData } = await supabase.rpc('generate_order_number');
  
  if (orderNumberData) {
    return orderNumberData;
  }

  // Fallback to timestamp-based order number
  return `ORD-${Date.now()}`;
}

/**
 * Create payment intent
 */
export async function createPaymentIntent(
  data: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  // Validate data
  const validationErrors = validatePaymentData(data);
  if (validationErrors.length > 0) {
    const error = new Error('Invalid payment data') as Error & { errors: string[] };
    error.errors = validationErrors;
    throw error;
  }

  const supabase = await createClient();

  // Get or create Stripe customer
  const stripeCustomerId = await getOrCreateStripeCustomer(data.user_id, data.user_email);

  // Prepare metadata
  const paymentMetadata: Record<string, string> = {
    type: data.payment_type,
    userId: data.user_id,
    userEmail: data.user_email,
    ...data.metadata,
  };

  // Create payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForStripe(data.amount),
    currency: CURRENCY,
    customer: stripeCustomerId,
    metadata: paymentMetadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Generate order number
  const orderNumber = await generateOrderNumber();

  // Create payment record in database
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: data.user_id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      amount: data.amount,
      currency: CURRENCY,
      status: 'pending',
      payment_type: data.payment_type,
      metadata: paymentMetadata,
    })
    .select()
    .single();

  if (paymentError) {
    throw new Error(`Failed to create payment record: ${paymentError.message}`);
  }

  // Create order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: data.user_id,
      payment_id: payment.id,
      order_number: orderNumber,
      total_amount: data.amount,
      currency: CURRENCY,
      status: 'pending',
      customer_name: data.metadata.userName || '',
      customer_email: data.user_email,
      metadata: paymentMetadata,
    })
    .select()
    .single();

  if (orderError) {
    throw new Error(`Failed to create order record: ${orderError.message}`);
  }

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    orderId: order.id,
    orderNumber: order.order_number,
  };
}

/**
 * Get payment by ID
 */
export async function getPaymentById(id: string) {
  const supabase = await createClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }

  return payment;
}

/**
 * Get payment by Stripe payment intent ID
 */
export async function getPaymentByIntentId(intentId: string) {
  const supabase = await createClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .select('*')
    .eq('stripe_payment_intent_id', intentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }

  return payment;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
) {
  const supabase = await createClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update payment status: ${error.message}`);
  }

  return payment;
}

/**
 * Get user payments
 */
export async function getUserPayments(userId: string) {
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch user payments: ${error.message}`);
  }

  return payments || [];
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch order: ${error.message}`);
  }

  return order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return order;
}

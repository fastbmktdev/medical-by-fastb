/**
 * Payment Service
 * Business logic for payment operations
 */

import { 
  getServiceClient, 
  handleQueryResult, 
  handleQueryError,
  ServiceValidationError,
  ServiceNotFoundError
} from './service-utils';
import { stripe, formatAmountForStripe, CURRENCY, isStripeConfigured } from '@shared/lib/payments';
import { sanitizePrice, generateNumberWithPrefix } from '@shared/lib/utils/number-utils';
import Stripe from 'stripe';

export interface CreatePaymentIntentInput {
  user_id: string;
  user_email: string;
  amount: number;
  payment_type: 'hospital_booking' | 'product' | 'ticket';
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  orderId: string;
  orderNumber: string;
}

// Validation constants
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 999999;
const VALID_PAYMENT_TYPES = ['hospital_booking', 'product', 'ticket'] as const;

/**
 * Validate payment data with enhanced validation
 */
export function validatePaymentData(data: CreatePaymentIntentInput): string[] {
  const errors: string[] = [];

  // Amount validation
  if (!data.amount || typeof data.amount !== 'number') {
    errors.push('Invalid amount format');
  } else if (data.amount < MIN_AMOUNT) {
    errors.push(`Amount must be at least ${MIN_AMOUNT}`);
  } else if (data.amount > MAX_AMOUNT) {
    errors.push(`Amount cannot exceed ${MAX_AMOUNT}`);
  }

  // Payment type validation
  if (!data.payment_type) {
    errors.push('Missing payment type');
  } else if (!VALID_PAYMENT_TYPES.includes(data.payment_type as (typeof VALID_PAYMENT_TYPES)[number])) {
    errors.push('Invalid payment type');
  }

  // User data validation
  if (!data.user_id?.trim()) {
    errors.push('Missing user ID');
  }

  if (!data.user_email?.trim()) {
    errors.push('Missing user email');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.user_email.trim())) {
      errors.push('Invalid email format');
    }
  }

  // Metadata validation
  if (!data.metadata || typeof data.metadata !== 'object') {
    errors.push('Missing or invalid metadata');
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
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const supabase = await getServiceClient();

  // Check if user already has a Stripe customer ID (optimized - only select needed column)
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

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
 * Generate order number with better uniqueness
 */
export async function generateOrderNumber(): Promise<string> {
  const supabase = await getServiceClient();

  // Try to use database function if available
  const { data: orderNumberData } = await supabase.rpc('generate_order_number');
  
  if (orderNumberData) {
    return orderNumberData;
  }

  // Enhanced fallback with date and random component
  return generateNumberWithPrefix('ORD', {
    includeDate: true,
    timestampLength: 6,
    randomLength: 3,
    separator: '-',
  });
}

/**
 * Prepare payment metadata for Stripe
 */
function preparePaymentMetadata(data: CreatePaymentIntentInput): Record<string, string> {
  const paymentMetadata: Record<string, string> = {
    type: data.payment_type,
    userId: data.user_id,
    userEmail: data.user_email.trim().toLowerCase(),
  };

  // Convert all metadata values to strings
  if (data.metadata) {
    Object.entries(data.metadata).forEach(([key, value]) => {
      paymentMetadata[key] = String(value);
    });
  }

  return paymentMetadata;
}

/**
 * Create payment intent with optimized flow
 */
export async function createPaymentIntent(
  data: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  // Check if Stripe is configured
  if (!stripe || !isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  // Validate data
  const validationErrors = validatePaymentData(data);
  if (validationErrors.length > 0) {
    const error = new Error('Invalid payment data') as Error & { errors: string[] };
    error.errors = validationErrors;
    throw error;
  }

  const supabase = await getServiceClient();

  // Prepare metadata and get customer in parallel
  const [paymentMetadata, stripeCustomerId, orderNumber] = await Promise.all([
    Promise.resolve(preparePaymentMetadata(data)),
    getOrCreateStripeCustomer(data.user_id, data.user_email),
    generateOrderNumber(),
  ]);

  // Create payment intent with Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: formatAmountForStripe(data.amount),
    currency: CURRENCY,
    customer: stripeCustomerId,
    metadata: paymentMetadata,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'always',
    },
  });

  // Create payment record
  const paymentResult = await supabase
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

  handleQueryError(paymentResult.error, 'Failed to create payment record');

  // Extract coupon information from metadata if present
  const couponCode = data.metadata.couponCode;
  const originalAmount = data.metadata.originalAmount ? parseFloat(data.metadata.originalAmount) : data.amount;
  const discountAmount = data.metadata.discountAmount ? parseFloat(data.metadata.discountAmount) : 0;
  const promotionId = data.metadata.promotionId || data.metadata.couponCode; // promotionId from coupon validation

  // Add coupon information to metadata
  const orderMetadata = {
    ...paymentMetadata,
    ...(couponCode && {
      coupon_code: couponCode,
      promotion_id: promotionId,
      original_amount: originalAmount,
      discount_amount: discountAmount,
    }),
  };

  // Create order record with payment ID
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: data.user_id,
      payment_id: paymentResult.data.id,
      order_number: orderNumber,
      total_amount: data.amount,
      currency: CURRENCY,
      status: 'pending',
      customer_name: data.metadata.userName || '',
      customer_email: data.user_email.trim().toLowerCase(),
      metadata: orderMetadata,
    })
    .select()
    .single();

  const createdOrder = handleQueryResult(order, orderError, 'Failed to create order record');

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    orderId: createdOrder.id,
    orderNumber: createdOrder.order_number,
  };
}

/**
 * Get payment by ID
 * Optimized: only select needed columns
 */
export async function getPaymentById(id: string) {
  const supabase = await getServiceClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, user_id, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id, amount, currency, status, payment_type, metadata, retry_count, last_retry_at, is_saved_payment_method, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  handleQueryError(error, 'Failed to fetch payment');

  return payment;
}

/**
 * Get payment by Stripe payment intent ID
 * Optimized: only select needed columns
 */
export async function getPaymentByIntentId(intentId: string) {
  const supabase = await getServiceClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, user_id, stripe_payment_intent_id, stripe_customer_id, stripe_payment_method_id, amount, currency, status, payment_type, metadata, retry_count, last_retry_at, is_saved_payment_method, created_at, updated_at')
    .eq('stripe_payment_intent_id', intentId)
    .maybeSingle();

  handleQueryError(error, 'Failed to fetch payment');

  return payment;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled'
) {
  const supabase = await getServiceClient();

  const { data: payment, error } = await supabase
    .from('payments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return handleQueryResult(payment, error, 'Failed to update payment status');
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
) {
  const supabase = await getServiceClient();

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return handleQueryResult(order, error, 'Failed to update order status');
}

/**
 * Get user payments with optional pagination
 * Optimized: only select needed columns
 */
export async function getUserPayments(userId: string, limit: number = 50, offset: number = 0) {
  const supabase = await getServiceClient();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, user_id, stripe_payment_intent_id, stripe_customer_id, amount, currency, status, payment_type, metadata, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  handleQueryError(error, 'Failed to fetch user payments');

  return payments || [];
}

/**
 * Get order by ID
 * Optimized: only select needed columns
 */
export async function getOrderById(id: string) {
  const supabase = await getServiceClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('id, user_id, payment_id, order_number, total_amount, currency, status, customer_name, customer_email, metadata, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  handleQueryError(error, 'Failed to fetch order');

  return order;
}

// ============================================================================
// RETRY FAILED PAYMENT FUNCTIONS
// ============================================================================

export interface RetryPaymentInput {
  payment_id: string;
  payment_method_id?: string; // Optional saved payment method
}

/**
 * Retry a failed payment
 */
export async function retryFailedPayment(
  data: RetryPaymentInput
): Promise<PaymentIntentResult> {
  if (!stripe || !isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const supabase = await getServiceClient();

  // Get the failed payment (optimized - only select needed columns)
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, user_id, stripe_payment_intent_id, stripe_customer_id, amount, currency, status, payment_type, metadata, retry_count')
    .eq('id', data.payment_id)
    .maybeSingle();

  if (paymentError || !payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'failed') {
    throw new Error('Payment is not in failed status');
  }

  // Check retry count
  const retryCount = (payment.retry_count || 0) + 1;
  if (retryCount > 3) {
    throw new Error('Maximum retry attempts reached');
  }

  // Get user email
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    throw new Error('User not found');
  }

  // Get or create Stripe customer
  const stripeCustomerId = payment.stripe_customer_id || 
    await getOrCreateStripeCustomer(payment.user_id, user.user.email || '');

  // Prepare payment intent options
  const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
    amount: formatAmountForStripe(payment.amount),
    currency: payment.currency || CURRENCY,
    customer: stripeCustomerId,
    metadata: {
      ...payment.metadata as Record<string, string>,
      original_payment_id: payment.id,
      retry_count: retryCount.toString(),
    },
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'always',
    },
  };

  // If using saved payment method, attach it
  if (data.payment_method_id) {
    paymentIntentOptions.payment_method = data.payment_method_id;
    paymentIntentOptions.confirmation_method = 'automatic';
    paymentIntentOptions.confirm = true;
  }

  // Create new payment intent
  const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

  // Update original payment record
  await supabase
    .from('payments')
    .update({
      retry_count: retryCount,
      last_retry_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.payment_id);

  // Create new payment record for retry
  const { data: retryPaymentRecord, error: newPaymentError } = await supabase
    .from('payments')
    .insert({
      user_id: payment.user_id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: data.payment_method_id || null,
      amount: payment.amount,
      currency: payment.currency || CURRENCY,
      status: 'pending',
      payment_type: payment.payment_type,
      metadata: {
        ...payment.metadata,
        original_payment_id: payment.id,
        retry_count: retryCount,
        is_retry: true,
      },
      retry_count: 0,
      is_saved_payment_method: !!data.payment_method_id,
    })
    .select()
    .single();

  handleQueryError(newPaymentError, 'Failed to create retry payment record');
  if (!retryPaymentRecord) {
    throw new ServiceNotFoundError('Failed to create retry payment record');
  }

  // Get order number from original payment's order (optimized - only select needed columns)
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('payment_id', payment.id)
    .maybeSingle();

  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: payment.user_id,
        type: 'payment_retry',
        title: 'กำลังลองชำระเงินอีกครั้ง',
        message: order?.order_number
          ? `ระบบได้พยายามชำระเงินอีกครั้งสำหรับคำสั่งซื้อ ${order.order_number}`
          : 'ระบบได้พยายามชำระเงินอีกครั้ง กรุณาตรวจสอบสถานะในหน้าธุรกรรม',
        link_url: '/dashboard/transactions',
        metadata: {
          payment_id: retryPaymentRecord.id,
          original_payment_id: payment.id,
          retry_count: retryCount,
        },
      });
  } catch (notificationError) {
    console.warn('Failed to create payment retry notification:', notificationError);
  }

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    orderId: order?.id || '',
    orderNumber: order?.order_number || '',
  };
}

// ============================================================================
// SAVED PAYMENT METHODS FUNCTIONS
// ============================================================================

export interface SavedPaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  stripe_customer_id: string;
  type: 'card' | 'bank_account' | 'other';
  status: 'active' | 'inactive' | 'expired' | 'deleted';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  billing_name?: string;
  billing_email?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create setup intent for saving payment method
 */
export async function createSetupIntent(userId: string, userEmail: string): Promise<{ clientSecret: string; setupIntentId: string }> {
  if (!stripe || !isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(userId, userEmail);

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    usage: 'off_session', // Allow saving for future use
  });

  return {
    clientSecret: setupIntent.client_secret!,
    setupIntentId: setupIntent.id,
  };
}

/**
 * Save payment method after setup intent confirmation
 */
export async function savePaymentMethod(
  userId: string,
  setupIntentId: string
): Promise<SavedPaymentMethod> {
  if (!stripe || !isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const supabase = await getServiceClient();

  // Retrieve setup intent from Stripe
  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

  if (setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
    throw new Error('Setup intent not confirmed');
  }

  const paymentMethodId = typeof setupIntent.payment_method === 'string'
    ? setupIntent.payment_method
    : setupIntent.payment_method.id;

  // Retrieve payment method details
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: setupIntent.customer as string,
  });

  // Get customer ID
  const customerId = typeof setupIntent.customer === 'string'
    ? setupIntent.customer
    : setupIntent.customer?.id || '';

  // Extract card details
  const card = paymentMethod.card;
  const last4 = card?.last4;
  const brand = card?.brand;
  const expMonth = card?.exp_month;
  const expYear = card?.exp_year;

  // Save to database
  const { data: savedMethod, error } = await supabase
    .from('saved_payment_methods')
    .insert({
      user_id: userId,
      stripe_payment_method_id: paymentMethodId,
      stripe_customer_id: customerId,
      type: 'card',
      status: 'active',
      last4: last4,
      brand: brand,
      exp_month: expMonth,
      exp_year: expYear,
      is_default: false, // Will be set by trigger if it's the first one
    })
    .select()
    .single();

  return handleQueryResult(savedMethod, error, 'Failed to save payment method') as SavedPaymentMethod;
}

/**
 * Get user's saved payment methods
 */
export async function getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
  const supabase = await getServiceClient();

  const { data: methods, error } = await supabase
    .from('saved_payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  handleQueryError(error, 'Failed to fetch saved payment methods');

  return (methods || []) as SavedPaymentMethod[];
}

/**
 * Delete saved payment method
 */
export async function deleteSavedPaymentMethod(
  userId: string,
  methodId: string
): Promise<void> {
  if (!stripe || !isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const supabase = await getServiceClient();

  // Get payment method
  const { data: method, error: fetchError } = await supabase
    .from('saved_payment_methods')
    .select('stripe_payment_method_id')
    .eq('id', methodId)
    .eq('user_id', userId)
    .maybeSingle();

  handleQueryError(fetchError, 'Failed to fetch payment method');
  if (!method) {
    throw new ServiceNotFoundError('Payment method not found');
  }

  // Detach from Stripe customer
  try {
    await stripe.paymentMethods.detach(method.stripe_payment_method_id);
  } catch (stripeError) {
    console.error('Error detaching payment method from Stripe:', stripeError);
    // Continue with database deletion even if Stripe detach fails
  }

  // Soft delete in database
  const { error: deleteError } = await supabase
    .from('saved_payment_methods')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
    })
    .eq('id', methodId)
    .eq('user_id', userId);

  handleQueryError(deleteError, 'Failed to delete payment method');
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  userId: string,
  methodId: string
): Promise<void> {
  const supabase = await getServiceClient();

  const { error } = await supabase
    .from('saved_payment_methods')
    .update({ is_default: true })
    .eq('id', methodId)
    .eq('user_id', userId);

  handleQueryError(error, 'Failed to set default payment method');
}

// ============================================================================
// DISPUTE MANAGEMENT FUNCTIONS
// ============================================================================

export interface PaymentDispute {
  id: string;
  payment_id: string;
  user_id: string;
  stripe_dispute_id: string;
  stripe_charge_id?: string;
  status: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost';
  reason?: string;
  amount: number;
  currency: string;
  evidence_due_by?: string;
  evidence_submitted_at?: string;
  response_deadline?: string;
  admin_notes?: string;
  admin_response?: string;
  responded_at?: string;
  responded_by?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

/**
 * Get user disputes
 * Optimized: only select needed columns
 */
export async function getUserDisputes(userId: string): Promise<PaymentDispute[]> {
  const supabase = await getServiceClient();

  const { data: disputes, error } = await supabase
    .from('payment_disputes')
    .select('id, payment_id, user_id, stripe_dispute_id, stripe_charge_id, status, reason, amount, currency, evidence_due_by, evidence_submitted_at, response_deadline, admin_notes, admin_response, responded_at, responded_by, metadata, created_at, updated_at, resolved_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  handleQueryError(error, 'Failed to fetch disputes');

  return (disputes || []) as PaymentDispute[];
}

/**
 * Get all disputes (admin only)
 * Optimized: only select needed columns
 */
export async function getAllDisputes(
  limit: number = 50,
  offset: number = 0,
  status?: string
): Promise<PaymentDispute[]> {
  const supabase = await getServiceClient();

  let query = supabase
    .from('payment_disputes')
    .select('id, payment_id, user_id, stripe_dispute_id, stripe_charge_id, status, reason, amount, currency, evidence_due_by, evidence_submitted_at, response_deadline, admin_notes, admin_response, responded_at, responded_by, metadata, created_at, updated_at, resolved_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: disputes, error } = await query;

  handleQueryError(error, 'Failed to fetch disputes');

  return (disputes || []) as PaymentDispute[];
}

/**
 * Get dispute by ID
 * Optimized: only select needed columns
 */
export async function getDisputeById(disputeId: string): Promise<PaymentDispute | null> {
  const supabase = await getServiceClient();

  const { data: dispute, error } = await supabase
    .from('payment_disputes')
    .select('id, payment_id, user_id, stripe_dispute_id, stripe_charge_id, status, reason, amount, currency, evidence_due_by, evidence_submitted_at, response_deadline, admin_notes, admin_response, responded_at, responded_by, metadata, created_at, updated_at, resolved_at')
    .eq('id', disputeId)
    .maybeSingle();

  handleQueryError(error, 'Failed to fetch dispute');

  return dispute as PaymentDispute | null;
}

/**
 * Respond to dispute (admin only)
 */
export async function respondToDispute(
  disputeId: string,
  adminUserId: string,
  evidence: {
    product_description?: string;
    customer_name?: string;
    customer_email?: string;
    customer_purchase_ip?: string;
    customer_signature?: string;
    billing_address?: string;
    receipt?: string;
    shipping_address?: string;
    shipping_carrier?: string;
    shipping_date?: string;
    shipping_tracking_number?: string;
    uncategorized_file?: string;
    uncategorized_text?: string;
  },
  adminNotes?: string
): Promise<void> {
  if (!stripe || !isStripeConfigured()) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const supabase = await getServiceClient();

  // Get dispute
  const dispute = await getDisputeById(disputeId);
  if (!dispute) {
    throw new ServiceNotFoundError('Dispute not found');
  }

  // Submit evidence to Stripe
  try {
    await stripe.disputes.update(dispute.stripe_dispute_id, {
      evidence: evidence,
    });
  } catch (stripeError) {
    console.error('Error submitting dispute evidence to Stripe:', stripeError);
    throw new Error('Failed to submit dispute evidence to Stripe');
  }

  // Update dispute in database
  const { error } = await supabase
    .from('payment_disputes')
    .update({
      evidence_submitted_at: new Date().toISOString(),
      admin_notes: adminNotes,
      admin_response: JSON.stringify(evidence),
      responded_at: new Date().toISOString(),
      responded_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId);

  handleQueryError(error, 'Failed to update dispute');
}

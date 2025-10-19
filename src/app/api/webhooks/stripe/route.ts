import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/payments';
import { createClient } from '@/lib/database/supabase/server';
import Stripe from 'stripe';

// Disable body parser to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSuccess(supabase, paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(supabase, paymentIntent);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentCanceled(supabase, paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(supabase, charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Payment succeeded:', paymentIntent.id);

  // Update payment status
  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'succeeded',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (paymentError) {
    console.error('Error updating payment status:', paymentError);
    throw paymentError;
  }

  // Get the payment record to find associated order
  const { data: payment } = await supabase
    .from('payments')
    .select('id, user_id, payment_type, metadata')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (!payment) {
    console.error('Payment record not found');
    return;
  }

  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('payment_id', payment.id);

  if (orderError) {
    console.error('Error updating order status:', orderError);
    throw orderError;
  }

  // Get order details
  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_id', payment.id)
    .single();

  if (!order) {
    console.error('Order not found');
    return;
  }

  // Handle specific payment types
  const metadata = payment.metadata || {};

  switch (payment.payment_type) {
    case 'product':
      await handleProductOrderSuccess(supabase, order.id, metadata);
      break;
    case 'ticket':
      await handleTicketBookingSuccess(supabase, order.id, metadata);
      break;
    case 'gym_booking':
      await handleGymBookingSuccess(supabase, order.id, metadata);
      break;
  }
}

async function handlePaymentFailed(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Payment failed:', paymentIntent.id);

  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Update order status
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (payment) {
    await supabase
      .from('orders')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', payment.id);
  }
}

async function handlePaymentCanceled(
  supabase: any,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Payment canceled:', paymentIntent.id);

  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  // Update order status
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single();

  if (payment) {
    await supabase
      .from('orders')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', payment.id);
  }
}

async function handleRefund(supabase: any, charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  if (!charge.payment_intent) return;

  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent.id;

  // Update payment status
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  // Update order status
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (payment) {
    await supabase
      .from('orders')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', payment.id);
  }
}

async function handleProductOrderSuccess(
  supabase: any,
  orderId: string,
  metadata: any
) {
  // You can create product order records here
  console.log('Product order succeeded:', orderId);
  // TODO: Implement product-specific logic
}

async function handleTicketBookingSuccess(
  supabase: any,
  orderId: string,
  metadata: any
) {
  // You can create ticket booking records here
  console.log('Ticket booking succeeded:', orderId);
  // TODO: Implement ticket-specific logic
}

async function handleGymBookingSuccess(
  supabase: any,
  orderId: string,
  metadata: any
) {
  // Confirm gym booking
  console.log('Gym booking succeeded:', orderId);

  const { data: gymBooking } = await supabase
    .from('gym_bookings')
    .select('id')
    .eq('order_id', orderId)
    .single();

  if (gymBooking) {
    await supabase
      .from('gym_bookings')
      .update({
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', gymBooking.id);
  }
}

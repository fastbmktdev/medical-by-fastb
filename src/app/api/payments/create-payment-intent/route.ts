import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, formatAmountForStripe, CURRENCY } from '@/lib/stripe';
import type {
  PaymentMetadata,
  ProductPaymentMetadata,
  TicketPaymentMetadata,
  GymBookingPaymentMetadata,
} from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, paymentType, metadata } = body;

    // Validate required fields
    if (!amount || !paymentType || !metadata) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, paymentType, metadata' },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined;

    // Check if user already has a Stripe customer ID
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingPayment?.stripe_customer_id) {
      stripeCustomerId = existingPayment.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
    }

    // Prepare metadata based on payment type
    const paymentMetadata: Record<string, string> = {
      type: paymentType,
      userId: user.id,
      userEmail: user.email || '',
      ...metadata,
    };

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: CURRENCY,
      customer: stripeCustomerId,
      metadata: paymentMetadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: stripeCustomerId,
        amount,
        currency: CURRENCY,
        status: 'pending',
        payment_type: paymentType,
        metadata: paymentMetadata,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        payment_id: payment.id,
        order_number: orderNumber,
        total_amount: amount,
        currency: CURRENCY,
        status: 'pending',
        customer_name: metadata.userName || user.user_metadata?.full_name,
        customer_email: user.email,
        metadata: paymentMetadata,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order record:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

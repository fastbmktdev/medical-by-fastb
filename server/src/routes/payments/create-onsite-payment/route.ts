import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      amount?: number;
      paymentType?: string;
      metadata?: Record<string, unknown>;
    };
    const { amount, paymentType, metadata } = body;

    // Validate required fields
    if (!amount || !paymentType) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, paymentType' },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = `ONSITE-${Date.now()}`;

    // Create onsite payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        stripe_payment_intent_id: `onsite_${Date.now()}`, // Placeholder for onsite payments
        stripe_customer_id: null,
        amount: amount,
        currency: 'thb',
        status: 'pending',
        payment_type: paymentType,
        metadata: {
          ...metadata,
          payment_method: 'onsite',
          onsite_payment: true,
        },
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
        user_id: user.id,
        payment_id: payment.id,
        order_number: orderNumber,
        total_amount: amount,
        currency: 'thb',
        status: 'pending',
        customer_name: (metadata?.userName as string) || '',
        customer_email: user.email || '',
        metadata: metadata ? {
          ...metadata,
          payment_method: 'onsite',
          onsite_payment: true,
        } : {
          payment_method: 'onsite',
          onsite_payment: true,
        },
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order record: ${orderError.message}`);
    }

    return NextResponse.json({
      paymentId: payment.id,
      orderId: order.id,
      orderNumber: order.order_number,
      message: 'Onsite payment created successfully',
    });
  } catch (error) {
    console.error('Error creating onsite payment:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

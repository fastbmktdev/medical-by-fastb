import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { createPaymentIntent } from '@/services';

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

    const result = await createPaymentIntent({
      user_id: user.id,
      user_email: user.email || '',
      amount,
      payment_type: paymentType,
      metadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Handle validation errors
    if (error instanceof Error && 'errors' in error) {
      return NextResponse.json(
        {
          error: error.message,
          errors: (error as Error & { errors: string[] }).errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

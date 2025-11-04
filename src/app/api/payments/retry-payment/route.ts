import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { retryFailedPayment } from '@/services';

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
    const { payment_id, payment_method_id } = body;

    // Validate required fields
    if (!payment_id) {
      return NextResponse.json(
        { error: 'Missing required field: payment_id' },
        { status: 400 }
      );
    }

    const result = await retryFailedPayment({
      payment_id,
      payment_method_id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error retrying payment:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


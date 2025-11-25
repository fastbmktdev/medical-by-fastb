import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter using token
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { token, email } = body;

    if (!token && !email) {
      return NextResponse.json(
        { success: false, error: 'Token or email is required' },
        { status: 400 }
      );
    }

    // Find subscription by token or email
    let query = supabase
      .from('newsletter_subscriptions')
      .select('id, email, is_active');

    if (token) {
      query = query.eq('unsubscribe_token', token);
    } else {
      query = query.eq('email', email.toLowerCase());
    }

    const { data: subscription, error: findError } = await query.maybeSingle();

    if (findError) {
      console.error('Find subscription error:', findError);
      return NextResponse.json(
        { success: false, error: 'Failed to find subscription' },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (!subscription.is_active) {
      return NextResponse.json({
        success: true,
        message: 'Already unsubscribed',
      });
    }

    // Unsubscribe
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Unsubscribe error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

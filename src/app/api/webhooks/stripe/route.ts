import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/payments';
import { createClient } from '@/lib/database/supabase/server';
import { sendPaymentReceiptEmail, sendPaymentFailedEmail } from '@/lib/email/resend';
import Stripe from 'stripe';

// Disable body parser to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!stripe) {
    console.error('Stripe is not configured');
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  // For development: allow testing without webhook signature verification
  // ⚠️ NEVER use this in production!
  if (process.env.NODE_ENV === 'development' && !webhookSecret) {
    console.warn('⚠️ Development mode: Webhook signature verification DISABLED');
    console.warn('   For production, set STRIPE_WEBHOOK_SECRET in environment variables');
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      console.error('Failed to parse webhook event:', err);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }
  } else {
    // Production mode: always verify webhook signature
    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
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

      case 'charge.dispute.created':
      case 'charge.dispute.updated':
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;
        await handleDispute(supabase, dispute);
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
  supabase: Awaited<ReturnType<typeof createClient>>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Payment succeeded - process the payment

  try {
    // Option 1: Update via payments table (if payment record exists)
    const { data: payment, error: paymentFetchError } = await supabase
      .from('payments')
      .select('id, user_id, payment_type, metadata')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .maybeSingle();

    if (paymentFetchError) {
      console.error('❌ Error fetching payment:', paymentFetchError);
    }

    if (payment) {
      // Payment record found, updating status

      // Update payment status
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (paymentUpdateError) {
        console.error('❌ Error updating payment status:', paymentUpdateError);
      }

      // Update order status
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_id', payment.id)
        .maybeSingle();

      if (order) {
        await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        // Order updated successfully
      }
    }

    // Option 2: Update via booking directly (using metadata.bookingId)
    const bookingId = paymentIntent.metadata?.bookingId;

    if (bookingId) {
      // Updating booking directly
      const { data: booking, error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select(`
          *,
          gyms:gym_id (
            gym_name,
            gym_name_english
          )
        `)
        .single();

      if (bookingUpdateError) {
        console.error('❌ Error updating booking:', bookingUpdateError);
      } else if (booking) {
        // Send payment receipt email
        try {
          const gymName = booking.gyms?.gym_name || booking.gyms?.gym_name_english || 'ค่ายมวย';
          
          await sendPaymentReceiptEmail({
            to: booking.customer_email || '',
            customerName: booking.customer_name || 'คุณลูกค้า',
            transactionNumber: paymentIntent.id,
            amount: paymentIntent.amount ? paymentIntent.amount / 100 : booking.price_paid || 0,
            paymentMethod: 'Stripe',
            paymentDate: new Date().toISOString(),
            items: [
              {
                description: `${gymName} - ${booking.package_name || 'แพ็คเกจ'}`,
                quantity: 1,
                amount: booking.price_paid || 0,
              },
            ],
            receiptUrl: '/dashboard/transactions',
          });

          // Create in-app notification
          await supabase
            .from('notifications')
            .insert({
              user_id: booking.user_id,
              type: 'payment_received',
              title: 'การชำระเงินสำเร็จ',
              message: `การชำระเงินสำหรับการจอง ${booking.booking_number} สำเร็จแล้ว`,
              link_url: '/dashboard/transactions',
              metadata: {
                booking_id: booking.id,
                payment_intent_id: paymentIntent.id,
              },
            });
        } catch (emailError) {
          console.warn('Email notification error:', emailError);
        }
      }
      // Booking payment status updated successfully
    }
    // No bookingId in metadata, skipping direct booking update

    // Payment success handler completed
  } catch (error) {
    console.error('❌ Error in handlePaymentSuccess:', error);
    // Don't throw - we don't want to fail the webhook
  }
}

async function handlePaymentFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
    .select('id, user_id')
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

  // Get booking from metadata to send failed email
  const bookingId = paymentIntent.metadata?.bookingId;
  if (bookingId) {
    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          gyms:gym_id (
            gym_name,
            gym_name_english
          )
        `)
        .eq('id', bookingId)
        .single();

      if (booking) {
        const failureReason = paymentIntent.last_payment_error?.message || 'ไม่สามารถดำเนินการได้';

        await sendPaymentFailedEmail({
          to: booking.customer_email || '',
          customerName: booking.customer_name || 'คุณลูกค้า',
          transactionNumber: paymentIntent.id,
          amount: paymentIntent.amount ? paymentIntent.amount / 100 : booking.price_paid || 0,
          paymentMethod: 'Stripe',
          failureReason,
          retryUrl: `/gyms/booking/${booking.gym_id}`,
          supportEmail: process.env.CONTACT_EMAIL_TO || 'support@muaythai.com',
        });

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: booking.user_id,
            type: 'payment_failed',
            title: 'การชำระเงินไม่สำเร็จ',
            message: `การชำระเงินสำหรับการจอง ${booking.booking_number} ไม่สำเร็จ: ${failureReason}`,
            link_url: `/gyms/booking/${booking.gym_id}`,
            metadata: {
              booking_id: booking.id,
              payment_intent_id: paymentIntent.id,
            },
          });
      }
    } catch (emailError) {
      console.warn('Email notification error:', emailError);
    }
  }
}

async function handlePaymentCanceled(
  supabase: Awaited<ReturnType<typeof createClient>>,
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

async function handleRefund(supabase: Awaited<ReturnType<typeof createClient>>, charge: Stripe.Charge) {
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

// ============================================================================
// DISPUTE HANDLERS
// ============================================================================

async function handleDispute(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dispute: Stripe.Dispute
) {
  console.log('Dispute event:', dispute.id, dispute.status);

  if (!stripe) {
    console.error('Stripe is not configured');
    return;
  }

  try {
    // Get payment by charge ID
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge.id;
    
    // Find payment by charge ID (we need to get charge details first)
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    if (!paymentIntentId) {
      console.error('No payment intent ID found for dispute');
      return;
    }

    // Find payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, user_id')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment not found for dispute:', paymentError);
      return;
    }

    // Map Stripe dispute status to our enum
    const statusMap: Record<string, string> = {
      'warning_needs_response': 'warning_needs_response',
      'warning_under_review': 'warning_under_review',
      'warning_closed': 'warning_closed',
      'needs_response': 'needs_response',
      'under_review': 'under_review',
      'charge_refunded': 'charge_refunded',
      'won': 'won',
      'lost': 'lost',
    };

    const disputeStatus = statusMap[dispute.status] || dispute.status;

    // Check if dispute already exists
    const { data: existingDispute } = await supabase
      .from('payment_disputes')
      .select('id')
      .eq('stripe_dispute_id', dispute.id)
      .maybeSingle();

    const disputeData = {
      payment_id: payment.id,
      user_id: payment.user_id,
      stripe_dispute_id: dispute.id,
      stripe_charge_id: chargeId,
      status: disputeStatus,
      reason: dispute.reason || null,
      amount: dispute.amount / 100, // Convert from cents
      currency: dispute.currency,
      evidence_due_by: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      response_deadline: dispute.evidence_details?.past_due
        ? new Date().toISOString()
        : null,
      metadata: {
        evidence_submission_count: dispute.evidence_details?.submission_count || 0,
        has_evidence: dispute.evidence_details?.has_evidence || false,
        past_due: dispute.evidence_details?.past_due || false,
      },
      updated_at: new Date().toISOString(),
    };

    if (existingDispute) {
      // Update existing dispute
      await supabase
        .from('payment_disputes')
        .update(disputeData)
        .eq('id', existingDispute.id);

      // If dispute is resolved, set resolved_at
      if (['won', 'lost', 'warning_closed', 'charge_refunded'].includes(disputeStatus)) {
        await supabase
          .from('payment_disputes')
          .update({ resolved_at: new Date().toISOString() })
          .eq('id', existingDispute.id);
      }
    } else {
      // Create new dispute
      const { error: insertError } = await supabase
        .from('payment_disputes')
        .insert({
          ...disputeData,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error creating dispute record:', insertError);
      } else {
        // Create notification for user
        await supabase
          .from('notifications')
          .insert({
            user_id: payment.user_id,
            type: 'payment_dispute',
            title: 'มีการแจ้งข้อพิพาทการชำระเงิน',
            message: `มีการแจ้งข้อพิพาทสำหรับการชำระเงินของคุณ กรุณาติดต่อฝ่ายสนับสนุน`,
            link_url: '/dashboard/transactions',
            metadata: {
              dispute_id: dispute.id,
              payment_id: payment.id,
            },
          });
      }
    }
  } catch (error) {
    console.error('Error handling dispute:', error);
  }
}

// Note: Specific payment type handlers removed
// Payment success now updates booking directly via metadata.bookingId

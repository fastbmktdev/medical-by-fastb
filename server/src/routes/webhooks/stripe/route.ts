import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@shared/lib/payments';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { sendPaymentReceiptEmail, sendPaymentFailedEmail } from '@shared/lib/email/resend';
import { awardReferralBookingPoints, revokeReferralBookingPoints } from '@shared/services/referral.service';
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

  const supabase = await createServerClient();

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
  supabase: Awaited<ReturnType<typeof createServerClient>>,
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
        .select('id, metadata')
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

        // Increment promotion usage if coupon was used
        const orderMetadata = order.metadata as Record<string, unknown> | null;
        const promotionId = orderMetadata?.promotion_id as string | undefined;
        if (promotionId) {
          try {
            const { incrementPromotionUsage } = await import('@shared/services/promotion.service');
            await incrementPromotionUsage(promotionId);
            console.log(`✅ Incremented promotion usage for promotion ${promotionId}`);
          } catch (promoError) {
            // Don't fail payment processing if promotion increment fails
            console.warn('Failed to increment promotion usage:', promoError);
          }
        }

        // Update affiliate conversions for product purchases
        try {
          const { error: conversionUpdateError } = await supabase
            .from('affiliate_conversions')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('reference_id', order.id)
            .eq('reference_type', 'order')
            .eq('conversion_type', 'product_purchase')
            .eq('status', 'pending');

          if (conversionUpdateError) {
            console.warn('Failed to update affiliate conversion status for product purchase:', conversionUpdateError);
          }
        } catch (conversionError) {
          console.warn('Affiliate conversion update error for product purchase:', conversionError);
        }

        // Order updated successfully
      }
    }

    let bookingId = paymentIntent.metadata?.bookingId as string | undefined;

    if (!bookingId && payment?.metadata) {
      const metadata = payment.metadata as Record<string, unknown>;
      bookingId = metadata?.bookingId as string | undefined;
    }

    if (bookingId) {
      // Updating appointment directly
      const { data: appointment, error: bookingUpdateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select(`
          *,
          hospitals:hospital_id (
            hospital_name,
            hospital_name_english
          )
        `)
        .single();

      if (bookingUpdateError) {
        console.error('❌ Error updating appointment:', bookingUpdateError);
      } else if (appointment) {
        // Update affiliate conversions for this appointment
        try {
          const { error: conversionUpdateError } = await supabase
            .from('affiliate_conversions')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('reference_id', bookingId)
            .eq('reference_type', 'appointment')
            .eq('status', 'pending');

          if (conversionUpdateError) {
            console.warn('Failed to update affiliate conversion status:', conversionUpdateError);
          }

          try {
            await awardReferralBookingPoints({
              bookingId,
              supabase,
            });
          } catch (referralPointsError) {
            console.warn('Referral appointment points error:', referralPointsError);
          }

          if (payment && (!payment.metadata || !(payment.metadata as Record<string, unknown>)?.bookingId)) {
            await supabase
              .from('payments')
              .update({
                metadata: {
                  ...(payment.metadata as Record<string, unknown> | null ?? {}),
                  bookingId,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.id);
          }

          if (payment) {
            const { data: orderRecord } = await supabase
              .from('orders')
              .select('id, metadata')
              .eq('payment_id', payment.id)
              .maybeSingle();

            if (orderRecord && !(orderRecord.metadata as Record<string, unknown> | null ?? {})?.bookingId) {
              await supabase
                .from('orders')
                .update({
                  metadata: {
                    ...(orderRecord.metadata as Record<string, unknown> | null ?? {}),
                    bookingId,
                  },
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderRecord.id);
            }
          }
        } catch (conversionError) {
          // Don't fail payment processing if affiliate conversion update fails
          console.warn('Affiliate conversion update error (payment still successful):', conversionError);
        }

        // Send payment receipt email
        try {
          const hospitalName = appointment.hospitals?.hospital_name || appointment.hospitals?.hospital_name_english || 'โรงพยาบาล';
          
          await sendPaymentReceiptEmail({
            to: appointment.customer_email || '',
            customerName: appointment.customer_name || 'คุณลูกค้า',
            transactionNumber: paymentIntent.id,
            amount: paymentIntent.amount ? paymentIntent.amount / 100 : appointment.price_paid || 0,
            paymentMethod: 'Stripe',
            paymentDate: new Date().toISOString(),
            items: [
              {
                description: `${hospitalName} - ${appointment.package_name || 'แพ็คเกจ'}`,
                quantity: 1,
                amount: appointment.price_paid || 0,
              },
            ],
            receiptUrl: '/dashboard/transactions',
          });

          // Create in-app notification
          await supabase
            .from('notifications')
            .insert({
              user_id: appointment.user_id,
              type: 'payment_received',
              title: 'การชำระเงินสำเร็จ',
              message: `การชำระเงินสำหรับการจอง ${appointment.booking_number} สำเร็จแล้ว`,
              link_url: '/dashboard/transactions',
              metadata: {
                booking_id: appointment.id,
                payment_intent_id: paymentIntent.id,
              },
            });
        } catch (emailError) {
          console.warn('Email notification error:', emailError);
        }
      }
      // appointment payment status updated successfully
    }

    // Payment success handler completed
  } catch (error) {
    console.error('❌ Error in handlePaymentSuccess:', error);
    // Don't throw - we don't want to fail the webhook
  }
}

async function handlePaymentFailed(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  paymentIntent: Stripe.PaymentIntent
) {
  console.log('Payment failed:', paymentIntent.id);

  const failureCode = paymentIntent.last_payment_error?.code ?? 'unknown';
  const failureReason = paymentIntent.last_payment_error?.message ?? 'ไม่สามารถดำเนินการได้';
  const nowIso = new Date().toISOString();

  const { data: payment } = await supabase
    .from('payments')
    .select('id, user_id, metadata')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .maybeSingle();

  if (payment) {
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: nowIso,
        metadata: {
          ...(payment.metadata as Record<string, unknown> | null ?? {}),
          last_failure_code: failureCode,
          last_failure_message: failureReason,
          last_failure_at: nowIso,
        },
      })
      .eq('id', payment.id);

    await supabase
      .from('orders')
      .update({
        status: 'canceled',
        updated_at: nowIso,
      })
      .eq('payment_id', payment.id);
  } else {
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: nowIso,
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  }

  const bookingId = paymentIntent.metadata?.bookingId as string | undefined;

  if (bookingId) {
    try {
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          *,
          hospitals:hospital_id (
            hospital_name,
            hospital_name_english
          )
        `)
        .eq('id', bookingId)
        .single();

      if (appointment) {
        const failureContext = getFailureNotificationContent(failureCode, failureReason);

        await sendPaymentFailedEmail({
          to: appointment.customer_email || '',
          customerName: appointment.customer_name || 'คุณลูกค้า',
          transactionNumber: paymentIntent.id,
          amount: paymentIntent.amount ? paymentIntent.amount / 100 : appointment.price_paid || 0,
          paymentMethod: 'Stripe',
          failureReason: failureContext.emailMessage,
          retryUrl: `/hospitals/appointment/${appointment.hospital_id}`,
          supportEmail: process.env.CONTACT_EMAIL_TO || 'support@medical.com',
        });

        await supabase
          .from('notifications')
          .insert({
            user_id: appointment.user_id,
            type: 'payment_failed',
            title: failureContext.title,
            message: failureContext.notificationMessage(appointment.booking_number || ''),
            link_url: `/hospitals/appointment/${appointment.hospital_id}`,
            metadata: {
              booking_id: appointment.id,
              payment_intent_id: paymentIntent.id,
              failure_code: failureCode,
            },
          });
      }
    } catch (notificationError) {
      console.warn('Payment failure notification error:', notificationError);
    }
  }
}

async function handlePaymentCanceled(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
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

async function handleRefund(supabase: Awaited<ReturnType<typeof createServerClient>>, charge: Stripe.Charge) {
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
    .select('id, metadata')
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

  let bookingId: string | undefined;

  if (charge.metadata?.bookingId && typeof charge.metadata.bookingId === 'string') {
    bookingId = charge.metadata.bookingId;
  }

  if (!bookingId && payment?.metadata) {
    const paymentMetadata = payment.metadata as Record<string, unknown> | null ?? {};
    const metadataBookingId = paymentMetadata?.bookingId;
    if (typeof metadataBookingId === 'string') {
      bookingId = metadataBookingId;
    }
  }

  if (!bookingId) {
    const { data: bookingByPayment } = await supabase
      .from('appointments')
      .select('id')
      .eq('payment_id', paymentIntentId)
      .maybeSingle();

    if (bookingByPayment) {
      bookingId = bookingByPayment.id;
    }
  }

  if (bookingId) {
    await supabase
      .from('appointments')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    try {
      await revokeReferralBookingPoints({
        bookingId,
        supabase,
      });
    } catch (revokeError) {
      console.warn('Referral appointment points revoke error:', revokeError);
    }
  }
}

// ============================================================================
// DISPUTE HANDLERS
// ============================================================================

async function handleDispute(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
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
// Payment success now updates appointment directly via metadata.bookingId

type FailureNotificationContext = {
  title: string;
  emailMessage: string;
  notificationMessage: (bookingNumber: string) => string;
};

function getFailureNotificationContent(code: string | undefined, fallbackMessage: string): FailureNotificationContext {
  switch (code) {
    case 'authentication_required':
      return {
        title: 'ต้องยืนยันการชำระเงินเพิ่มเติม',
        emailMessage: 'การชำระเงินถูกปฏิเสธเนื่องจากต้องยืนยันเพิ่มเติม กรุณาลองใหม่และทำตามขั้นตอนจากธนาคาร (3D Secure)',
        notificationMessage: (bookingNumber: string) =>
          `การชำระเงินสำหรับการจอง ${bookingNumber || ''} ต้องยืนยันเพิ่มเติม กรุณาลองใหม่และทำตามขั้นตอนจากธนาคาร`,
      };
    case 'insufficient_funds':
      return {
        title: 'ยอดเงินไม่เพียงพอ',
        emailMessage: 'ยอดเงินในบัญชีหรือบัตรไม่เพียงพอ กรุณาตรวจสอบยอดเงินหรือเลือกวิธีชำระเงินอื่น',
        notificationMessage: (bookingNumber: string) =>
          `ยอดเงินไม่เพียงพอสำหรับการจอง ${bookingNumber || ''} กรุณาใช้วิธีชำระเงินอื่นหรือเติมเงินแล้วลองใหม่`,
      };
    case 'do_not_honor':
    case 'transaction_not_allowed':
      return {
        title: 'ธนาคารปฏิเสธการชำระเงิน',
        emailMessage: 'ธนาคารผู้ออกบัตรปฏิเสธธุรกรรม (do_not_honor) กรุณาติดต่อธนาคารหรือใช้บัตรใบอื่น',
        notificationMessage: (bookingNumber: string) =>
          `ธนาคารปฏิเสธการชำระเงินสำหรับการจอง ${bookingNumber || ''} กรุณาติดต่อธนาคารหรือใช้บัตรใบอื่น`,
      };
    default:
      return {
        title: 'การชำระเงินไม่สำเร็จ',
        emailMessage: fallbackMessage,
        notificationMessage: (bookingNumber: string) =>
          `การชำระเงินสำหรับการจอง ${bookingNumber || ''} ไม่สำเร็จ: ${fallbackMessage}`,
      };
  }
}

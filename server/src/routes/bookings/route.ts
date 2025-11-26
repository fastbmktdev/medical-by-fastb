/**
 * appointments API Endpoint
 * 
 * GET /api/appointments - Get user's appointments
 * POST /api/appointments - Create new appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { requireAuth, withErrorHandling } from '@shared/lib/api/route-utils';
import { successResponse } from '@shared/lib/api/error-handler';
import { getAppointments, createAppointment } from '@shared/services';
import { awardPoints, updateUserStreak } from '@shared/services/gamification.service';
import { sendBookingConfirmationEmail } from '@shared/lib/email/resend';
import { getAffiliateUserIdForReferredUser } from '@shared/lib/utils/affiliate.server';
import { calculateCommissionAmount, getCommissionRate } from '@shared/lib/constants/affiliate';
import { ServiceError } from '@shared/services/service-utils';

/**
 * GET /api/appointments
 * ดึงรายการจองของผู้ใช้
 */
export const GET = withErrorHandling(async (_request: NextRequest) => {
  const supabase = await createClient();
  
  // ตรวจสอบ authentication
  const user = await requireAuth(supabase);

  // ดึงรายการจอง
  const appointments = await getAppointments({ user_id: user.id });

  return successResponse(appointments);
});

/**
 * POST /api/appointments
 * สร้างการจองใหม่ (แบบไม่มีการชำระเงิน - สำหรับ backward compatibility)
 *
 * สำหรับการจองพร้อมชำระเงิน Stripe ให้ใช้:
 * 1. POST /api/payments/create-payment-intent (สร้าง payment intent)
 * 2. POST /api/appointments/hospital (สร้างการจองหลังจาก payment intent สำเร็จ)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  // ตรวจสอบ authentication
  const user = await requireAuth(supabase);

    const body = await request.json() as {
      hospital_id?: string;
      package_id?: string;
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      start_date?: string;
      special_requests?: string;
      payment_method?: string;
      promotion_id?: string;
      discount_amount?: number;
      price_paid?: number;
      payment_id?: string;
    };
    const {
      hospital_id,
      package_id,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      special_requests,
      payment_method,
      promotion_id,
      discount_amount,
      price_paid,
      payment_id,
    } = body;

    // Validate required fields
    if (!hospital_id || !package_id || !customer_name || !customer_email || !customer_phone || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields: hospital_id, package_id, customer_name, customer_email, customer_phone, start_date' },
        { status: 400 }
      );
    }

    const appointment = await createAppointment({
      user_id: user.id,
      hospital_id: hospital_id as string,
      package_id: package_id as string,
      payment_id: payment_id || null,
      customer_name: customer_name as string,
      customer_email: customer_email as string,
      customer_phone: customer_phone as string,
      start_date: start_date as string,
      special_requests,
      payment_method,
      promotion_id: promotion_id || null,
      discount_amount: discount_amount || null,
      price_paid: price_paid,
    });

    if (payment_id && appointment) {
      try {
        if (!appointment.payment_id) {
          await supabase
            .from('appointments')
            .update({
              payment_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', appointment.id);

          appointment.payment_id = payment_id;
        }

        const { data: paymentRecord } = await supabase
          .from('payments')
          .select('id, metadata')
          .eq('stripe_payment_intent_id', payment_id)
          .maybeSingle();

        if (paymentRecord) {
          const updatedPaymentMetadata = {
            ...(paymentRecord.metadata as Record<string, unknown> | null ?? {}),
            bookingId: appointment.id,
          };

          await supabase
            .from('payments')
            .update({
              metadata: updatedPaymentMetadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', paymentRecord.id);

          const { data: orderRecord } = await supabase
            .from('orders')
            .select('id, metadata')
            .eq('payment_id', paymentRecord.id)
            .maybeSingle();

          if (orderRecord) {
            const updatedOrderMetadata = {
              ...(orderRecord.metadata as Record<string, unknown> | null ?? {}),
              bookingId: appointment.id,
            };

            await supabase
              .from('orders')
              .update({
                metadata: updatedOrderMetadata,
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderRecord.id);
          }
        }
      } catch (linkError) {
        console.warn('Failed to link appointment with payment metadata:', linkError);
      }
    }

    try {
      const affiliateUserId = await getAffiliateUserIdForReferredUser(user.id);

      if (affiliateUserId && appointment) {
        const commissionRate = await getCommissionRate('appointment');
        const commissionAmount = calculateCommissionAmount(
          appointment.price_paid ?? price_paid ?? 0,
          commissionRate
        );

        const { data: existingConversion } = await supabase
          .from('affiliate_conversions')
          .select('id')
          .eq('affiliate_user_id', affiliateUserId)
          .eq('referred_user_id', user.id)
          .eq('conversion_type', 'appointment')
          .eq('reference_id', appointment.id)
          .eq('reference_type', 'appointment')
          .maybeSingle();

        if (!existingConversion) {
          await supabase
            .from('affiliate_conversions')
            .insert({
              affiliate_user_id: affiliateUserId,
              referred_user_id: user.id,
              conversion_type: 'appointment',
              conversion_value: appointment.price_paid ?? price_paid ?? 0,
              commission_rate: commissionRate,
              commission_amount: commissionAmount,
              status: 'pending',
              reference_id: appointment.id,
              reference_type: 'appointment',
              referral_source: 'direct',
              metadata: {
                hospital_id,
                package_id,
                package_type: appointment.package_type,
                package_name: appointment.package_name,
                booking_number: appointment.booking_number,
              },
            });
        }
      }
    } catch (affiliateError) {
      console.warn('Affiliate conversion error (appointment still successful):', affiliateError);
    }

    // Send appointment confirmation email
    try {
      // Fetch hospital details for email
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('hospital_name, hospital_name_english, slug')
        .eq('id', hospital_id)
        .single();

      if (hospital && appointment) {
        await sendBookingConfirmationEmail({
          to: customer_email as string,
          customerName: customer_name as string,
          bookingNumber: appointment.booking_number || '',
          hospitalName: hospital.hospital_name || hospital.hospital_name_english || 'โรงพยาบาล',
          packageName: appointment.package_name || '',
          packageType: (appointment.package_type as 'one_time' | 'package') || 'one_time',
          startDate: appointment.start_date,
          endDate: appointment.end_date,
          pricePaid: appointment.price_paid || 0,
          customerPhone: customer_phone,
          specialRequests: special_requests,
          bookingUrl: hospital.slug ? `/dashboard/appointments` : undefined,
        });

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'booking_confirmation',
            title: 'ยืนยันการจองสำเร็จ',
            message: `การจองของคุณ ${appointment.booking_number} ได้รับการยืนยันแล้ว`,
            link_url: '/dashboard/appointments',
            metadata: {
              booking_id: appointment.id,
              booking_number: appointment.booking_number,
            },
          });
      }
    } catch (emailError) {
      // Don't fail the appointment if email fails
      console.warn('Email notification error (appointment still successful):', emailError);
    }

    // Award gamification points for appointment
    try {
      // Check if this is user's first appointment
      const { data: existingBookings } = await supabase
        .from('appointments')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const isFirstBooking = !existingBookings || existingBookings.length === 0;

      // Award points based on appointment type
      const pointsToAward = isFirstBooking ? 100 : 50; // First appointment gets more points
      
      await awardPoints({
        user_id: user.id,
        points: pointsToAward,
        action_type: 'appointment',
        action_description: isFirstBooking ? 'จองโรงพยาบาลครั้งแรก' : 'จองโรงพยาบาล',
        reference_id: appointment.id,
        reference_type: 'appointment',
      });

      // Update appointment streak
      await updateUserStreak({
        user_id: user.id,
        streak_type: 'appointment',
      });

    } catch (gamificationError) {
      // Don't fail the appointment if gamification fails
      console.warn('Gamification error (appointment still successful):', gamificationError);
    }

  return successResponse(
    {
      message: 'สร้างการจองสำเร็จ',
      data: appointment,
      note: 'สำหรับการจองพร้อมชำระเงิน Stripe ให้ใช้ /hospitals/appointment/[hospitalId] แทน'
    },
    201
  );
});


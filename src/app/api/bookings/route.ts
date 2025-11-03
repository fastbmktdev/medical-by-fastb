/**
 * Bookings API Endpoint
 * 
 * GET /api/bookings - Get user's bookings
 * POST /api/bookings - Create new booking
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { NextRequest } from 'next/server';
import { getBookings, createBooking } from '@/services';
import { awardPoints, updateUserStreak } from '@/services/gamification.service';
import { sendBookingConfirmationEmail } from '@/lib/email';

/**
 * GET /api/bookings
 * ดึงรายการจองของผู้ใช้
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ดึงรายการจอง
    const bookings = await getBookings({ user_id: user.id });

    return NextResponse.json({
      success: true,
      data: bookings,
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลการจอง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * สร้างการจองใหม่ (แบบไม่มีการชำระเงิน - สำหรับ backward compatibility)
 *
 * สำหรับการจองพร้อมชำระเงิน Stripe ให้ใช้:
 * 1. POST /api/payments/create-payment-intent (สร้าง payment intent)
 * 2. POST /api/bookings/gym (สร้างการจองหลังจาก payment intent สำเร็จ)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      gym_id,
      package_id,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      special_requests,
      payment_method,
    } = body;

    const booking = await createBooking({
      user_id: user.id,
      gym_id,
      package_id,
      customer_name,
      customer_email,
      customer_phone,
      start_date,
      special_requests,
      payment_method,
    });

    // Send booking confirmation email
    try {
      // Fetch gym details for email
      const { data: gym } = await supabase
        .from('gyms')
        .select('gym_name, gym_name_english, slug')
        .eq('id', gym_id)
        .single();

      if (gym && booking) {
        await sendBookingConfirmationEmail({
          to: customer_email,
          customerName: customer_name,
          bookingNumber: booking.booking_number || '',
          gymName: gym.gym_name || gym.gym_name_english || 'ค่ายมวย',
          packageName: booking.package_name || '',
          packageType: (booking.package_type as 'one_time' | 'package') || 'one_time',
          startDate: booking.start_date,
          endDate: booking.end_date,
          pricePaid: booking.price_paid || 0,
          customerPhone: customer_phone,
          specialRequests: special_requests,
          bookingUrl: gym.slug ? `/dashboard/bookings` : undefined,
        });

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'booking_confirmation',
            title: 'ยืนยันการจองสำเร็จ',
            message: `การจองของคุณ ${booking.booking_number} ได้รับการยืนยันแล้ว`,
            link_url: '/dashboard/bookings',
            metadata: {
              booking_id: booking.id,
              booking_number: booking.booking_number,
            },
          });
      }
    } catch (emailError) {
      // Don't fail the booking if email fails
      console.warn('Email notification error (booking still successful):', emailError);
    }

    // Award gamification points for booking
    try {
      // Check if this is user's first booking
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const isFirstBooking = !existingBookings || existingBookings.length === 0;

      // Award points based on booking type
      const pointsToAward = isFirstBooking ? 100 : 50; // First booking gets more points
      
      await awardPoints({
        user_id: user.id,
        points: pointsToAward,
        action_type: 'booking',
        action_description: isFirstBooking ? 'จองค่ายมวยครั้งแรก' : 'จองค่ายมวย',
        reference_id: booking.id,
        reference_type: 'booking',
      });

      // Update booking streak
      await updateUserStreak({
        user_id: user.id,
        streak_type: 'booking',
      });

    } catch (gamificationError) {
      // Don't fail the booking if gamification fails
      console.warn('Gamification error (booking still successful):', gamificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างการจองสำเร็จ',
      data: booking,
      note: 'สำหรับการจองพร้อมชำระเงิน Stripe ให้ใช้ /gyms/booking/[gymId] แทน'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle validation errors
    if (error instanceof Error && 'errors' in error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: (error as Error & { errors: string[] }).errors,
        },
        { status: 400 }
      );
    }

    // Handle not found errors
    if (error instanceof Error && (
      error.message === 'ไม่พบค่ายมวยที่ต้องการ' ||
      error.message === 'ไม่พบแพ็คเกจที่ต้องการ'
    )) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างการจอง',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


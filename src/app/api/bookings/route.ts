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


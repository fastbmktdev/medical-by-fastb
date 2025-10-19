/**
 * Bookings API Endpoint
 * 
 * GET /api/bookings - Get user's bookings
 * POST /api/bookings - Create new booking
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

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
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        gyms:gym_id (
          id,
          gym_name,
          gym_name_english,
          slug
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      throw bookingsError;
    }

    return NextResponse.json({
      success: true,
      data: bookings || [],
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

    // Validation
    if (!gym_id || !package_id || !customer_name || !customer_email || !customer_phone || !start_date) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, gym_name, status')
      .eq('id', gym_id)
      .eq('status', 'approved')
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยที่ต้องการ' },
        { status: 404 }
      );
    }

    // ดึงข้อมูล package
    const { data: gymPackage, error: packageError } = await supabase
      .from('gym_packages')
      .select('*')
      .eq('id', package_id)
      .eq('gym_id', gym_id)
      .eq('is_active', true)
      .maybeSingle();

    if (packageError || !gymPackage) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบแพ็คเกจที่ต้องการ' },
        { status: 404 }
      );
    }

    // คำนวณ end_date สำหรับ package
    let end_date = null;
    if (gymPackage.package_type === 'package' && gymPackage.duration_months) {
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(startDateObj);
      endDateObj.setMonth(endDateObj.getMonth() + gymPackage.duration_months);
      end_date = endDateObj.toISOString().split('T')[0];
    }

    // Generate booking number
    const bookingNumber = `BK${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // สร้างการจอง
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        gym_id: gym_id,
        package_id: package_id,
        booking_number: bookingNumber,
        customer_name,
        customer_email,
        customer_phone,
        start_date,
        end_date,
        price_paid: gymPackage.price,
        package_name: gymPackage.name,
        package_type: gymPackage.package_type,
        duration_months: gymPackage.duration_months,
        special_requests: special_requests || null,
        payment_method: payment_method || null,
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      throw bookingError;
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างการจองสำเร็จ',
      data: booking,
      note: 'สำหรับการจองพร้อมชำระเงิน Stripe ให้ใช้ /gyms/booking/[gymId] แทน'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating booking:', error);
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


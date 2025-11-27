/**
 * Partner Payout Details API
 * 
 * GET /api/partner/payouts/[id] - ดู payout details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * GET /api/partner/payouts/[id]
 * ดึงรายละเอียด payout เฉพาะ
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    
    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่าเป็น partner หรือ admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || !['partner', 'admin'].includes(roleData.role)) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // ดึง payout
    const { data: payout, error: payoutError } = await supabase
      .from('partner_payouts')
      .select('*')
      .eq('id', id)
      .eq('partner_user_id', user.id) // Ensure partner can only see their own payouts
      .single();

    if (payoutError || !payout) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูล payout' },
        { status: 404 }
      );
    }

    // Get related appointments details
    const bookingIds = payout.related_booking_ids || [];
    let appointments: Array<{
      id: string;
      booking_number: string;
      customer_name: string;
      customer_email: string;
      package_name: string;
      price_paid: number;
      start_date: string;
      end_date: string | null;
      created_at: string;
    }> = [];

    if (bookingIds.length > 0) {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('appointments')
        .select('id, booking_number, customer_name, customer_email, package_name, price_paid, start_date, end_date, created_at')
        .in('id', bookingIds);

      if (!bookingsError && bookingsData) {
        appointments = bookingsData;
      }
    }

    // Get hospital details
    let hospital: {
      id: string;
      hospital_name: string;
      hospital_name_english: string | null;
    } | null = null;
    if (payout.hospital_id) {
      const { data: hospitalData } = await supabase
        .from('hospitals')
        .select('id, hospital_name, hospital_name_english')
        .eq('id', payout.hospital_id)
        .single();

      if (hospitalData) {
        hospital = hospitalData;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...payout,
        hospital,
        appointments,
      },
    });

  } catch (error) {
    console.error('Error fetching payout details:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล payout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


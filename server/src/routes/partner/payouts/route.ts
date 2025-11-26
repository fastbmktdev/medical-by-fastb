/**
 * Partner Payouts API
 * 
 * GET /api/partner/payouts - ดู payouts
 * POST /api/partner/payouts - Request payout
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * GET /api/partner/payouts
 * ดึงรายการ payouts ทั้งหมดของ partner
 * Query params:
 * - status: filter by status (pending, processing, completed, failed, cancelled)
 * - limit: limit number of results (default: 50)
 * - offset: pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
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

    // ดึงค่ายของ partner
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโรงพยาบาลของคุณ กรุณาสมัครเป็นพาร์ทเนอร์ก่อน' },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query
    let query = supabase
      .from('partner_payouts')
      .select('*')
      .eq('partner_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (statusFilter && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data: payouts, error: payoutsError } = await query;

    if (payoutsError) {
      throw payoutsError;
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('partner_payouts')
      .select('*', { count: 'exact', head: true })
      .eq('partner_user_id', user.id);

    if (statusFilter && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(statusFilter)) {
      countQuery = countQuery.eq('status', statusFilter);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      success: true,
      data: {
        payouts: payouts || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
    });

  } catch (error) {
    console.error('Error fetching partner payouts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูล payouts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/partner/payouts
 * Request payout สำหรับ partner
 * Body:
 * - period_start_date: ISO date string (required)
 * - period_end_date: ISO date string (required)
 * - payout_method: bank_transfer | promptpay | truewallet | paypal | other (optional)
 * - bank_account_name: string (optional, required if payout_method is bank_transfer)
 * - bank_account_number: string (optional, required if payout_method is bank_transfer)
 * - bank_name: string (optional)
 * - bank_branch: string (optional)
 * - notes: string (optional)
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

    // ดึงค่ายของ partner
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโรงพยาบาลของคุณ' },
        { status: 404 }
      );
    }

    const body = await request.json() as {
      period_start_date?: string;
      period_end_date?: string;
      payout_method?: string;
      bank_account_name?: string;
      bank_account_number?: string;
      bank_name?: string;
      bank_branch?: string;
      notes?: string;
    };
    const {
      period_start_date,
      period_end_date,
      payout_method,
      bank_account_name,
      bank_account_number,
      bank_name,
      bank_branch,
      notes,
    } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!period_start_date) {
      errors.period_start_date = 'กรุณาระบุวันที่เริ่มต้น';
    }

    if (!period_end_date) {
      errors.period_end_date = 'กรุณาระบุวันที่สิ้นสุด';
    }

    const startDate = period_start_date ? new Date(period_start_date) : null;
    const endDate = period_end_date ? new Date(period_end_date) : null;

    if (startDate && isNaN(startDate.getTime())) {
      errors.period_start_date = 'รูปแบบวันที่ไม่ถูกต้อง';
    }

    if (endDate && isNaN(endDate.getTime())) {
      errors.period_end_date = 'รูปแบบวันที่ไม่ถูกต้อง';
    }

    if (startDate && endDate && endDate < startDate) {
      errors.period_end_date = 'วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น';
    }

    // Validate payout method
    if (payout_method && !['bank_transfer', 'promptpay', 'truewallet', 'paypal', 'other'].includes(payout_method)) {
      errors.payout_method = 'วิธีการจ่ายเงินไม่ถูกต้อง';
    }

    // Validate bank account info if bank_transfer
    if (payout_method === 'bank_transfer') {
      if (!bank_account_name || bank_account_name.trim().length === 0) {
        errors.bank_account_name = 'กรุณาระบุชื่อบัญชี';
      }
      if (!bank_account_number || bank_account_number.trim().length === 0) {
        errors.bank_account_number = 'กรุณาระบุเลขที่บัญชี';
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', errors },
        { status: 400 }
      );
    }

    // Get paid appointments within the period that haven't been included in a payout
    const { data: appointments, error: bookingsError } = await supabase
      .from('appointments')
      .select('id, price_paid, created_at')
      .eq('hospital_id', hospital.id)
      .eq('payment_status', 'paid')
      .gte('created_at', startDate!.toISOString())
      .lte('created_at', endDate!.toISOString());

    if (bookingsError) {
      throw bookingsError;
    }

    // Get existing payouts to exclude already included appointments
    const { data: existingPayouts, error: existingPayoutsError } = await supabase
      .from('partner_payouts')
      .select('related_booking_ids')
      .eq('partner_user_id', user.id)
      .in('status', ['pending', 'processing', 'completed']);

    if (existingPayoutsError) {
      throw existingPayoutsError;
    }

    // Collect all appointment IDs that have been included in payouts
    const includedBookingIds = new Set<string>();
    if (existingPayouts) {
      for (const payout of existingPayouts) {
        if (payout.related_booking_ids && Array.isArray(payout.related_booking_ids)) {
          for (const bookingId of payout.related_booking_ids) {
            includedBookingIds.add(bookingId);
          }
        }
      }
    }

    // Filter out appointments that are already included in payouts
    const availableBookings = appointments?.filter(appointment => !includedBookingIds.has(appointment.id)) || [];

    if (availableBookings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบรายการจองที่สามารถจ่ายได้ในระยะเวลาที่ระบุ' },
        { status: 400 }
      );
    }

    // Calculate payout amounts
    // Default commission rate: 80% (partner gets 80%, platform keeps 20%)
    const DEFAULT_COMMISSION_RATE = 80;
    const commissionRate = DEFAULT_COMMISSION_RATE;

    const totalRevenue = availableBookings.reduce((sum, appointment) => {
      return sum + (parseFloat(appointment.price_paid?.toString() || '0') || 0);
    }, 0);

    const platformFee = totalRevenue * (100 - commissionRate) / 100;
    const netAmount = totalRevenue - platformFee;

    if (netAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'จำนวนเงินที่จ่ายต้องมากกว่า 0' },
        { status: 400 }
      );
    }

    // Create payout (payout_number will be auto-generated by database trigger)
    const { data: newPayout, error: createError } = await supabase
      .from('partner_payouts')
      .insert({
        partner_user_id: user.id,
        hospital_id: hospital.id,
        payout_number: null, // Will be auto-generated by trigger
        amount: netAmount,
        currency: 'thb',
        status: 'pending',
        payout_method: payout_method || null,
        total_revenue: totalRevenue,
        commission_rate: commissionRate,
        platform_fee: platformFee,
        net_amount: netAmount,
        bank_account_name: bank_account_name?.trim() || null,
        bank_account_number: bank_account_number?.trim() || null,
        bank_name: bank_name?.trim() || null,
        bank_branch: bank_branch?.trim() || null,
        period_start_date: startDate!.toISOString().split('T')[0],
        period_end_date: endDate!.toISOString().split('T')[0],
        related_booking_ids: availableBookings.map(b => b.id),
        related_order_ids: [],
        notes: notes?.trim() || null,
        metadata: {
          booking_count: availableBookings.length,
          created_by: user.id,
        },
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Log audit event
    try {
      await supabase.rpc('log_audit_event', {
        p_user_id: user.id,
        p_action_type: 'payout',
        p_resource_type: 'partner_payout',
        p_resource_id: newPayout.id,
        p_resource_name: newPayout.payout_number,
        p_description: `Partner requested payout: ${newPayout.payout_number} for period ${period_start_date} to ${period_end_date}`,
        p_new_values: newPayout,
        p_severity: 'medium',
      });
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งคำขอจ่ายเงินสำเร็จ',
      data: newPayout,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payout request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างคำขอจ่ายเงิน',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


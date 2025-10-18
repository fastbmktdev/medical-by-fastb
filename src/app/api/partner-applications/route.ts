import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/partner-applications
 * ดึงรายการใบสมัคร partner ทั้งหมด (สำหรับ admin)
 * รองรับการกรอง status: pending, approved, rejected
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // ดึง query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // pending, approved, rejected

    // Query ข้อมูล gyms พร้อมข้อมูลผู้สมัคร
    let query = supabase
      .from('gyms')
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // กรองตาม status ถ้ามี
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data: applications, error: queryError } = await query;

    if (queryError) {
      throw queryError;
    }

    return NextResponse.json({
      success: true,
      data: applications || [],
      count: applications?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching partner applications:', error);
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบสมัคร',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

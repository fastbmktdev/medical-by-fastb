import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/partner-applications/[id]
 * อัพเดทสถานะใบสมัคร partner (อนุมัติ/ปฏิเสธ)
 * Body: { status: 'approved' | 'rejected', reason?: string }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[PATCH /api/partner-applications] Auth error:', authError);
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
      .maybeSingle();

    if (roleError) {
      console.error('[PATCH /api/partner-applications] Role query error:', roleError);
      console.error('[PATCH /api/partner-applications] User ID:', user.id);
    }

    if (roleError || roleData?.role !== 'admin') {
      console.error('[PATCH /api/partner-applications] Forbidden:', {
        userId: user.id,
        userEmail: user.email,
        roleData,
        roleError: roleError?.message,
      });
      return NextResponse.json(
        { 
          error: 'Forbidden - คุณไม่มีสิทธิ์เข้าถึง',
          details: roleError ? `Role query error: ${roleError.message}` : `Current role: ${roleData?.role || 'none'}`
        },
        { status: 403 }
      );
    }

    // อ่าน request body
    const body = await request.json() as {
      reason?: string;
      status?: string;
    };
    const { reason } = body;
    let status = body.status;

    // แปลง 'rejected' เป็น 'denied' เพื่อรองรับ frontend
    if (status === 'rejected') {
      status = 'denied';
    }

    // ตรวจสอบ status ที่ส่งมา
    if (!status || !['approved', 'denied', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status - status ต้องเป็น approved, denied/rejected หรือ pending' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล hospital ที่ต้องการอัพเดท
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { error: 'ไม่พบใบสมัครที่ต้องการ' },
        { status: 404 }
      );
    }

    // อัพเดทสถานะ
    const { data: updatedHospital, error: updateError } = await supabase
      .from('hospitals')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    if (!updatedHospital) {
      throw new Error('ไม่สามารถอัพเดทข้อมูลได้');
    }

    // ถ้าอนุมัติ ให้อัพเดท role ของ user เป็น partner
    if (status === 'approved') {
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', hospital.user_id)
        .maybeSingle();

      // เปลี่ยน role เป็น partner เมื่ออนุมัติ
      if (currentRole && currentRole.role !== 'partner' && currentRole.role !== 'admin') {
        await supabase
          .from('user_roles')
          .update({ role: 'partner' })
          .eq('user_id', hospital.user_id);
      }
    }

    // ถ้าปฏิเสธ (denied) ให้เปลี่ยน role กลับเป็น authenticated และลบ hospital application
    if (status === 'denied') {
      const { data: currentRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', hospital.user_id)
        .maybeSingle();

      // เปลี่ยน role กลับเป็น authenticated (ยกเว้น admin)
      if (currentRole && currentRole.role !== 'admin') {
        await supabase
          .from('user_roles')
          .update({ role: 'authenticated' })
          .eq('user_id', hospital.user_id);
      }

      // ลบ hospital application เพื่อให้สามารถสมัครใหม่ได้
      await supabase
        .from('hospitals')
        .delete()
        .eq('id', hospital.id);

      return NextResponse.json({
        success: true,
        message: 'ปฏิเสธใบสมัครและรีเซ็ตสถานะผู้ใช้สำเร็จ - ผู้ใช้สามารถสมัครใหม่ได้',
        data: null,
        reason: reason || null,
      });
    }

    return NextResponse.json({
      success: true,
      message: `อัพเดทสถานะเป็น ${status} สำเร็จ`,
      data: updatedHospital,
      reason: reason || null,
    });

  } catch (error) {
    console.error('Error updating partner application:', error);
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการอัพเดทสถานะ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/partner-applications/[id]
 * ดึงข้อมูลใบสมัคร partner แบบ detail
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

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
      .maybeSingle();

    if (roleError || roleData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // ดึงข้อมูล hospital พร้อมข้อมูลผู้สมัคร
    const { data: application, error: queryError } = await supabase
      .from('hospitals')
      .select(`
        *,
        user:user_id (
          id,
          email,
          created_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (queryError || !application) {
      return NextResponse.json(
        { error: 'ไม่พบใบสมัครที่ต้องการ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });

  } catch (error) {
    console.error('Error fetching partner application:', error);
    return NextResponse.json(
      {
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลใบสมัคร',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

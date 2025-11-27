/**
 * Partner Package Management API
 * 
 * GET /api/partner/packages/[id] - ดึงแพ็คเกจเดี่ยว
 * PATCH /api/partner/packages/[id] - แก้ไขแพ็คเกจ
 * DELETE /api/partner/packages/[id] - ลบแพ็คเกจ
 */

import { NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { NextRequest } from 'next/server';

async function checkPackageOwnership(supabase: Awaited<ReturnType<typeof createServerClient>>, packageId: string, userId: string) {
  // ดึงแพ็คเกจและตรวจสอบว่าเป็นของ user หรือไม่
  const { data: pkg, error } = await supabase
    .from('hospital_packages')
    .select(`
      *,
      hospitals!inner(user_id)
    `)
    .eq('id', packageId)
    .maybeSingle();

  if (error || !pkg) {
    return { package: null, error: 'ไม่พบแพ็คเกจที่ต้องการ' };
  }

  if (pkg.hospitals.user_id !== userId) {
    return { package: null, error: 'คุณไม่มีสิทธิ์จัดการแพ็คเกจนี้' };
  }

  return { package: pkg, error: null };
}

/**
 * GET /api/partner/packages/[id]
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    const { package: pkg, error } = await checkPackageOwnership(supabase, id, user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: pkg,
    });

  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลแพ็คเกจ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/partner/packages/[id]
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบ ownership
    const { error: ownershipError } = await checkPackageOwnership(supabase, id, user.id);

    if (ownershipError) {
      return NextResponse.json(
        { success: false, error: ownershipError },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      name?: string;
      name_english?: string;
      description?: string;
      price?: number;
      duration_months?: number;
      features?: string[];
      is_active?: boolean;
    };
    const {
      name,
      name_english,
      description,
      price,
      duration_months,
      features,
      is_active,
    } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (name !== undefined && name.trim().length < 3) {
      errors.name = 'ชื่อแพ็คเกจต้องมีอย่างน้อย 3 ตัวอักษร';
    }

    if (price !== undefined && price < 0) {
      errors.price = 'ราคาต้องมากกว่า 0';
    }

    if (duration_months !== undefined && duration_months !== null && ![1, 3, 6].includes(duration_months)) {
      errors.duration_months = 'ระยะเวลาต้องเป็น 1, 3 หรือ 6 เดือน';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', errors },
        { status: 400 }
      );
    }

    // สร้าง update object
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (name_english !== undefined) updateData.name_english = name_english?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (price !== undefined) updateData.price = typeof price === 'number' ? price : parseFloat(String(price));
    if (duration_months !== undefined) updateData.duration_months = duration_months;
    if (features !== undefined) updateData.features = features;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update
    const { data: updatedPackage, error: updateError } = await supabase
      .from('hospital_packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'อัพเดทแพ็คเกจสำเร็จ',
      data: updatedPackage,
    });

  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัพเดทแพ็คเกจ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/packages/[id]
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      );
    }

    // ตรวจสอบ ownership
    const { error: ownershipError } = await checkPackageOwnership(supabase, id, user.id);

    if (ownershipError) {
      return NextResponse.json(
        { success: false, error: ownershipError },
        { status: 403 }
      );
    }

    // ตรวจสอบว่ามีการจองที่ใช้แพ็คเกจนี้อยู่หรือไม่
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('package_id', id)
      .eq('status', 'confirmed')
      .limit(1);

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ไม่สามารถลบแพ็คเกจที่มีการจองอยู่ได้ กรุณาปิดการใช้งานแทน' 
        },
        { status: 400 }
      );
    }

    // ลบแพ็คเกจ
    const { error: deleteError } = await supabase
      .from('hospital_packages')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'ลบแพ็คเกจสำเร็จ',
    });

  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบแพ็คเกจ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


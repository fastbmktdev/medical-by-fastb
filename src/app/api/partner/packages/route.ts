/**
 * Partner Packages API
 * 
 * GET /api/partner/packages - ดึงแพ็คเกจของค่ายตัวเอง
 * POST /api/partner/packages - สร้างแพ็คเกจใหม่
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

/**
 * GET /api/partner/packages
 * ดึงแพ็คเกจทั้งหมดของค่ายตัวเอง
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
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, gym_name, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ กรุณาสมัครเป็นพาร์ทเนอร์ก่อน' },
        { status: 404 }
      );
    }

    // ดึงแพ็คเกจทั้งหมด
    const { data: packages, error: packagesError } = await supabase
      .from('gym_packages')
      .select('*')
      .eq('gym_id', gym.id)
      .order('package_type', { ascending: true })
      .order('duration_months', { ascending: true });

    if (packagesError) {
      throw packagesError;
    }

    return NextResponse.json({
      success: true,
      data: {
        gym,
        packages: packages || [],
      },
    });

  } catch (error) {
    console.error('Error fetching partner packages:', error);
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
 * POST /api/partner/packages
 * สร้างแพ็คเกจใหม่
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
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      package_type,
      name,
      name_english,
      description,
      price,
      duration_months,
      features,
    } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!package_type || !['one_time', 'package'].includes(package_type)) {
      errors.package_type = 'ประเภทแพ็คเกจไม่ถูกต้อง';
    }

    if (!name || name.trim().length < 3) {
      errors.name = 'ชื่อแพ็คเกจต้องมีอย่างน้อย 3 ตัวอักษร';
    }

    if (!price || price < 0) {
      errors.price = 'ราคาต้องมากกว่า 0';
    }

    if (package_type === 'package') {
      if (!duration_months || ![1, 3, 6].includes(duration_months)) {
        errors.duration_months = 'ระยะเวลาต้องเป็น 1, 3 หรือ 6 เดือน';
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', errors },
        { status: 400 }
      );
    }

    // สร้างแพ็คเกจ
    const { data: newPackage, error: createError } = await supabase
      .from('gym_packages')
      .insert({
        gym_id: gym.id,
        package_type,
        name: name.trim(),
        name_english: name_english?.trim() || null,
        description: description?.trim() || null,
        price: parseFloat(price),
        duration_months: package_type === 'package' ? duration_months : null,
        features: features || [],
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างแพ็คเกจสำเร็จ',
      data: newPackage,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างแพ็คเกจ',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


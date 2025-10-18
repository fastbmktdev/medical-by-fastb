/**
 * Gyms API Endpoint (Admin Only)
 * 
 * GET /api/gyms - List all gyms
 * POST /api/gyms - Create new gym
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Check if user is admin
    if (roleData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all gyms with user info
    const { data: gyms, error } = await supabase
      .from('gyms')
      .select(`
        *,
        profiles:user_id (
          username,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gyms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gyms' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: gyms?.length || 0,
      gyms: gyms || [],
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gyms
 * สร้างยิมใหม่ (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ตรวจสอบ authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - กรุณาเข้าสู่ระบบ' },
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
        { success: false, error: 'Forbidden - คุณไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      );
    }

    // อ่าน request body
    const body = await request.json();
    const {
      gym_name,
      contact_name,
      phone,
      email,
      website,
      location,
      gym_details,
      services,
      status,
    } = body;

    // Validation
    const errors: Record<string, string> = {};

    if (!gym_name || gym_name.trim().length < 3 || gym_name.trim().length > 100) {
      errors.gym_name = 'ชื่อยิมต้องมีความยาว 3-100 ตัวอักษร';
    }

    if (!contact_name || contact_name.trim().length < 2 || contact_name.trim().length > 100) {
      errors.contact_name = 'ชื่อผู้ติดต่อต้องมีความยาว 2-100 ตัวอักษร';
    }

    if (!phone) {
      errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    } else {
      const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 02-123-4567 หรือ 0812345678)';
      }
    }

    if (!email) {
      errors.email = 'กรุณากรอกอีเมล';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
      }
    }

    if (website) {
      try {
        new URL(website);
      } catch {
        errors.website = 'รูปแบบ URL ไม่ถูกต้อง';
      }
    }

    if (!location || location.trim().length < 10) {
      errors.location = 'ที่อยู่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร';
    }

    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      errors.status = 'สถานะไม่ถูกต้อง';
    }

    // ถ้ามี validation errors
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง',
          errors,
        },
        { status: 400 }
      );
    }

    // สร้างยิมใหม่
    const newGym = {
      user_id: user.id,
      gym_name: gym_name.trim(),
      contact_name: contact_name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website?.trim() || null,
      location: location.trim(),
      gym_details: gym_details?.trim() || null,
      services: services || [],
      images: [],
      status: status || 'approved', // Default เป็น approved เพราะ admin สร้างเอง
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdGym, error: createError } = await supabase
      .from('gyms')
      .insert([newGym])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({
      success: true,
      message: 'สร้างยิมใหม่สำเร็จ',
      data: createdGym,
    });

  } catch (error) {
    console.error('Error creating gym:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการสร้างยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


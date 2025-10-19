/**
 * Gym Management API Endpoint (Admin Only)
 * 
 * GET /api/gyms/[id] - Get single gym details
 * PATCH /api/gyms/[id] - Update gym information
 * DELETE /api/gyms/[id] - Delete gym
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';
import { NextRequest } from 'next/server';

/**
 * GET /api/gyms/[id]
 * ดึงข้อมูลยิมเดี่ยว
 */
const getGymHandler = withAdminAuth<{ id: string }>(async (
  _request,
  context
) => {
  try {
    const supabase = await createClient();
    const { id } = context.params;

    // ดึงข้อมูล gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบยิมที่ต้องการ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: gym,
    });

  } catch (error) {
    console.error('Error fetching gym:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการดึงข้อมูลยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { getGymHandler as GET };


/**
 * PATCH /api/gyms/[id]
 * แก้ไขข้อมูลยิม
 */
const patchGymHandler = withAdminAuth<{ id: string }>(async (
  request,
  context
) => {
  try {
    const supabase = await createClient();
    const { id } = context.params;

    const body = await request.json();
    const {
      gym_name,
      gym_name_english,
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

    if (gym_name !== undefined) {
      if (!gym_name || gym_name.trim().length < 3 || gym_name.trim().length > 100) {
        errors.gym_name = 'ชื่อยิมต้องมีความยาว 3-100 ตัวอักษร';
      }
    }

    if (gym_name_english !== undefined && gym_name_english) {
      if (gym_name_english.trim().length < 3 || gym_name_english.trim().length > 100) {
        errors.gym_name_english = 'ชื่อภาษาอังกฤษต้องมีความยาว 3-100 ตัวอักษร';
      }
    }

    if (contact_name !== undefined) {
      if (!contact_name || contact_name.trim().length < 2 || contact_name.trim().length > 100) {
        errors.contact_name = 'ชื่อผู้ติดต่อต้องมีความยาว 2-100 ตัวอักษร';
      }
    }

    if (phone !== undefined) {
      if (!phone) {
        errors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
      } else {
        // Thai phone format: 0X-XXXX-XXXX or 0XXXXXXXXX
        const phoneRegex = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง (ตัวอย่าง: 02-123-4567 หรือ 0812345678)';
        }
      }
    }

    if (email !== undefined) {
      if (!email) {
        errors.email = 'กรุณากรอกอีเมล';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
      }
    }

    if (website !== undefined && website) {
      try {
        new URL(website);
      } catch {
        errors.website = 'รูปแบบ URL ไม่ถูกต้อง';
      }
    }

    if (location !== undefined) {
      if (!location || location.trim().length < 10) {
        errors.location = 'ที่อยู่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร';
      }
    }

    if (status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        errors.status = 'สถานะไม่ถูกต้อง';
      }
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

    // ตรวจสอบว่ายิมมีอยู่จริง
    const { data: existingGym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (gymError || !existingGym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบยิมที่ต้องการ' },
        { status: 404 }
      );
    }

    // สร้าง update object (เฉพาะ fields ที่ส่งมา)
    const updateData: Record<string, string | string[] | null> = {
      updated_at: new Date().toISOString(),
    };

    if (gym_name !== undefined) updateData.gym_name = gym_name.trim();
    if (gym_name_english !== undefined) updateData.gym_name_english = gym_name_english?.trim() || null;
    if (contact_name !== undefined) updateData.contact_name = contact_name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (website !== undefined) updateData.website = website.trim() || null;
    if (location !== undefined) updateData.location = location.trim();
    if (gym_details !== undefined) updateData.gym_details = gym_details?.trim() || null;
    if (services !== undefined) updateData.services = services;
    if (status !== undefined) updateData.status = status;
    
    // Note: slug will be auto-generated by database trigger from gym_name_english

    // อัพเดทข้อมูล
    const { data: updatedGym, error: updateError } = await supabase
      .from('gyms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'อัพเดทข้อมูลยิมสำเร็จ',
      data: updatedGym,
    });

  } catch (error) {
    console.error('Error updating gym:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { patchGymHandler as PATCH };

/**
 * DELETE /api/gyms/[id]
 * ลบยิม
 */
const deleteGymHandler = withAdminAuth<{ id: string }>(async (
  _request,
  context
) => {
  try {
    const supabase = await createClient();
    const { id } = context.params;

    // ตรวจสอบว่ายิมมีอยู่จริง
    const { data: existingGym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (gymError || !existingGym) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบยิมที่ต้องการ' },
        { status: 404 }
      );
    }

    // ลบยิม
    const { error: deleteError } = await supabase
      .from('gyms')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'ลบยิมสำเร็จ',
    });

  } catch (error) {
    console.error('Error deleting gym:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดในการลบยิม',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

export { deleteGymHandler as DELETE };

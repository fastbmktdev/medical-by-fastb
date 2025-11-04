/**
 * Partner Promotion Detail API
 * 
 * PATCH /api/partner/promotions/[id] - แก้ไข promotion
 * DELETE /api/partner/promotions/[id] - ลบ promotion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/partner/promotions/[id]
 * แก้ไข promotion ของค่ายตัวเอง
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
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า promotion นี้เป็นของ gym นี้หรือไม่
    const { data: existingPromotion, error: fetchError } = await supabase
      .from('promotions')
      .select('id, gym_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโปรโมชั่น' },
        { status: 404 }
      );
    }

    if (existingPromotion.gym_id !== gym.id) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขโปรโมชั่นนี้' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      titleEnglish,
      description,
      isActive,
      priority,
      showInMarquee,
      startDate,
      endDate,
      linkUrl,
      linkText,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    
    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }
    
    if (titleEnglish !== undefined) {
      updateData.title_english = titleEnglish?.trim() || null;
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    
    if (isActive !== undefined) {
      updateData.is_active = isActive;
    }
    
    if (priority !== undefined) {
      if (typeof priority !== 'number' || priority < 0) {
        return NextResponse.json(
          { success: false, error: 'Priority must be a non-negative number' },
          { status: 400 }
        );
      }
      updateData.priority = parseInt(priority.toString()) || 0;
    }
    
    if (showInMarquee !== undefined) {
      updateData.show_in_marquee = showInMarquee;
    }
    
    if (startDate !== undefined) {
      if (startDate && isNaN(new Date(startDate).getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid start date format' },
          { status: 400 }
        );
      }
      updateData.start_date = startDate ? new Date(startDate).toISOString() : null;
    }
    
    if (endDate !== undefined) {
      if (endDate && isNaN(new Date(endDate).getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid end date format' },
          { status: 400 }
        );
      }
      updateData.end_date = endDate ? new Date(endDate).toISOString() : null;
    }
    
    // Validate date range if both dates are provided
    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.start_date as string) >= new Date(updateData.end_date as string)) {
        return NextResponse.json(
          { success: false, error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }
    
    if (linkUrl !== undefined) {
      updateData.link_url = linkUrl?.trim() || null;
    }
    
    if (linkText !== undefined) {
      updateData.link_text = linkText?.trim() || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Update promotion
    const { data: updatedPromotion, error: updateError } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .eq('gym_id', gym.id) // Ensure we can only update own gym's promotions
      .select()
      .single();

    if (updateError) {
      console.error('Error updating partner promotion:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update promotion', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPromotion,
      message: 'Promotion updated successfully',
    });

  } catch (error) {
    console.error('Update partner promotion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/partner/promotions/[id]
 * ลบ promotion ของค่ายตัวเอง
 */
export async function DELETE(
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
        { success: false, error: 'ไม่พบค่ายมวยของคุณ' },
        { status: 404 }
      );
    }

    // ตรวจสอบว่า promotion นี้เป็นของ gym นี้หรือไม่
    const { data: existingPromotion, error: fetchError } = await supabase
      .from('promotions')
      .select('id, gym_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโปรโมชั่น' },
        { status: 404 }
      );
    }

    if (existingPromotion.gym_id !== gym.id) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์ลบโปรโมชั่นนี้' },
        { status: 403 }
      );
    }

    // Delete promotion
    const { error: deleteError } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
      .eq('gym_id', gym.id); // Ensure we can only delete own gym's promotions

    if (deleteError) {
      console.error('Error deleting partner promotion:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete promotion', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully',
    });

  } catch (error) {
    console.error('Delete partner promotion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

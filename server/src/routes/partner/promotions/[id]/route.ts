/**
 * Partner Promotion Detail API
 * 
 * PATCH /api/partner/promotions/[id] - แก้ไข promotion
 * DELETE /api/partner/promotions/[id] - ลบ promotion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

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

    // ตรวจสอบว่า promotion นี้เป็นของ hospital นี้หรือไม่
    const { data: existingPromotion, error: fetchError } = await supabase
      .from('promotions')
      .select('id, hospital_id, discount_type, discount_value')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโปรโมชั่น' },
        { status: 404 }
      );
    }

    if (existingPromotion.hospital_id !== hospital.id) {
      return NextResponse.json(
        { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขโปรโมชั่นนี้' },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      title?: string;
      titleEnglish?: string;
      description?: string;
      isActive?: boolean;
      priority?: number;
      showInMarquee?: boolean;
      startDate?: string;
      endDate?: string;
      linkUrl?: string;
      linkText?: string;
      discountType?: string;
      discountValue?: number;
      packageId?: string;
      minPurchaseAmount?: number;
      maxDiscountAmount?: number;
      maxUses?: number;
    };
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
      // Discount fields
      discountType,
      discountValue,
      packageId,
      minPurchaseAmount,
      maxDiscountAmount,
      maxUses,
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

    // Validate and add discount fields
    if (discountType !== undefined) {
      if (discountType !== null && !['percentage', 'fixed_amount'].includes(discountType)) {
        return NextResponse.json(
          { success: false, error: 'Invalid discount type. Must be "percentage" or "fixed_amount"' },
          { status: 400 }
        );
      }
      updateData.discount_type = discountType || null;
    }

    if (discountValue !== undefined) {
      if (discountValue !== null) {
        const numValue = Number(discountValue);
        if (isNaN(numValue) || numValue < 0) {
          return NextResponse.json(
            { success: false, error: 'Discount value must be a non-negative number' },
            { status: 400 }
          );
        }

        // Validate percentage range if discount type is percentage
        const currentDiscountType = discountType !== undefined ? discountType : existingPromotion.discount_type;
        if (currentDiscountType === 'percentage' && (numValue < 0 || numValue > 100)) {
          return NextResponse.json(
            { success: false, error: 'Percentage discount must be between 0 and 100' },
            { status: 400 }
          );
        }
      }
      updateData.discount_value = discountValue !== null ? Number(discountValue) : null;
    }

    // Validate consistency: if discount_type is set, discount_value must be set
    const finalDiscountType = discountType !== undefined ? discountType : existingPromotion.discount_type;
    const finalDiscountValue = discountValue !== undefined ? discountValue : existingPromotion.discount_value;
    if (finalDiscountType !== null && (finalDiscountValue === null || finalDiscountValue === undefined)) {
      return NextResponse.json(
        { success: false, error: 'Discount value is required when discount type is set' },
        { status: 400 }
      );
    }

    if (packageId !== undefined) {
      if (packageId !== null) {
        // Verify package belongs to the hospital
        const { data: packageData, error: packageError } = await supabase
          .from('hospital_packages')
          .select('id, hospital_id')
          .eq('id', packageId)
          .eq('hospital_id', hospital.id)
          .maybeSingle();

        if (packageError || !packageData) {
          return NextResponse.json(
            { success: false, error: 'Package not found or does not belong to your hospital' },
            { status: 400 }
          );
        }
      }
      updateData.package_id = packageId || null;
    }

    if (minPurchaseAmount !== undefined) {
      if (minPurchaseAmount !== null) {
        const numValue = Number(minPurchaseAmount);
        if (isNaN(numValue) || numValue < 0) {
          return NextResponse.json(
            { success: false, error: 'Minimum purchase amount must be a non-negative number' },
            { status: 400 }
          );
        }
      }
      updateData.min_purchase_amount = minPurchaseAmount !== null ? Number(minPurchaseAmount) : null;
    }

    if (maxDiscountAmount !== undefined) {
      if (maxDiscountAmount !== null) {
        const numValue = Number(maxDiscountAmount);
        if (isNaN(numValue) || numValue < 0) {
          return NextResponse.json(
            { success: false, error: 'Maximum discount amount must be a non-negative number' },
            { status: 400 }
          );
        }
      }
      updateData.max_discount_amount = maxDiscountAmount !== null ? Number(maxDiscountAmount) : null;
    }

    if (maxUses !== undefined) {
      if (maxUses !== null) {
        const numValue = Number(maxUses);
        if (isNaN(numValue) || numValue <= 0 || !Number.isInteger(numValue)) {
          return NextResponse.json(
            { success: false, error: 'Maximum uses must be a positive integer' },
            { status: 400 }
          );
        }
      }
      updateData.max_uses = maxUses !== null ? Number(maxUses) : null;
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
      .eq('hospital_id', hospital.id) // Ensure we can only update own hospital's promotions
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

    // ตรวจสอบว่า promotion นี้เป็นของ hospital นี้หรือไม่
    const { data: existingPromotion, error: fetchError } = await supabase
      .from('promotions')
      .select('id, hospital_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingPromotion) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบโปรโมชั่น' },
        { status: 404 }
      );
    }

    if (existingPromotion.hospital_id !== hospital.id) {
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
      .eq('hospital_id', hospital.id); // Ensure we can only delete own hospital's promotions

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

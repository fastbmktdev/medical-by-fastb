/**
 * Shipping Method API Endpoint
 * 
 * GET, PUT, DELETE /api/shipping/methods/[id] - Manage single shipping method (Admin only for PUT/DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * GET /api/shipping/methods/[id]
 * Get single shipping method by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: method, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Get shipping method error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shipping method' },
        { status: 500 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Shipping method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: method.id || "",
        nameThai: method.name_thai || "",
        nameEnglish: method.name_english || "",
        description: method.description || "",
        basePrice: method.base_price ? parseFloat(method.base_price) || 0 : 0,
        pricePerKg: method.price_per_kg ? parseFloat(method.price_per_kg) || 0 : 0,
        estimatedDaysMin: method.estimated_days_min ?? 0,
        estimatedDaysMax: method.estimated_days_max ?? 0,
        isActive: method.is_active ?? true,
        displayOrder: method.display_order ?? 0,
        createdAt: method.created_at || "",
        updatedAt: method.updated_at || "",
      },
    });

  } catch (error) {
    console.error('Get shipping method error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shipping/methods/[id]
 * Update shipping method (Admin only)
 */
export const PUT = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json();

    // Check if method exists
    const { data: existingMethod, error: checkError } = await supabase
      .from('shipping_methods')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !existingMethod) {
      return NextResponse.json(
        { success: false, error: 'Shipping method not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.nameThai !== undefined) updateData.name_thai = body.nameThai;
    if (body.nameEnglish !== undefined) updateData.name_english = body.nameEnglish;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.basePrice !== undefined) updateData.base_price = parseFloat(body.basePrice);
    if (body.pricePerKg !== undefined) updateData.price_per_kg = parseFloat(body.pricePerKg);
    if (body.estimatedDaysMin !== undefined) updateData.estimated_days_min = parseInt(body.estimatedDaysMin);
    if (body.estimatedDaysMax !== undefined) updateData.estimated_days_max = parseInt(body.estimatedDaysMax);
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.displayOrder !== undefined) updateData.display_order = parseInt(body.displayOrder);

    // Update method
    const { data: method, error } = await supabase
      .from('shipping_methods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update shipping method error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update shipping method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: method.id || "",
        nameThai: method.name_thai || "",
        nameEnglish: method.name_english || "",
        description: method.description || "",
        basePrice: method.base_price ? parseFloat(method.base_price) || 0 : 0,
        pricePerKg: method.price_per_kg ? parseFloat(method.price_per_kg) || 0 : 0,
        estimatedDaysMin: method.estimated_days_min ?? 0,
        estimatedDaysMax: method.estimated_days_max ?? 0,
        isActive: method.is_active ?? true,
        displayOrder: method.display_order ?? 0,
      },
    });

  } catch (error) {
    console.error('Update shipping method error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/shipping/methods/[id]
 * Delete shipping method (Admin only)
 */
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    // Check if method exists
    const { data: method, error: checkError } = await supabase
      .from('shipping_methods')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !method) {
      return NextResponse.json(
        { success: false, error: 'Shipping method not found' },
        { status: 404 }
      );
    }

    // Check if method is used by orders
    const { data: orders, error: ordersError } = await supabase
      .from('product_orders')
      .select('order_id')
      .eq('shipping_method_id', id)
      .limit(1);

    if (ordersError) {
      console.error('Check orders error:', ordersError);
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete shipping method that is used by orders' },
        { status: 400 }
      );
    }

    // Delete method
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete shipping method error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete shipping method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping method deleted successfully',
    });

  } catch (error) {
    console.error('Delete shipping method error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


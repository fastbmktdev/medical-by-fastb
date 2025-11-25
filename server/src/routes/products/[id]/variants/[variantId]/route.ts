/**
 * Product Variant API Endpoint
 * 
 * PUT, DELETE /api/products/[id]/variants/[variantId] - Manage single variant (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * PUT /api/products/[id]/variants/[variantId]
 * Update variant (Admin only)
 */
export const PUT = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id, variantId } = await params;
    const body = await request.json();

    // Check if variant exists and belongs to product
    const { data: existingVariant, error: checkError } = await supabase
      .from('product_variants')
      .select('id, variant_type')
      .eq('id', variantId)
      .eq('product_id', id)
      .maybeSingle();

    if (checkError || !existingVariant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.type !== undefined) updateData.variant_type = body.type;
    if (body.name !== undefined) updateData.variant_name = body.name;
    if (body.value !== undefined) updateData.variant_value = body.value;
    if (body.priceAdjustment !== undefined) updateData.price_adjustment = parseFloat(body.priceAdjustment);
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
    if (body.sku !== undefined) updateData.sku = body.sku || null;
    if (body.displayOrder !== undefined) updateData.display_order = parseInt(body.displayOrder);

    // Handle isDefault
    if (body.isDefault !== undefined) {
      updateData.is_default = body.isDefault;
      
      // If setting as default, unset other defaults of same type
      if (body.isDefault) {
        await supabase
          .from('product_variants')
          .update({ is_default: false })
          .eq('product_id', id)
          .eq('variant_type', body.type || existingVariant.variant_type)
          .neq('id', variantId);
      }
    }

    // Update variant
    const { data: variant, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', variantId)
      .select()
      .single();

    if (error) {
      console.error('Update variant error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update variant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: variant.id,
        productId: variant.product_id,
        type: variant.variant_type,
        name: variant.variant_name,
        value: variant.variant_value,
        priceAdjustment: parseFloat(variant.price_adjustment),
        stock: variant.stock,
        sku: variant.sku,
        isDefault: variant.is_default,
        displayOrder: variant.display_order,
      },
    });

  } catch (error) {
    console.error('Update variant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/products/[id]/variants/[variantId]
 * Delete variant (Admin only)
 */
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id, variantId } = await params;

    // Check if variant exists and belongs to product
    const { data: variant, error: checkError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('id', variantId)
      .eq('product_id', id)
      .maybeSingle();

    if (checkError || !variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Delete variant
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) {
      console.error('Delete variant error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete variant' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    });

  } catch (error) {
    console.error('Delete variant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


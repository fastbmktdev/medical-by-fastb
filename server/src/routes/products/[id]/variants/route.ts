/**
 * Product Variants API Endpoint
 * 
 * GET, POST, PUT, DELETE /api/products/[id]/variants - Manage product variants (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * GET /api/products/[id]/variants
 * Get all variants for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { id } = await params;

    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('display_order')
      .order('variant_type');

    if (error) {
      console.error('Get variants error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch variants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: variants?.map(v => ({
        id: v.id,
        productId: v.product_id,
        type: v.variant_type,
        name: v.variant_name,
        value: v.variant_value,
        priceAdjustment: parseFloat(v.price_adjustment),
        stock: v.stock,
        sku: v.sku,
        isDefault: v.is_default,
        displayOrder: v.display_order,
      })) || [],
    });

  } catch (error) {
    console.error('Get variants error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/variants
 * Create new variant for a product (Admin only)
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json() as {
      type?: string;
      name?: string;
      value?: string;
      priceAdjustment?: number;
      stock?: number;
      sku?: string;
      isDefault?: boolean;
      displayOrder?: number;
    };

    // Validate required fields
    const { type, name, value, priceAdjustment = 0, stock = 0, sku, isDefault = false } = body;
    
    if (!type || !name || !value) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, name, value' },
        { status: 400 }
      );
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults of same type
    if (isDefault) {
      await supabase
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', id)
        .eq('variant_type', type);
    }

    // Create variant
    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: id,
        variant_type: type,
        variant_name: name,
        variant_value: value,
        price_adjustment: priceAdjustment || 0,
        stock: stock || 0,
        sku: sku || null,
        is_default: isDefault,
        display_order: body.displayOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create variant error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create variant' },
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
    }, { status: 201 });

  } catch (error) {
    console.error('Create variant error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
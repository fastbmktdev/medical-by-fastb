/**
 * Product Inventory API Endpoint
 * 
 * PUT /api/products/[id]/inventory - Update product stock (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * PUT /api/products/[id]/inventory
 * Update product stock/inventory (Admin only)
 * Body: { stock: number, action?: 'set' | 'add' | 'subtract' }
 */
export const PUT = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json() as {
      stock?: string | number;
      action?: 'set' | 'add' | 'subtract';
    };

    // Validate required fields
    if (body.stock === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: stock' },
        { status: 400 }
      );
    }

    // Check if product exists
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate new stock based on action
    const action = body.action || 'set'; // 'set', 'add', 'subtract'
    let newStock: number;
    const stockValue = typeof body.stock === 'number' ? body.stock : parseInt(String(body.stock));

    switch (action) {
      case 'add':
        newStock = (product.stock || 0) + stockValue;
        break;
      case 'subtract':
        newStock = Math.max(0, (product.stock || 0) - stockValue);
        break;
      case 'set':
      default:
        newStock = stockValue;
        break;
    }

    // Ensure stock is not negative
    if (newStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock cannot be negative' },
        { status: 400 }
      );
    }

    // Update stock
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        stock: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, stock, updated_at')
      .single();

    if (error) {
      console.error('Update inventory error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedProduct.id,
        stock: updatedProduct.stock,
        previousStock: product.stock,
        action,
        updatedAt: updatedProduct.updated_at,
      },
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


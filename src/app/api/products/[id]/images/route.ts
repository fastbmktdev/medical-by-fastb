/**
 * Product Images API Endpoint
 * 
 * GET, POST, DELETE /api/products/[id]/images - Manage product images (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * GET /api/products/[id]/images
 * Get all images for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: images, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('display_order')
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Get images error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: images?.map(img => ({
        id: img.id,
        productId: img.product_id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        isPrimary: img.is_primary,
        displayOrder: img.display_order,
      })) || [],
    });

  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/images
 * Add images to a product (Admin only)
 * Body: { images: Array<{ url: string, altText?: string, isPrimary?: boolean, displayOrder?: number }> }
 */
export const POST = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    const { images } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: images (array)' },
        { status: 400 }
      );
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name_english')
      .eq('id', id)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // If setting any as primary, unset other primaries
    const hasPrimary = images.some((img: any) => img.isPrimary);
    if (hasPrimary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id);
    }

    // Prepare image records
    const imageRecords = images.map((img: any, index: number) => ({
      product_id: id,
      image_url: img.url,
      alt_text: img.altText || `${product.name_english || 'Product'} - Image ${index + 1}`,
      is_primary: img.isPrimary || false,
      display_order: img.displayOrder !== undefined ? img.displayOrder : index,
    }));

    // Insert images
    const { data: insertedImages, error } = await supabase
      .from('product_images')
      .insert(imageRecords)
      .select();

    if (error) {
      console.error('Create images error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to add images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: insertedImages?.map(img => ({
        id: img.id,
        productId: img.product_id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        isPrimary: img.is_primary,
        displayOrder: img.display_order,
      })) || [],
    }, { status: 201 });

  } catch (error) {
    console.error('Create images error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
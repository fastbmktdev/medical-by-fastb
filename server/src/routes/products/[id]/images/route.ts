/**
 * Product Images API Endpoint
 * 
 * GET, POST, DELETE /api/products/[id]/images - Manage product images (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

interface ProductImageInput {
  url: string;
  altText?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

/**
 * GET /api/products/[id]/images
 * Get all images for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
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
    const supabase = await createServerClient();
    const { id } = await params;
    const body = await request.json() as {
      images?: Array<{ url: string; alt?: string; is_primary?: boolean }>;
    };

    // Validate required fields
    const { images } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: images (array)' },
        { status: 400 }
      );
    }

    const imageInputs: ProductImageInput[] = [];

    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      if (!image || typeof image !== 'object') {
        return NextResponse.json(
          { success: false, error: `Invalid image at index ${index}` },
          { status: 400 }
        );
      }

      const record = image as Record<string, unknown>;
      const urlValue = record.url;
      if (typeof urlValue !== 'string' || urlValue.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: `Invalid image URL at index ${index}` },
          { status: 400 }
        );
      }

      const sanitized: ProductImageInput = {
        url: urlValue,
      };

      const altTextValue = record.altText;
      if (typeof altTextValue === 'string') {
        sanitized.altText = altTextValue;
      }

      const isPrimaryValue = record.isPrimary;
      if (typeof isPrimaryValue === 'boolean') {
        sanitized.isPrimary = isPrimaryValue;
      } else if (isPrimaryValue !== undefined) {
        sanitized.isPrimary = Boolean(isPrimaryValue);
      }

      const displayOrderValue = record.displayOrder;
      if (typeof displayOrderValue === 'number') {
        sanitized.displayOrder = displayOrderValue;
      } else if (typeof displayOrderValue === 'string') {
        const parsed = Number.parseInt(displayOrderValue, 10);
        if (Number.isFinite(parsed)) {
          sanitized.displayOrder = parsed;
        }
      }

      imageInputs.push(sanitized);
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
    const hasPrimary = imageInputs.some((img) => img.isPrimary);
    if (hasPrimary) {
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id);
    }

    // Prepare image records
    const imageRecords = imageInputs.map((img, index) => ({
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
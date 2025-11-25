/**
 * Product API Endpoint
 * 
 * GET /api/products/[id] - Get single product
 * PUT /api/products/[id] - Update product (Admin only)
 * DELETE /api/products/[id] - Delete product (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getUserAndAdminStatus } from '@shared/lib/api/server-route-utils';

/**
 * GET /api/products/[id]
 * Get single product by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is admin and get product in parallel
    const { isAdmin } = await getUserAndAdminStatus(supabase);

    // Build product query (optimized - only select needed columns)
    let query = supabase
      .from('products')
      .select(`
        id,
        slug,
        name_thai,
        name_english,
        description,
        price,
        stock,
        category_id,
        sku,
        weight_kg,
        dimensions,
        is_active,
        is_featured,
        views_count,
        sales_count,
        created_at,
        updated_at,
        product_categories (
          id,
          name_thai,
          name_english,
          slug
        )
      `)
      .eq('id', id);

    // If not admin, only show active products
    if (!isAdmin) {
      query = query.eq('is_active', true);
    }

    // Execute product query and related data queries in parallel
    const [productResult, productImagesResult, productVariantsResult] = await Promise.all([
      query.maybeSingle(),
      supabase
        .from('product_images')
        .select('image_url, alt_text, is_primary, display_order')
        .eq('product_id', id)
        .order('display_order')
        .order('is_primary', { ascending: false }),
      supabase
        .from('product_variants')
        .select('id, product_id, variant_type, variant_name, variant_value, price_adjustment, stock, is_default, display_order')
        .eq('product_id', id)
        .order('display_order'),
    ]);

    const { data: product, error } = productResult;
    const { data: productImages } = productImagesResult;
    const { data: productVariants } = productVariantsResult;

    if (error) {
      console.error('Get product error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch product' },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Increment views count (fire and forget - don't wait for completion)
    void (async () => {
      try {
        await supabase
          .from('products')
          .update({ views_count: (product.views_count || 0) + 1 })
          .eq('id', id);
      } catch (err: unknown) {
        console.warn('Failed to increment views count:', err);
      }
    })();

    return NextResponse.json({
      success: true,
      data: {
        id: product.id || "",
        slug: product.slug || "",
        nameThai: product.name_thai || "",
        nameEnglish: product.name_english || "",
        description: product.description || "",
        price: product.price ? parseFloat(product.price) || 0 : 0,
        stock: product.stock ?? 0,
        category: (product.product_categories && 
          !Array.isArray(product.product_categories) && 
          typeof product.product_categories === 'object' &&
          product.product_categories !== null &&
          'id' in product.product_categories) ? {
          id: String((product.product_categories as { id?: unknown }).id || ""),
          nameThai: String((product.product_categories as { name_thai?: unknown }).name_thai || ""),
          nameEnglish: String((product.product_categories as { name_english?: unknown }).name_english || ""),
          slug: String((product.product_categories as { slug?: unknown }).slug || ""),
        } : null,
        sku: product.sku || "",
        weightKg: product.weight_kg ? parseFloat(product.weight_kg) || null : null,
        dimensions: product.dimensions || "",
        isActive: product.is_active ?? true,
        isFeatured: product.is_featured ?? false,
        viewsCount: (product.views_count || 0) + 1,
        salesCount: product.sales_count ?? 0,
        image: productImages?.find(img => img.is_primary)?.image_url || productImages?.[0]?.image_url || null,
        images: productImages?.map(img => img.image_url) || [],
        variants: productVariants?.map(v => ({
          id: v.id || "",
          type: v.variant_type || "",
          name: v.variant_name || "",
          value: v.variant_value || "",
          priceAdjustment: v.price_adjustment ? parseFloat(v.price_adjustment) || 0 : 0,
          stock: v.stock ?? 0,
          isDefault: v.is_default ?? false,
        })) || [],
        createdAt: product.created_at || "",
        updatedAt: product.updated_at || "",
      },
    });

  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/products/[id]
 * Update product (Admin only)
 */
export const PUT = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, name_english, slug')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.nameThai !== undefined) updateData.name_thai = String(body.nameThai);
    if (body.nameEnglish !== undefined) updateData.name_english = String(body.nameEnglish);
    if (body.description !== undefined) updateData.description = String(body.description);
    if (body.price !== undefined) updateData.price = parseFloat(String(body.price));
    if (body.stock !== undefined) updateData.stock = parseInt(String(body.stock), 10);
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId ? String(body.categoryId) : null;
    if (body.sku !== undefined) updateData.sku = body.sku ? String(body.sku) : null;
    if (body.weightKg !== undefined) updateData.weight_kg = body.weightKg ? parseFloat(String(body.weightKg)) : null;
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions ? String(body.dimensions) : null;
    if (body.isActive !== undefined) updateData.is_active = Boolean(body.isActive);
    if (body.isFeatured !== undefined) updateData.is_featured = Boolean(body.isFeatured);

    // Update slug if name_english changed
    if (body.nameEnglish !== undefined && String(body.nameEnglish) !== existingProduct.name_english) {
      const nameEnglishStr = String(body.nameEnglish);
      const slug = body.slug ? String(body.slug) : nameEnglishStr.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists (excluding current product)
      const { data: slugExists } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle();

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Product with this slug already exists' },
          { status: 400 }
        );
      }

      updateData.slug = slug;
    }

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update product error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Update images if provided
    if (body.images && Array.isArray(body.images)) {
      // Delete existing images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      // Insert new images
      if (body.images.length > 0) {
        const imageRecords = body.images.map((url: string, index: number) => ({
          product_id: id,
          image_url: url,
          alt_text: `${body.nameEnglish || product.name_english} - Image ${index + 1}`,
          display_order: index,
          is_primary: index === 0,
        }));

        await supabase
          .from('product_images')
          .insert(imageRecords);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id || "",
        slug: product.slug || "",
        nameThai: product.name_thai || "",
        nameEnglish: product.name_english || "",
        description: product.description || "",
        price: product.price ? parseFloat(product.price) || 0 : 0,
        stock: product.stock ?? 0,
        categoryId: product.category_id || null,
        sku: product.sku || "",
        weightKg: product.weight_kg ? parseFloat(product.weight_kg) || null : null,
        dimensions: product.dimensions || "",
        isActive: product.is_active ?? true,
        isFeatured: product.is_featured,
      },
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/products/[id]
 * Delete product (Admin only)
 */
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if product exists
    const { data: product, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete product (cascade will delete images and variants)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete product error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


/**
 * Product Category API Endpoint
 * 
 * GET, PUT, DELETE /api/product-categories/[id] - Manage single category (Admin only for PUT/DELETE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * GET /api/product-categories/[id]
 * Get single category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: category, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Get category error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch category' },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        nameThai: category.name_thai,
        nameEnglish: category.name_english,
        slug: category.slug,
        description: category.description,
        image: category.image,
        displayOrder: category.display_order,
        isActive: category.is_active,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      },
    });

  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/product-categories/[id]
 * Update category (Admin only)
 */
export const PUT = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // Check if category exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('product_categories')
      .select('id, name_english, slug')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.nameThai !== undefined) updateData.name_thai = body.nameThai;
    if (body.nameEnglish !== undefined) updateData.name_english = body.nameEnglish;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.image !== undefined) updateData.image = body.image || null;
    if (body.displayOrder !== undefined) updateData.display_order = parseInt(body.displayOrder);
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    // Update slug if name_english changed
    if (body.nameEnglish !== undefined && body.nameEnglish !== existingCategory.name_english) {
      const slug = body.slug || body.nameEnglish.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists (excluding current category)
      const { data: slugExists } = await supabase
        .from('product_categories')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle();

      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Category with this slug already exists' },
          { status: 400 }
        );
      }

      updateData.slug = slug;
    }

    // Update category
    const { data: category, error } = await supabase
      .from('product_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update category error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: category.id,
        nameThai: category.name_thai,
        nameEnglish: category.name_english,
        slug: category.slug,
        description: category.description,
        image: category.image,
        displayOrder: category.display_order,
        isActive: category.is_active,
      },
    });

  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/product-categories/[id]
 * Delete category (Admin only)
 */
export const DELETE = withAdminAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if category exists
    const { data: category, error: checkError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError || !category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category is used by products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (productsError) {
      console.error('Check products error:', productsError);
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category that is used by products' },
        { status: 400 }
      );
    }

    // Delete category
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete category error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete category' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


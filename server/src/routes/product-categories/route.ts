/**
 * Product Categories API Endpoint
 * 
 * GET, POST /api/product-categories - Manage product categories (Admin only for POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * GET /api/product-categories
 * Get all product categories
 * Query params:
 * - active: true/false (default: true for public)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');

    let query = supabase
      .from('product_categories')
      .select('*')
      .order('display_order')
      .order('name_english');

    if (activeParam === 'true') {
      query = query.eq('is_active', true);
    } else if (activeParam === 'false') {
      query = query.eq('is_active', false);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('Get categories error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: categories?.map(cat => ({
        id: cat.id,
        nameThai: cat.name_thai,
        nameEnglish: cat.name_english,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        displayOrder: cat.display_order,
        isActive: cat.is_active,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      })) || [],
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/product-categories
 * Create new category (Admin only)
 */
export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const body = await request.json() as {
      nameThai?: string;
      nameEnglish?: string;
      slug?: string;
      description?: string;
      image?: string;
      displayOrder?: number;
      isActive?: boolean;
    };

    // Validate required fields
    const { nameThai, nameEnglish } = body;
    if (!nameThai || !nameEnglish) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: nameThai, nameEnglish' },
        { status: 400 }
      );
    }

    // Generate slug from name_english
    const slug = body.slug || nameEnglish.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from('product_categories')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    // Create category
    const { data: category, error } = await supabase
      .from('product_categories')
      .insert({
        slug,
        name_thai: nameThai,
        name_english: nameEnglish,
        description: body.description || null,
        image: body.image || null,
        display_order: body.displayOrder || 0,
        is_active: body.isActive !== undefined ? body.isActive : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create category error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create category' },
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
    }, { status: 201 });

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


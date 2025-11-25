/**
 * Shipping Methods API Endpoint
 * 
 * GET, POST /api/shipping/methods - Manage shipping methods (Admin only for POST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * GET /api/shipping/methods
 * Get all shipping methods
 * Query params:
 * - active: true/false (default: true for public)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get('active');

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const isAdmin = !authError && user ? await checkIsAdmin(supabase, user.id) : false;

    let query = supabase
      .from('shipping_methods')
      .select('*')
      .order('display_order')
      .order('name_english');

    // If not admin, only show active methods
    if (!isAdmin && activeParam !== 'false') {
      query = query.eq('is_active', true);
    } else if (activeParam === 'true') {
      query = query.eq('is_active', true);
    } else if (activeParam === 'false') {
      query = query.eq('is_active', false);
    }

    const { data: methods, error } = await query;

    if (error) {
      console.error('Get shipping methods error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch shipping methods' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: methods?.map(m => ({
        id: m.id || "",
        nameThai: m.name_thai || "",
        nameEnglish: m.name_english || "",
        description: m.description || "",
        basePrice: m.base_price ? parseFloat(m.base_price) || 0 : 0,
        pricePerKg: m.price_per_kg ? parseFloat(m.price_per_kg) || 0 : 0,
        estimatedDaysMin: m.estimated_days_min ?? 0,
        estimatedDaysMax: m.estimated_days_max ?? 0,
        isActive: m.is_active ?? true,
        displayOrder: m.display_order ?? 0,
        createdAt: m.created_at || "",
        updatedAt: m.updated_at || "",
      })) || [],
    });

  } catch (error) {
    console.error('Get shipping methods error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkIsAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

/**
 * POST /api/shipping/methods
 * Create new shipping method (Admin only)
 */
export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    const { nameThai, nameEnglish, basePrice } = body;
    if (!nameThai || !nameEnglish || basePrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: nameThai, nameEnglish, basePrice' },
        { status: 400 }
      );
    }

    // Create shipping method
    const { data: method, error } = await supabase
      .from('shipping_methods')
      .insert({
        name_thai: nameThai,
        name_english: nameEnglish,
        description: body.description || null,
        base_price: parseFloat(basePrice),
        price_per_kg: body.pricePerKg ? parseFloat(body.pricePerKg) : 0,
        estimated_days_min: body.estimatedDaysMin || 1,
        estimated_days_max: body.estimatedDaysMax || 7,
        is_active: body.isActive !== undefined ? body.isActive : true,
        display_order: body.displayOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create shipping method error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create shipping method' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: method.id,
        nameThai: method.name_thai,
        nameEnglish: method.name_english,
        description: method.description,
        basePrice: parseFloat(method.base_price),
        pricePerKg: parseFloat(method.price_per_kg || 0),
        estimatedDaysMin: method.estimated_days_min,
        estimatedDaysMax: method.estimated_days_max,
        isActive: method.is_active,
        displayOrder: method.display_order,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create shipping method error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});


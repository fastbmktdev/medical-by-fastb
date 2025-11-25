import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { clearCommissionRatesCache } from '@shared/lib/constants/affiliate';

/**
 * GET /api/admin/affiliate/commission-rates
 * Get all commission rates (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: rates, error } = await supabase
      .from('affiliate_commission_rates')
      .select('*')
      .order('conversion_type', { ascending: true });

    if (error) {
      console.error('Error fetching commission rates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch commission rates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ rates: rates || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/affiliate/commission-rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/affiliate/commission-rates
 * Create a new commission rate (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { conversion_type, commission_rate, description, is_active } = body;

    if (!conversion_type || commission_rate === undefined) {
      return NextResponse.json(
        { error: 'conversion_type and commission_rate are required' },
        { status: 400 }
      );
    }

    if (commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json(
        { error: 'commission_rate must be between 0 and 100' },
        { status: 400 }
      );
    }

    const { data: rate, error } = await supabase
      .from('affiliate_commission_rates')
      .insert({
        conversion_type,
        commission_rate,
        description: description || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating commission rate:', error);
      return NextResponse.json(
        { error: 'Failed to create commission rate' },
        { status: 500 }
      );
    }

    // Clear cache so new rate is used immediately
    clearCommissionRatesCache();

    return NextResponse.json({
      success: true,
      rate,
      message: 'Commission rate created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/affiliate/commission-rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/affiliate/commission-rates
 * Update commission rates (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, conversion_type, commission_rate, description, is_active } = body;

    if (!id && !conversion_type) {
      return NextResponse.json(
        { error: 'id or conversion_type is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, number | string | boolean | null | undefined> = {};
    if (commission_rate !== undefined) {
      if (commission_rate < 0 || commission_rate > 100) {
        return NextResponse.json(
          { error: 'commission_rate must be between 0 and 100' },
          { status: 400 }
        );
      }
      updates.commission_rate = commission_rate;
    }
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    let query = supabase
      .from('affiliate_commission_rates')
      .update(updates);

    if (id) {
      query = query.eq('id', id);
    } else if (conversion_type) {
      query = query.eq('conversion_type', conversion_type);
    }

    const { data: rate, error } = await query.select().single();

    if (error) {
      console.error('Error updating commission rate:', error);
      return NextResponse.json(
        { error: 'Failed to update commission rate' },
        { status: 500 }
      );
    }

    // Clear cache so updated rate is used immediately
    clearCommissionRatesCache();

    return NextResponse.json({
      success: true,
      rate,
      message: 'Commission rate updated successfully',
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/affiliate/commission-rates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


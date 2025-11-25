/**
 * Active Promotions API
 * GET /api/promotions/active?hospital_id=xxx - Get active promotions for a hospital
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get('hospital_id');

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'hospital_id is required' },
        { status: 400 }
      );
    }

    // Verify hospital exists and is approved
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, hospital_name, status')
      .eq('id', hospitalId)
      .eq('status', 'approved')
      .maybeSingle();

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found or not approved' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Fetch active promotions for this hospital
    // Promotions must be:
    // - is_active = true
    // - Have discount_type set (not null)
    // - Within date range (if dates are set)
    // - Not exceeded max_uses (if max_uses is set)
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .not('discount_type', 'is', null)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active promotions:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch promotions' },
        { status: 500 }
      );
    }

    // Filter out promotions that have exceeded max_uses
    const validPromotions = (promotions || []).filter((promo) => {
      if (promo.max_uses !== null && promo.current_uses !== null) {
        return promo.current_uses < promo.max_uses;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: validPromotions,
      count: validPromotions.length,
    });

  } catch (error) {
    console.error('Get active promotions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


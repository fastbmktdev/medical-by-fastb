import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import {
  getCommissionRate,
  calculateCommissionAmount,
  type ConversionType,
} from '@shared/lib/constants/affiliate';

/**
 * GET /api/affiliate/conversions
 * Get affiliate conversions for the authenticated user
 * Optional endpoint - GET /api/affiliate already provides this functionality
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const conversionType = searchParams.get('type') as ConversionType | null;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (conversionType) {
      query = query.eq('conversion_type', conversionType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: conversions, error: conversionsError } = await query;

    if (conversionsError) {
      console.error('Error fetching affiliate conversions:', conversionsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversions || [],
      count: conversions?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/affiliate/conversions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/affiliate/conversions
 * Create a new affiliate conversion record
 * Used in appointment/payment flows to track conversions
 * 
 * Body:
 * {
 *   affiliate_user_id: string (UUID) - The affiliate user who should receive commission
 *   referred_user_id: string (UUID) - The user who made the conversion
 *   conversion_type: 'appointment' | 'product_purchase' | 'subscription'
 *   conversion_value: number - The monetary value of the conversion
 *   reference_id: string (UUID) - ID of the appointment, order, ticket, etc.
 *   reference_type: 'appointment' | 'order' | 'ticket_booking' | 'subscription'
 *   affiliate_code?: string - The referral code used
 *   referral_source?: string - 'direct' | 'email' | 'social' | etc.
 *   metadata?: object - Additional conversion data
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      affiliate_user_id?: string;
      referred_user_id?: string;
      conversion_type?: string;
      conversion_value?: string | number;
      reference_id?: string;
      reference_type?: string;
      affiliate_code?: string;
      referral_source?: string;
      metadata?: Record<string, unknown>;
    };
    const {
      affiliate_user_id,
      referred_user_id,
      conversion_type,
      conversion_value,
      reference_id,
      reference_type,
      affiliate_code,
      referral_source = 'direct',
      metadata = {},
    } = body;

    // Validation
    if (!affiliate_user_id || !referred_user_id || !conversion_type) {
      return NextResponse.json(
        { error: 'Missing required fields: affiliate_user_id, referred_user_id, conversion_type' },
        { status: 400 }
      );
    }

    // Validate conversion_type
    const validConversionTypes: ConversionType[] = [
      'appointment',
      'product_purchase',
      'subscription',
    ];

    if (!conversion_type || !validConversionTypes.includes(conversion_type as ConversionType)) {
      return NextResponse.json(
        { error: `Invalid conversion_type. Must be one of: ${validConversionTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate conversion_value
    const value = parseFloat(String(conversion_value || '0'));
    if (isNaN(value) || value < 0) {
      return NextResponse.json(
        { error: 'conversion_value must be a non-negative number' },
        { status: 400 }
      );
    }

    // Check if conversion already exists (prevent duplicates)
    if (reference_id && reference_type) {
      const { data: existingConversion } = await supabase
        .from('affiliate_conversions')
        .select('id')
        .eq('affiliate_user_id', affiliate_user_id)
        .eq('referred_user_id', referred_user_id)
        .eq('conversion_type', conversion_type)
        .eq('reference_id', reference_id)
        .eq('reference_type', reference_type)
        .maybeSingle();

      if (existingConversion) {
        return NextResponse.json({
          success: true,
          message: 'Conversion already exists',
          conversionId: existingConversion.id,
          existing: true,
        });
      }
    }

    // Calculate commission
    const commissionRate = await getCommissionRate(conversion_type as ConversionType);
    const commissionAmount = calculateCommissionAmount(value, commissionRate);

    // Create conversion record
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id,
        referred_user_id,
        conversion_type,
        conversion_value: value,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending', // Will be updated to 'confirmed' or 'paid' when payment succeeds
        reference_id: reference_id || null,
        reference_type: reference_type || null,
        affiliate_code: affiliate_code || null,
        referral_source,
        metadata: {
          ...metadata,
          created_by: user.id,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (conversionError) {
      console.error('Error creating affiliate conversion:', conversionError);
      return NextResponse.json(
        { error: 'Failed to create affiliate conversion', details: conversionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate conversion created successfully',
      data: conversion,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/affiliate/conversions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


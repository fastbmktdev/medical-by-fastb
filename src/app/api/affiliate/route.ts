import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { getCommissionRate, calculateCommissionAmount } from '@/lib/constants/affiliate';

const DEFAULT_STATS = {
  totalReferrals: 0,
  totalEarnings: 0,
  currentMonthReferrals: 0,
  conversionRate: 0,
  referralHistory: []
};

const calculateStats = (conversions: any[], profiles: Record<string, any>) => {
  const now = new Date();
  const totalReferrals = conversions.length;
  // Calculate total earnings from commission_amount (convert to points equivalent or use commission directly)
  const totalEarnings = conversions.reduce((sum, conv) => sum + (conv.commission_amount || 0), 0);
  const currentMonthReferrals = conversions.filter(conv => {
    const convDate = new Date(conv.created_at);
    return convDate.getMonth() === now.getMonth() && convDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate conversion rate: confirmed + paid conversions / total conversions
  const confirmedConversions = conversions.filter(conv => 
    conv.status === 'confirmed' || conv.status === 'paid'
  ).length;
  const conversionRate = totalReferrals > 0 
    ? Math.round((confirmedConversions / totalReferrals) * 100) 
    : 0;

  return {
    totalReferrals,
    totalEarnings,
    currentMonthReferrals,
    conversionRate,
    referralHistory: conversions.map(conv => {
      const profile = conv.referred_user_id ? profiles[conv.referred_user_id] : null;
      const email = profile?.email || (conv.metadata as any)?.email || 'Unknown';
      
      return {
        id: conv.id,
        referred_user_email: email,
        status: conv.status === 'paid' ? 'rewarded' as const : 
                conv.status === 'confirmed' ? 'completed' as const : 
                'pending' as const,
        points_earned: conv.commission_amount || 0,
        created_at: conv.created_at,
        conversion_type: conv.conversion_type,
        conversion_value: conv.conversion_value,
        commission_amount: conv.commission_amount,
        source: conv.referral_source || 'Direct'
      };
    })
  };
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query affiliate_conversions table instead of points_history
    const { data: conversions, error: conversionsError } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false });

    if (conversionsError) {
      console.error('Error fetching affiliate conversions:', conversionsError);
      return NextResponse.json({ error: 'Failed to fetch affiliate data' }, { status: 500 });
    }

    // Get user profiles for referred users to get emails
    const referredUserIds = conversions
      ?.filter(conv => conv.referred_user_id)
      .map(conv => conv.referred_user_id) || [];
    
    const profiles: Record<string, any> = {};
    
    if (referredUserIds.length > 0) {
      // Get profiles for referred users
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', referredUserIds);

      if (profileData) {
        // Get user emails from auth (we'll need to use admin API or store in metadata)
        // For now, use username or full_name as fallback
        profileData.forEach(profile => {
          profiles[profile.user_id] = {
            email: profile.username || profile.full_name || 'Unknown',
            username: profile.username,
            full_name: profile.full_name
          };
        });
      }
    }

    return NextResponse.json(
      conversions && conversions.length > 0 
        ? calculateStats(conversions, profiles) 
        : DEFAULT_STATS
    );
  } catch (error) {
    console.error('Error in GET /api/affiliate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Legacy: Keep referral points for gamification (optional)
const REFERRAL_POINTS = 200;

const updateUserPoints = async (supabase: any, userId: string, points: number) => {
  const { data: currentPoints } = await supabase
    .from('user_points')
    .select('total_points')
    .eq('user_id', userId)
    .single();

  if (currentPoints) {
    await supabase
      .from('user_points')
      .update({
        total_points: currentPoints.total_points + points,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: points,
        current_level: 1,
        points_to_next_level: 100
      });
  }
};

/**
 * POST /api/affiliate
 * Creates an affiliate conversion record when a user signs up with a referral code
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referredUserId, referralCode } = await request.json();

    if (!referredUserId || !referralCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate referral code format
    const expectedCode = `MT${user.id.slice(-8).toUpperCase()}`;
    if (referralCode !== expectedCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    // Check if conversion already exists (prevent duplicates)
    const { data: existingConversion } = await supabase
      .from('affiliate_conversions')
      .select('id')
      .eq('affiliate_user_id', user.id)
      .eq('referred_user_id', referredUserId)
      .eq('conversion_type', 'signup')
      .maybeSingle();

    if (existingConversion) {
      return NextResponse.json({
        success: true,
        message: 'Conversion already recorded',
        conversionId: existingConversion.id
      });
    }

    // Calculate commission for signup
    const conversionType = 'signup';
    const conversionValue = 0; // Signups typically have no monetary value
    const commissionRate = getCommissionRate(conversionType);
    const commissionAmount = calculateCommissionAmount(conversionValue, commissionRate);

    // Create affiliate conversion record
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: user.id,
        referred_user_id: referredUserId,
        conversion_type: conversionType,
        conversion_value: conversionValue,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'confirmed', // Signup is immediately confirmed
        affiliate_code: referralCode,
        referral_source: 'direct',
        metadata: {
          signup_date: new Date().toISOString(),
          referral_code: referralCode
        },
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversionError) {
      console.error('Error creating affiliate conversion:', conversionError);
      return NextResponse.json(
        { error: 'Failed to create affiliate conversion' },
        { status: 500 }
      );
    }

    // Optional: Still award points for gamification (separate from affiliate system)
    try {
      const { error: pointsError } = await supabase
        .from('points_history')
        .insert({
          user_id: user.id,
          points: REFERRAL_POINTS,
          action_type: 'referral',
          action_description: `แนะนำเพื่อนเข้าร่วมแพลตฟอร์ม`,
          reference_id: referredUserId,
          reference_type: 'referral'
        });

      if (!pointsError) {
        await updateUserPoints(supabase, user.id, REFERRAL_POINTS);
      }
      // Don't fail if points update fails - affiliate conversion is more important
    } catch (pointsErr) {
      console.warn('Failed to award referral points (non-critical):', pointsErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate conversion recorded successfully',
      conversion: {
        id: conversion.id,
        conversionType: conversionType,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        status: conversion.status
      },
      pointsAwarded: REFERRAL_POINTS // For gamification
    });
  } catch (error) {
    console.error('Error in POST /api/affiliate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

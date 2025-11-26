import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@shared/lib/database/supabase/server';
import { getCommissionRate, calculateCommissionAmount } from '@shared/lib/constants/affiliate';
import { awardPoints } from '@shared/services/gamification.service';
import { isValidReferralCodeFormat } from '@shared/lib/utils/affiliate';
import { logAuditEvent } from '@shared/lib/utils';

const DEFAULT_STATS = {
  totalReferrals: 0,
  totalEarnings: 0,
  currentMonthReferrals: 0,
  conversionRate: 0,
  referralHistory: []
};

interface Conversion {
  id: string;
  referred_user_id?: string;
  status: string;
  commission_amount: number;
  created_at: string;
  conversion_type: string;
  conversion_value: number;
  referral_source?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface Profile {
  email?: string;
  username?: string;
  full_name?: string;
}

const calculateStats = (conversions: Conversion[], profiles: Record<string, Profile>) => {
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
      const email = profile?.email || (conv.metadata as Record<string, unknown>)?.email as string || 'Unknown';
      
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

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  let currentUser: User | null = null;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    currentUser = user;

    if (authError || !user) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'view',
        resourceType: 'affiliate_conversion',
        description: 'Unauthorized attempt to view affiliate dashboard data',
        severity: 'medium',
        success: false,
        errorMessage: authError?.message || 'Unauthorized',
      });

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

      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'view',
        resourceType: 'affiliate_conversion',
        resourceId: user.id,
        resourceName: user.email ?? user.id,
        description: 'Failed to fetch affiliate dashboard data',
        severity: 'high',
        success: false,
        errorMessage: conversionsError.message,
        metadata: {
          context: 'fetch_conversions',
        },
      });

      return NextResponse.json({ error: 'Failed to fetch affiliate data' }, { status: 500 });
    }

    // Get user profiles for referred users to get emails
    const referredUserIds =
      conversions?.filter((conv) => conv.referred_user_id).map((conv) => conv.referred_user_id) || [];

    const profiles: Record<string, Profile> = {};

    if (referredUserIds.length > 0) {
      // Get profiles for referred users
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', referredUserIds);

      if (profileData) {
        // Get user emails from auth (we'll need to use admin API or store in metadata)
        // For now, use username or full_name as fallback
        profileData.forEach((profile) => {
          profiles[profile.user_id] = {
            email: profile.username || profile.full_name || 'Unknown',
            username: profile.username,
            full_name: profile.full_name,
          };
        });
      }
    }

    const stats =
      conversions && conversions.length > 0 ? calculateStats(conversions, profiles) : DEFAULT_STATS;

    await logAuditEvent({
      supabase,
      request,
      user,
      action: 'view',
      resourceType: 'affiliate_conversion',
      resourceId: user.id,
      resourceName: user.email ?? user.id,
      description: 'Viewed affiliate dashboard data',
      newValues: { stats },
      metadata: {
        totalReferrals: stats.totalReferrals,
        totalEarnings: stats.totalEarnings,
        currentMonthReferrals: stats.currentMonthReferrals,
        conversionRate: stats.conversionRate,
      },
      severity: 'low',
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/affiliate:', error);

    try {
      await logAuditEvent({
        supabase,
        request,
        user: currentUser,
        action: 'view',
        resourceType: 'affiliate_conversion',
        resourceId: currentUser?.id,
        resourceName: currentUser?.email ?? currentUser?.id ?? undefined,
        description: 'Unhandled error while fetching affiliate dashboard data',
        severity: 'critical',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for GET /api/affiliate error:', auditError);
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Referral points for gamification
const REFERRAL_POINTS = 200;

/**
 * POST /api/affiliate
 * Creates an affiliate conversion record when a user signs up with a referral code
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  let currentUser: User | null = null;

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    currentUser = user;

    const requestBody = await request.json() as {
      referralCode?: string;
      referredUserId?: string;
    };
    const rawReferralCode = requestBody?.referralCode?.trim();
    const normalizedReferralCode = rawReferralCode?.toUpperCase();
    const explicitReferredUserId = requestBody?.referredUserId;

    if (!normalizedReferralCode) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        description: 'Attempted to create affiliate conversion without referral code',
        severity: 'medium',
        success: false,
      });

      return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
    }

    if (!isValidReferralCodeFormat(normalizedReferralCode)) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        description: 'Invalid referral code format provided',
        severity: 'medium',
        success: false,
        metadata: {
          referralCode: normalizedReferralCode,
        },
      });

      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    if (authError && !user && !explicitReferredUserId) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        description: 'Unauthorized affiliate conversion attempt (no session)',
        severity: 'medium',
        success: false,
        errorMessage: authError?.message || 'Unauthorized',
        metadata: {
          referralCode: normalizedReferralCode,
        },
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referredUserId = explicitReferredUserId ?? user?.id ?? null;

    if (!referredUserId) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        description: 'Unauthorized attempt to record affiliate conversion',
        severity: 'high',
        success: false,
        metadata: {
          referralCode: normalizedReferralCode,
        },
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referralSuffix = normalizedReferralCode.slice(-8).toLowerCase();

    const {
      data: referrerProfile,
      error: referrerLookupError,
    } = await supabase
      .from('profiles')
      .select('user_id, full_name, username')
      .ilike('user_id', `%${referralSuffix}`)
      .limit(1)
      .maybeSingle();

    if (referrerLookupError) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        description: 'Failed to resolve referrer for referral code',
        severity: 'high',
        success: false,
        errorMessage: referrerLookupError.message,
        metadata: {
          referralCode: normalizedReferralCode,
          referredUserId,
        },
      });

      console.error('Error looking up referrer profile:', referrerLookupError);
      return NextResponse.json(
        { error: 'Unable to resolve referral code' },
        { status: 500 },
      );
    }

    if (!referrerProfile?.user_id) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        description: 'Referral code not found',
        severity: 'medium',
        success: false,
        metadata: {
          referralCode: normalizedReferralCode,
          referredUserId,
        },
      });

      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 });
    }

    const referrerUserId = referrerProfile.user_id;

    if (referrerUserId === referredUserId) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        resourceId: referrerUserId,
        resourceName: user?.email ?? referrerUserId,
        description: 'Attempted to use own referral code',
        severity: 'medium',
        success: false,
        metadata: {
          referralCode: normalizedReferralCode,
        },
      });

      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 },
      );
    }

    const { data: existingConversion, error: existingConversionError } = await supabase
      .from('affiliate_conversions')
      .select('id')
      .eq('affiliate_user_id', referrerUserId)
      .eq('referred_user_id', referredUserId)
      .eq('conversion_type', 'signup')
      .maybeSingle();

    if (existingConversionError) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        resourceId: referrerUserId,
        resourceName: user?.email ?? referrerUserId,
        description: 'Failed to check for existing affiliate conversion',
        severity: 'high',
        success: false,
        errorMessage: existingConversionError.message,
        metadata: {
          referredUserId,
          referralCode: normalizedReferralCode,
        },
      });

      console.warn('Failed to check existing referral conversion:', existingConversionError);
    }

    if (existingConversion) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        resourceId: existingConversion.id,
        resourceName: user?.email ?? existingConversion.id,
        description: 'Duplicate affiliate conversion prevented',
        severity: 'low',
        metadata: {
          referrerUserId,
          referredUserId,
          referralCode: normalizedReferralCode,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Conversion already recorded',
        conversionId: existingConversion.id,
      });
    }

    const conversionType = 'signup';
    const conversionValue = 0;
    const commissionRate = await getCommissionRate(conversionType);
    const commissionAmount = calculateCommissionAmount(conversionValue, commissionRate);
    const nowIso = new Date().toISOString();

    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: conversionType,
        conversion_value: conversionValue,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'confirmed',
        affiliate_code: normalizedReferralCode,
        referral_source: 'direct',
        metadata: {
          signup_date: nowIso,
          referral_code: normalizedReferralCode,
          referrer_display_name:
            referrerProfile.full_name || referrerProfile.username || null,
        },
        confirmed_at: nowIso,
      })
      .select()
      .single();

    if (conversionError) {
      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        resourceId: referrerUserId,
        resourceName: user?.email ?? referrerUserId,
        description: 'Failed to create affiliate conversion',
        severity: 'high',
        success: false,
        errorMessage: conversionError.message,
        metadata: {
          referredUserId,
          referralCode: normalizedReferralCode,
          commissionAmount,
        },
        newValues: {
          affiliate_user_id: referrerUserId,
          referred_user_id: referredUserId,
          conversion_type: conversionType,
        },
      });

      console.error('Error creating affiliate conversion:', conversionError);
      return NextResponse.json(
        { error: 'Failed to create affiliate conversion' },
        { status: 500 },
      );
    }

    try {
      await awardPoints({
        user_id: referrerUserId,
        points: REFERRAL_POINTS,
        action_type: 'referral',
        action_description: `แนะนำเพื่อนเข้าร่วมแพลตฟอร์ม`,
        reference_id: referredUserId,
        reference_type: 'referral',
      });
    } catch (pointsErr) {
      console.warn('Failed to award referral points (non-critical):', pointsErr);

      await logAuditEvent({
        supabase,
        request,
        user,
        action: 'create',
        resourceType: 'affiliate_conversion',
        resourceId: conversion.id,
        resourceName: referrerProfile.full_name || referrerProfile.username || referrerUserId,
        description: 'Affiliate conversion recorded but points awarding failed',
        severity: 'medium',
        success: false,
        errorMessage: pointsErr instanceof Error ? pointsErr.message : 'Unknown points awarding error',
        metadata: {
          referrerUserId,
          referredUserId,
          referralCode: normalizedReferralCode,
          conversionId: conversion.id,
          pointsAttempted: REFERRAL_POINTS,
        },
      });
    }

    await logAuditEvent({
      supabase,
      request,
      user,
      action: 'create',
      resourceType: 'affiliate_conversion',
      resourceId: conversion.id,
      resourceName: referrerProfile.full_name || referrerProfile.username || referrerUserId,
      description: 'Recorded affiliate conversion',
      newValues: {
        conversion,
      },
      metadata: {
        referrerUserId,
        referredUserId,
        referralCode: normalizedReferralCode,
        commissionAmount,
        pointsAwarded: REFERRAL_POINTS,
      },
      severity: 'medium',
    });

    return NextResponse.json({
      success: true,
      message: 'Affiliate conversion recorded successfully',
      conversion: {
        id: conversion.id,
        conversionType,
        commissionRate,
        commissionAmount,
        status: conversion.status,
      },
      referrer: {
        id: referrerUserId,
        name: referrerProfile.full_name ?? null,
        username: referrerProfile.username ?? null,
      },
      pointsAwarded: REFERRAL_POINTS,
    });
  } catch (error) {
    console.error('Error in POST /api/affiliate:', error);

    try {
      await logAuditEvent({
        supabase,
        request,
        user: currentUser,
        action: 'create',
        resourceType: 'affiliate_conversion',
        resourceId: currentUser?.id,
        resourceName: currentUser?.email ?? currentUser?.id ?? undefined,
        description: 'Unhandled error while recording affiliate conversion',
        severity: 'critical',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (auditError) {
      console.warn('Failed to log audit event for POST /api/affiliate error:', auditError);
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

const DEFAULT_STATS = {
  totalReferrals: 0,
  totalEarnings: 0,
  currentMonthReferrals: 0,
  conversionRate: 0,
  referralHistory: []
};

const calculateStats = (referrals: any[]) => {
  const now = new Date();
  const totalReferrals = referrals.length;
  const totalEarnings = referrals.reduce((sum, ref) => sum + ref.points, 0);
  const currentMonthReferrals = referrals.filter(ref => {
    const refDate = new Date(ref.created_at);
    return refDate.getMonth() === now.getMonth() && refDate.getFullYear() === now.getFullYear();
  }).length;

  return {
    totalReferrals,
    totalEarnings,
    currentMonthReferrals,
    conversionRate: totalReferrals > 0 ? Math.min(Math.round((totalReferrals / 10) * 100), 100) : 0,
    referralHistory: referrals.map(ref => ({
      id: ref.id,
      referred_user_email: ref.action_description || 'Unknown',
      status: 'rewarded' as const,
      points_earned: ref.points,
      created_at: ref.created_at
    }))
  };
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: referrals } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('action_type', 'referral')
      .order('created_at', { ascending: false });

    return NextResponse.json(referrals ? calculateStats(referrals) : DEFAULT_STATS);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const expectedCode = `MT${user.id.slice(-8).toUpperCase()}`;
    if (referralCode !== expectedCode) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

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

    if (pointsError) {
      return NextResponse.json({ error: 'Failed to award referral points' }, { status: 500 });
    }

    await updateUserPoints(supabase, user.id, REFERRAL_POINTS);

    return NextResponse.json({
      success: true,
      message: 'Referral points awarded successfully',
      pointsAwarded: REFERRAL_POINTS
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

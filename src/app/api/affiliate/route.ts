import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get affiliate stats for the user
    const { data: referrals } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('action_type', 'referral')
      .order('created_at', { ascending: false });

    if (!referrals) {
      return NextResponse.json({
        totalReferrals: 0,
        totalEarnings: 0,
        currentMonthReferrals: 0,
        conversionRate: 0,
        referralHistory: []
      });
    }

    // Calculate stats
    const totalReferrals = referrals.length;
    const totalEarnings = referrals.reduce((sum, ref) => sum + ref.points, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthReferrals = referrals.filter(ref => {
      const refDate = new Date(ref.created_at);
      return refDate.getMonth() === currentMonth && refDate.getFullYear() === currentYear;
    }).length;

    const conversionRate = totalReferrals > 0 ? Math.round((totalReferrals / 10) * 100) : 0;

    const referralHistory = referrals.map(ref => ({
      id: ref.id,
      referred_user_email: ref.action_description || 'Unknown',
      status: 'rewarded' as const,
      points_earned: ref.points,
      created_at: ref.created_at
    }));

    return NextResponse.json({
      totalReferrals,
      totalEarnings,
      currentMonthReferrals,
      conversionRate,
      referralHistory
    });

  } catch (error) {
    console.error('Error fetching affiliate data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referredUserId, referralCode } = await request.json();

    if (!referredUserId || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the referral code belongs to the current user
    const expectedCode = `MT${user.id.slice(-8).toUpperCase()}`;
    if (referralCode !== expectedCode) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Award points for successful referral
    const { error: pointsError } = await supabase
      .from('points_history')
      .insert({
        user_id: user.id,
        points: 200,
        action_type: 'referral',
        action_description: `แนะนำเพื่อนเข้าร่วมแพลตฟอร์ม`,
        reference_id: referredUserId,
        reference_type: 'referral'
      });

    if (pointsError) {
      console.error('Error awarding referral points:', pointsError);
      return NextResponse.json(
        { error: 'Failed to award referral points' },
        { status: 500 }
      );
    }

    // Update user's total points
    const { data: currentPoints } = await supabase
      .from('user_points')
      .select('total_points')
      .eq('user_id', user.id)
      .single();

    if (currentPoints) {
      await supabase
        .from('user_points')
        .update({ 
          total_points: currentPoints.total_points + 200,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      // Create new user_points record if it doesn't exist
      await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          total_points: 200,
          current_level: 1,
          points_to_next_level: 100
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Referral points awarded successfully',
      pointsAwarded: 200
    });

  } catch (error) {
    console.error('Error processing referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

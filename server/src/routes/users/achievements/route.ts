import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * Get User Achievements API
 * GET /api/users/achievements
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user badges
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (
          id,
          name,
          description,
          icon_url,
          points_required
        )
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (badgesError) {
      console.error('Get badges error:', badgesError);
      return NextResponse.json(
        { success: false, error: 'Failed to get badges' },
        { status: 500 }
      );
    }

    // Get user points and level
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get all available badges for progress tracking
    const { data: allBadges } = await supabase
      .from('badges')
      .select('*')
      .order('points_required', { ascending: true });

    // Calculate progress for each badge
    const currentPoints = pointsData?.total_points || 0;
    type BadgeRecord = NonNullable<typeof badges>[number];

    const badgesWithProgress = allBadges?.map((badge) => {
      const userBadge = badges?.find((ub: BadgeRecord) => ub.badge_id === badge.id);
      const progress = Math.min((currentPoints / badge.points_required) * 100, 100);

      return {
        ...badge,
        earned: !!userBadge,
        earned_at: userBadge?.earned_at || null,
        progress: progress
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: {
        earned_badges: badges || [],
        all_badges: badgesWithProgress,
        current_points: currentPoints,
        current_level: pointsData?.current_level || 1
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


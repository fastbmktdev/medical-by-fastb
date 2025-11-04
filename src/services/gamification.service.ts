// Gamification Service
// บริการจัดการระบบ Gamification สำหรับ MUAYTHAI Platform

import { createClient } from '@/lib/database/supabase/server';
import type {
  UserPoints,
  PointsHistory,
  Badge,
  UserBadge,
  UserStreak,
  Challenge,
  UserChallenge,
  Leaderboard,
  GamificationStats,
  LeaderboardData,
  BadgeProgress,
  ChallengeProgress,
  AwardPointsRequest,
  UpdateStreakRequest,
  JoinChallengeRequest,
  UpdateChallengeProgressRequest,
  PointsAwardResponse,
  StreakUpdateResponse,
  ChallengeJoinResponse,
  GamificationDashboard,
} from '@/types/gamification.types';

// ============================================
// USER POINTS AND LEVELS
// ============================================

/**
 * Get user's gamification stats
 */
export async function getUserGamificationStats(userId: string): Promise<GamificationStats | null> {
  const supabase = await createClient();

  try {
    // Get user points
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pointsError && pointsError.code !== 'PGRST116') {
      throw new Error(`Failed to get user points: ${pointsError.message}`);
    }

    // Get user badges count
    const { data: userBadges, error: badgesError } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId);

    if (badgesError) {
      throw new Error(`Failed to get user badges: ${badgesError.message}`);
    }

    // Get current streaks
    const { data: streaks, error: streaksError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId);

    if (streaksError) {
      throw new Error(`Failed to get user streaks: ${streaksError.message}`);
    }

    // Get active challenges
    const { data: activeChallenges, error: challengesError } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', userId)
      .eq('is_completed', false);

    if (challengesError) {
      throw new Error(`Failed to get active challenges: ${challengesError.message}`);
    }

    // Get recent activities
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      throw new Error(`Failed to get recent activities: ${activitiesError.message}`);
    }

    return {
      total_points: userPoints?.total_points || 0,
      current_level: userPoints?.current_level || 1,
      points_to_next_level: userPoints?.points_to_next_level || 100,
      badges_earned: userBadges?.length || 0,
      current_streaks: streaks || [],
      active_challenges: activeChallenges || [],
      recent_activities: recentActivities || [],
    };
  } catch (error) {
    return null;
  }
}

/**
 * Award points to user
 */
export async function awardPoints(request: AwardPointsRequest): Promise<PointsAwardResponse | null> {
  const supabase = await createClient();

  try {
    // Get current level before awarding points to detect level changes
    const { data: currentUserPoints } = await supabase
      .from('user_points')
      .select('current_level')
      .eq('user_id', request.user_id)
      .single();
    
    const previousLevel = currentUserPoints?.current_level || 1;

    // Call the database function to award points
    const { data, error } = await supabase.rpc('award_points', {
      target_user_id: request.user_id,
      points_to_award: request.points,
      action_type: request.action_type,
      action_description: request.action_description || null,
      reference_id: request.reference_id || null,
      reference_type: request.reference_type || null,
    });

    if (error) {
      throw new Error(`Failed to award points: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to award points');
    }

    // Get updated user points
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', request.user_id)
      .single();

    if (pointsError) {
      throw new Error(`Failed to get updated user points: ${pointsError.message}`);
    }

    const newLevel = userPoints?.current_level || 1;

    // Check for new badges
    const { data: newBadges, error: badgesError } = await supabase.rpc('check_and_award_badges', {
      target_user_id: request.user_id,
    });

    if (badgesError) {
      // Badge check failed, continue anyway
    }

    // Send notifications for new badges
    if (newBadges && newBadges.length > 0) {
      for (const badge of newBadges) {
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: request.user_id,
              type: 'badge_earned',
              title: 'ได้รับเหรียญใหม่! 🏅',
              message: `ยินดีด้วย! คุณได้รับเหรียญ: ${badge.badge_name}`,
              link_url: '/dashboard/gamification',
              metadata: {
                badge_id: badge.badge_id,
                badge_name: badge.badge_name,
              },
            });
        } catch (notificationError) {
          console.warn('Failed to send badge notification:', notificationError);
        }
      }
    }

    // Send notification for level up
    if (newLevel > previousLevel) {
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            type: 'level_up',
            title: 'เลื่อนระดับ! ⭐',
            message: `ยินดีด้วย! คุณขึ้นไประดับ ${newLevel} แล้ว`,
            link_url: '/dashboard/gamification',
            metadata: {
              previous_level: previousLevel,
              new_level: newLevel,
              total_points: userPoints?.total_points || 0,
            },
          });
      } catch (notificationError) {
        console.warn('Failed to send level up notification:', notificationError);
      }
    }

    return {
      points_awarded: request.points,
      new_total_points: userPoints?.total_points || 0,
      new_level: newLevel,
      badges_earned: newBadges || [],
      message: `ได้รับ ${request.points} คะแนน!`,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get user's points history
 */
export async function getUserPointsHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<PointsHistory[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get points history: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

// ============================================
// BADGES AND ACHIEVEMENTS
// ============================================

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (error) {
      throw new Error(`Failed to get badges: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user badges: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get badge progress for user (optimized with single query)
 */
export async function getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
  const supabase = await createClient();

  try {
    // Get all data in parallel for better performance
    const [badges, userBadges, userPointsData] = await Promise.all([
      getAllBadges(),
      getUserBadges(userId),
      supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single()
    ]);

    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
    const totalPoints = userPointsData.data?.total_points || 0;

    return badges.map(badge => {
      const isEarned = earnedBadgeIds.has(badge.id);
      const earnedAt = userBadges.find(ub => ub.badge_id === badge.id)?.earned_at;
      const progressPercentage = Math.min((totalPoints / badge.points_required) * 100, 100);
      
      let progressDescription = '';
      if (isEarned) {
        progressDescription = 'ได้รับแล้ว';
      } else if (progressPercentage >= 100) {
        progressDescription = 'พร้อมรับแล้ว';
      } else {
        const pointsNeeded = badge.points_required - totalPoints;
        progressDescription = `ต้องการอีก ${pointsNeeded} คะแนน`;
      }

      return {
        badge,
        is_earned: isEarned,
        earned_at: earnedAt,
        progress_percentage: progressPercentage,
        progress_description: progressDescription,
      };
    });
  } catch (error) {
    return [];
  }
}

// ============================================
// STREAKS
// ============================================

/**
 * Update user streak
 */
export async function updateUserStreak(request: UpdateStreakRequest): Promise<StreakUpdateResponse | null> {
  const supabase = await createClient();

  try {
    // Call the database function to update streak
    const { data, error } = await supabase.rpc('update_user_streak', {
      target_user_id: request.user_id,
      streak_type: request.streak_type,
      activity_date: request.activity_date || new Date().toISOString().split('T')[0],
    });

    if (error) {
      throw new Error(`Failed to update streak: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update streak');
    }

    // Get updated streak info
    const { data: streak, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', request.user_id)
      .eq('streak_type', request.streak_type)
      .single();

    if (streakError) {
      throw new Error(`Failed to get updated streak: ${streakError.message}`);
    }

    // Check for streak bonus points
    let streakBonusPoints = 0;
    if (streak?.current_streak > 0) {
      if (streak.current_streak % 7 === 0) {
        streakBonusPoints = 50; // Weekly streak bonus
      } else if (streak.current_streak % 30 === 0) {
        streakBonusPoints = 200; // Monthly streak bonus
      }
    }

    // Award streak bonus if applicable
    if (streakBonusPoints > 0) {
      await awardPoints({
        user_id: request.user_id,
        points: streakBonusPoints,
        action_type: `${request.streak_type}_streak_bonus`,
        action_description: `สตรีค ${request.streak_type} ${streak.current_streak} วัน`,
      });
    }

    return {
      streak_updated: true,
      current_streak: streak?.current_streak || 0,
      longest_streak: streak?.longest_streak || 0,
      streak_bonus_points: streakBonusPoints > 0 ? streakBonusPoints : undefined,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get user streaks
 */
export async function getUserStreaks(userId: string): Promise<UserStreak[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .order('current_streak', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user streaks: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

// ============================================
// CHALLENGES
// ============================================

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get active challenges: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Join a challenge
 */
export async function joinChallenge(request: JoinChallengeRequest): Promise<ChallengeJoinResponse | null> {
  const supabase = await createClient();

  try {
    // Check if user is already participating
    const { data: existingParticipation, error: checkError } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', request.user_id)
      .eq('challenge_id', request.challenge_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing participation: ${checkError.message}`);
    }

    if (existingParticipation) {
      throw new Error('User is already participating in this challenge');
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', request.challenge_id)
      .eq('is_active', true)
      .single();

    if (challengeError || !challenge) {
      throw new Error('Challenge not found or not active');
    }

    // Join the challenge
    const { data: userChallenge, error: joinError } = await supabase
      .from('user_challenges')
      .insert({
        user_id: request.user_id,
        challenge_id: request.challenge_id,
        progress: {},
        is_completed: false,
        points_earned: 0,
      })
      .select()
      .single();

    if (joinError) {
      throw new Error(`Failed to join challenge: ${joinError.message}`);
    }

    return {
      challenge_joined: true,
      challenge,
      user_challenge: userChallenge,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(request: UpdateChallengeProgressRequest): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('user_challenges')
      .update({
        progress: request.progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.user_challenge_id);

    if (error) {
      throw new Error(`Failed to update challenge progress: ${error.message}`);
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user's challenge progress
 */
export async function getUserChallengeProgress(userId: string): Promise<ChallengeProgress[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user challenge progress: ${error.message}`);
    }

    return (data || []).map(uc => {
      const challenge = uc.challenge as Challenge;
      const userChallenge = uc as UserChallenge;
      
      // Calculate progress percentage based on challenge requirements
      let progressPercentage = 0;
      if (challenge.requirements) {
        // This is a simplified calculation - you might want to implement more complex logic
        const totalRequirements = Object.keys(challenge.requirements).length;
        const completedRequirements = Object.keys(userChallenge.progress || {}).length;
        progressPercentage = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
      }

      return {
        challenge,
        user_challenge: userChallenge,
        progress_percentage: progressPercentage,
        is_completed: userChallenge.is_completed,
        time_remaining: challenge.end_date ? 
          new Date(challenge.end_date).toLocaleDateString('th-TH') : undefined,
      };
    });
  } catch (error) {
    return [];
  }
}

// ============================================
// LEADERBOARDS
// ============================================

/**
 * Get leaderboard data
 */
export async function getLeaderboardData(
  leaderboardId: string,
  userId?: string
): Promise<LeaderboardData | null> {
  const supabase = await createClient();

  try {
    // Get leaderboard info
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('id', leaderboardId)
      .eq('is_active', true)
      .single();

    if (leaderboardError || !leaderboard) {
      throw new Error('Leaderboard not found');
    }

    // Get leaderboard entries
    const { data: entries, error: entriesError } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user:profiles(username, full_name, avatar_url)
      `)
      .eq('leaderboard_id', leaderboardId)
      .order('rank', { ascending: true })
      .limit(100);

    if (entriesError) {
      throw new Error(`Failed to get leaderboard entries: ${entriesError.message}`);
    }

    // Find user's rank if userId provided
    let userRank: number | undefined;
    let userScore: number | undefined;
    
    if (userId) {
      const userEntry = entries?.find(entry => entry.user_id === userId);
      if (userEntry) {
        userRank = userEntry.rank;
        userScore = userEntry.score;
      }
    }

    return {
      leaderboard,
      entries: entries || [],
      user_rank: userRank,
      user_score: userScore,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get all leaderboards
 */
export async function getAllLeaderboards(): Promise<Leaderboard[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get leaderboards: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

// ============================================
// GAMIFICATION DASHBOARD
// ============================================

/**
 * Get complete gamification dashboard data (optimized)
 */
export async function getGamificationDashboard(userId: string): Promise<GamificationDashboard | null> {
  try {
    // Get user stats first as it's required
    const userStats = await getUserGamificationStats(userId);
    if (!userStats) {
      return null;
    }

    // Get remaining data in parallel
    const [
      recentBadges,
      activeChallenges,
      leaderboards,
      upcomingEvents,
    ] = await Promise.all([
      getUserBadges(userId).then(badges => badges.slice(0, 5)),
      getUserChallengeProgress(userId).then(challenges => 
        challenges.filter(c => !c.is_completed).slice(0, 3)
      ),
      getAllLeaderboards().then(async (leaderboards) => {
        const topLeaderboards = leaderboards.slice(0, 3);
        const leaderboardData = await Promise.all(
          topLeaderboards.map(lb => getLeaderboardData(lb.id, userId))
        );
        return leaderboardData.filter(Boolean) as LeaderboardData[];
      }),
      getActiveChallenges().then(challenges => challenges.slice(0, 5)),
    ]);

    return {
      user_stats: userStats,
      recent_badges: recentBadges,
      active_challenges: activeChallenges,
      leaderboards: leaderboards,
      upcoming_events: upcomingEvents,
    };
  } catch (error) {
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate level progress percentage
 */
function calculateLevelProgress(userPoints: UserPoints): number {
  return Math.min(
    ((userPoints.total_points - ((userPoints.current_level - 1) ** 2 * 100)) / 
     (userPoints.points_to_next_level - ((userPoints.current_level - 1) ** 2 * 100))) * 100,
    100
  );
}

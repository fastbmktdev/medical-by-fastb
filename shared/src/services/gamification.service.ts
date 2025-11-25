// Gamification Service
// บริการจัดการระบบ Gamification สำหรับ medical Platform

import { 
  getServiceClient, 
  handleQueryError, 
  handleQueryResult,
  ServiceNotFoundError
} from './service-utils';
import { executeParallelQueries } from '@shared/lib/database/query-optimizer';
import type {
  UserPoints,
  PointsHistory,
  Badge,
  UserBadge,
  UserStreak,
  Challenge,
  UserChallenge,
  Leaderboard,
  LeaderboardEntry,
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
} from "@shared/types/gamification.types";

// ============================================
// USER POINTS AND LEVELS
// ============================================

/**
 * Get user's gamification stats (optimized with parallel queries)
 */
export async function getUserGamificationStats(
  userId: string
): Promise<GamificationStats | null> {
  const supabase = await getServiceClient();

  try {
    const [
      userPointsRes,
      userBadgesRes,
      streaksRes,
      activeChallengesRes,
      recentActivitiesRes,
    ] = await Promise.all([
      supabase
        .from("user_points")
        .select("total_points, current_level, points_to_next_level")
        .eq("user_id", userId)
        .single(),
      supabase.from("user_badges").select("id").eq("user_id", userId),
      supabase.from("user_streaks").select("*").eq("user_id", userId),
      supabase
        .from("user_challenges")
        .select(
          `
        id,
        user_id,
        challenge_id,
        progress,
        is_completed,
        points_earned,
        created_at,
        updated_at,
        challenge:challenges(id, title, description, points_reward, requirements, start_date, end_date)
      `
        )
        .eq("user_id", userId)
        .eq("is_completed", false),
      supabase
        .from("points_history")
        .select(
          "id, user_id, points, action_type, action_description, reference_id, reference_type, created_at"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // ตัวอย่างเช็ค error userPoints
    if (userPointsRes.error && userPointsRes.error.code !== "PGRST116") {
      throw new Error(
        `Failed to get user points: ${userPointsRes.error.message}`
      );
    }

    return {
      total_points: userPointsRes.data?.total_points || 0,
      current_level: userPointsRes.data?.current_level || 1,
      points_to_next_level: userPointsRes.data?.points_to_next_level || 100,
      badges_earned: userBadgesRes.data?.length || 0,
      current_streaks: streaksRes.data || [],
      active_challenges: (activeChallengesRes.data || []).map((uc: any) => ({
        ...uc,
        challenge: Array.isArray(uc.challenge)
          ? (uc.challenge[0] as unknown as Challenge)
          : (uc.challenge as unknown as Challenge),
      })) as UserChallenge[],
      recent_activities: recentActivitiesRes.data || [],
    };
  } catch (error) {
    console.error("Error getting user gamification stats:", error);
    return null;
  }
}

/**
 * Award points to user
 */
export async function awardPoints(
  request: AwardPointsRequest
): Promise<PointsAwardResponse | null> {
  const supabase = await getServiceClient();

  try {
    // Get current level before awarding points to detect level changes
    const { data: currentUserPoints } = await supabase
      .from("user_points")
      .select("current_level")
      .eq("user_id", request.user_id)
      .single();

    const previousLevel = currentUserPoints?.current_level || 1;

    // Call the database function to award points
    const { data, error } = await supabase.rpc("award_points", {
      target_user_id: request.user_id,
      points_to_award: request.points,
      action_type: request.action_type,
      action_description: request.action_description || null,
      reference_id: request.reference_id || null,
      reference_type: request.reference_type || null,
    });

    handleQueryError(error, 'Failed to award points');

    if (!data) {
      throw new ServiceNotFoundError("Failed to award points");
    }

    // Get updated user points
    const { data: userPoints, error: pointsError } = await supabase
      .from("user_points")
      .select("*")
      .eq("user_id", request.user_id)
      .single();

    handleQueryError(pointsError, 'Failed to get updated user points');

    const newLevel = userPoints?.current_level || 1;

    // Check for new badges
    const { data: newBadges, error: badgesError } = await supabase.rpc(
      "check_and_award_badges",
      {
        target_user_id: request.user_id,
      }
    );

    if (badgesError) {
      // Badge check failed, continue anyway
    }

    // Send notifications for new badges
    if (newBadges && newBadges.length > 0) {
      for (const badge of newBadges) {
        try {
          await supabase.from("notifications").insert({
            user_id: request.user_id,
            type: "badge_earned",
            title: "ได้รับเหรียญใหม่! 🏅",
            message: `ยินดีด้วย! คุณได้รับเหรียญ: ${badge.badge_name}`,
            link_url: "/dashboard/gamification",
            metadata: {
              badge_id: badge.badge_id,
              badge_name: badge.badge_name,
            },
          });
        } catch (notificationError) {
          console.warn("Failed to send badge notification:", notificationError);
        }
      }
    }

    // Send notification for level up
    if (newLevel > previousLevel) {
      try {
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          type: "level_up",
          title: "เลื่อนระดับ! ⭐",
          message: `ยินดีด้วย! คุณขึ้นไประดับ ${newLevel} แล้ว`,
          link_url: "/dashboard/gamification",
          metadata: {
            previous_level: previousLevel,
            new_level: newLevel,
            total_points: userPoints?.total_points || 0,
          },
        });
      } catch (notificationError) {
        console.warn(
          "Failed to send level up notification:",
          notificationError
        );
      }
    }

    // Update leaderboards (async, don't wait for completion)
    // Fire and forget - update leaderboards in background
    (async () => {
      try {
        await supabase.rpc("update_all_leaderboards");
      } catch (error: unknown) {
        console.warn("Failed to update leaderboards:", error);
      }
    })();

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
 * Get user's points history (optimized - only select needed columns)
 */
export async function getUserPointsHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<PointsHistory[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("points_history")
      .select(
        "id, user_id, points, action_type, action_description, reference_id, reference_type, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    handleQueryError(error, 'Failed to get points history');

    return data || [];
  } catch (error) {
    return [];
  }
}

// ============================================
// BADGES AND ACHIEVEMENTS
// ============================================

/**
 * Get all available badges (optimized - only select needed columns)
 */
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("badges")
      .select(
        "id, name, name_english, description, description_english, icon_url, points_required, category, rarity, is_active, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("points_required", { ascending: true });

    handleQueryError(error, 'Failed to get badges');

    return (data || []) as Badge[];
  } catch (error) {
    return [];
  }
}

/**
 * Get user's earned badges (optimized - only select needed columns)
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        id,
        user_id,
        badge_id,
        earned_at,
        badge:badges(id, name, name_english, description, description_english, icon_url, points_required, category, rarity, is_active, created_at, updated_at)
      `
      )
      .eq("user_id", userId)
      .order("earned_at", { ascending: false });

    handleQueryError(error, 'Failed to get user badges');

    return (data || []).map((ub: any) => ({
      ...ub,
      badge: Array.isArray(ub.badge)
        ? (ub.badge[0] as unknown as Badge)
        : (ub.badge as unknown as Badge),
    })) as UserBadge[];
  } catch (error) {
    return [];
  }
}

/**
 * Get badge progress for user (optimized with single query)
 */
export async function getBadgeProgress(
  userId: string
): Promise<BadgeProgress[]> {
  const supabase = await getServiceClient();

  try {
    // Get all data in parallel for better performance
    const [badges, userBadges, userPointsData] = await Promise.all([
      getAllBadges(),
      getUserBadges(userId),
      supabase
        .from("user_points")
        .select("total_points")
        .eq("user_id", userId)
        .single(),
    ]);

    const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badge_id));
    const totalPoints = userPointsData.data?.total_points || 0;

    return badges.map((badge) => {
      const isEarned = earnedBadgeIds.has(badge.id);
      const earnedAt = userBadges.find(
        (ub) => ub.badge_id === badge.id
      )?.earned_at;
      const progressPercentage = Math.min(
        (totalPoints / badge.points_required) * 100,
        100
      );

      let progressDescription = "";
      if (isEarned) {
        progressDescription = "ได้รับแล้ว";
      } else if (progressPercentage >= 100) {
        progressDescription = "พร้อมรับแล้ว";
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
export async function updateUserStreak(
  request: UpdateStreakRequest
): Promise<StreakUpdateResponse | null> {
  const supabase = await getServiceClient();

  try {
    // Call the database function to update streak
    const { data, error } = await supabase.rpc("update_user_streak", {
      target_user_id: request.user_id,
      streak_type: request.streak_type,
      activity_date:
        request.activity_date || new Date().toISOString().split("T")[0],
    });

    handleQueryError(error, 'Failed to update streak');

    if (!data) {
      throw new ServiceNotFoundError("Failed to update streak");
    }

    // Get updated streak info
    const { data: streak, error: streakError } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", request.user_id)
      .eq("streak_type", request.streak_type)
      .single();

    handleQueryError(streakError, 'Failed to get updated streak');

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
      streak_bonus_points:
        streakBonusPoints > 0 ? streakBonusPoints : undefined,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get user streaks (optimized - only select needed columns)
 */
export async function getUserStreaks(userId: string): Promise<UserStreak[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("user_streaks")
      .select(
        "id, user_id, streak_type, current_streak, longest_streak, last_activity_date, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("current_streak", { ascending: false });

    handleQueryError(error, 'Failed to get user streaks');

    return data || [];
  } catch (error) {
    return [];
  }
}

// ============================================
// CHALLENGES
// ============================================

/**
 * Get active challenges (optimized - only select needed columns)
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("challenges")
      .select(
        "id, title, title_english, description, description_english, challenge_type, points_reward, badge_reward_id, requirements, start_date, end_date, is_active, max_participants, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    handleQueryError(error, 'Failed to get active challenges');

    return (data || []) as Challenge[];
  } catch (error) {
    return [];
  }
}

/**
 * Join a challenge
 */
export async function joinChallenge(
  request: JoinChallengeRequest
): Promise<ChallengeJoinResponse | null> {
  const supabase = await getServiceClient();

  try {
    // Check if user is already participating
    const { data: existingParticipation, error: checkError } = await supabase
      .from("user_challenges")
      .select("id")
      .eq("user_id", request.user_id)
      .eq("challenge_id", request.challenge_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(
        `Failed to check existing participation: ${checkError.message}`
      );
    }

    if (existingParticipation) {
      throw new Error("User is already participating in this challenge");
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("*")
      .eq("id", request.challenge_id)
      .eq("is_active", true)
      .single();

    if (challengeError || !challenge) {
      throw new Error("Challenge not found or not active");
    }

    // Join the challenge
    const { data: userChallenge, error: joinError } = await supabase
      .from("user_challenges")
      .insert({
        user_id: request.user_id,
        challenge_id: request.challenge_id,
        progress: {},
        is_completed: false,
        points_earned: 0,
      })
      .select()
      .single();

    handleQueryError(joinError, 'Failed to join challenge');

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
export async function updateChallengeProgress(
  request: UpdateChallengeProgressRequest
): Promise<boolean> {
  const supabase = await getServiceClient();

  try {
    const { error } = await supabase
      .from("user_challenges")
      .update({
        progress: request.progress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.user_challenge_id);

    handleQueryError(error, 'Failed to update challenge progress');

    // Check if challenge is completed after progress update
    const { data: completionResult, error: checkError } = await supabase.rpc(
      "check_and_complete_challenge",
      {
        target_user_challenge_id: request.user_challenge_id,
      }
    );

    if (checkError) {
      console.warn("Failed to check challenge completion:", checkError);
    } else if (completionResult) {
      // Challenge was completed, send notification
      const { data: userChallenge } = await supabase
        .from("user_challenges")
        .select(
          `
          *,
          challenge:challenges(*)
        `
        )
        .eq("id", request.user_challenge_id)
        .single();

      if (userChallenge && userChallenge.challenge) {
        const challenge = userChallenge.challenge as Challenge;
        try {
          await supabase.from("notifications").insert({
            user_id: userChallenge.user_id,
            type: "challenge_complete",
            title: "สำเร็จแล้ว! 🎉",
            message: `ยินดีด้วย! คุณทำ Challenge "${challenge.title}" สำเร็จแล้ว`,
            link_url: "/dashboard/gamification",
            metadata: {
              challenge_id: challenge.id,
              challenge_title: challenge.title,
              points_earned: challenge.points_reward,
            },
          });
        } catch (notificationError) {
          console.warn(
            "Failed to send challenge completion notification:",
            notificationError
          );
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get user's challenge progress (optimized - only select needed columns)
 */
export async function getUserChallengeProgress(
  userId: string
): Promise<ChallengeProgress[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("user_challenges")
      .select(
        `
        id,
        user_id,
        challenge_id,
        progress,
        is_completed,
        completed_at,
        points_earned,
        created_at,
        updated_at,
        challenge:challenges(id, title, title_english, description, description_english, challenge_type, points_reward, badge_reward_id, requirements, start_date, end_date, is_active, max_participants, created_at, updated_at)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(
        `Failed to get user challenge progress: ${error.message}`
      );
    }

    return (data || []).map((uc: any) => {
      const challenge = Array.isArray(uc.challenge)
        ? (uc.challenge[0] as unknown as Challenge)
        : (uc.challenge as unknown as Challenge);
      const userChallenge = uc as UserChallenge;

      // Calculate progress percentage based on challenge requirements
      let progressPercentage = 0;
      if (challenge.requirements) {
        // This is a simplified calculation - you might want to implement more complex logic
        const totalRequirements = Object.keys(challenge.requirements).length;
        const completedRequirements = Object.keys(
          userChallenge.progress || {}
        ).length;
        progressPercentage =
          totalRequirements > 0
            ? (completedRequirements / totalRequirements) * 100
            : 0;
      }

      return {
        challenge,
        user_challenge: userChallenge,
        progress_percentage: progressPercentage,
        is_completed: userChallenge.is_completed,
        time_remaining: challenge.end_date
          ? new Date(challenge.end_date).toLocaleDateString("th-TH")
          : undefined,
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
  const supabase = await getServiceClient();

  try {
    // Get leaderboard info (optimized - only select needed columns)
    const { data: leaderboardRaw, error: leaderboardError } = await supabase
      .from("leaderboards")
      .select(
        "id, name, name_english, description, leaderboard_type, is_active, period_type, period_start, period_end, created_at, updated_at"
      )
      .eq("id", leaderboardId)
      .eq("is_active", true)
      .single();

    if (leaderboardError) {
      console.error("Leaderboard query error:", leaderboardError);
      // PGRST116 = no rows returned (not found)
      if (leaderboardError.code === "PGRST116") {
        return null;
      }
      throw leaderboardError;
    }

    if (!leaderboardRaw) {
      return null;
    }

    // Map period_type to period to match Leaderboard interface
    const leaderboard: Leaderboard = {
      ...leaderboardRaw,
      period: (leaderboardRaw.period_type as Leaderboard['period']) || 'all_time',
    };

    // Get leaderboard entries (optimized - only select needed columns)
    // First try with join, if fails, get entries without profile data
    let entries;
    let entriesError;

    const { data: entriesWithProfile, error: entriesErrorWithProfile } =
      await supabase
        .from("leaderboard_entries")
        .select(
          `
        id,
        leaderboard_id,
        user_id,
        rank,
        score,
        metadata,
        created_at,
        updated_at,
        profiles:user_id(username, full_name, avatar_url)
      `
        )
        .eq("leaderboard_id", leaderboardId)
        .order("rank", { ascending: true })
        .limit(100);

    if (entriesErrorWithProfile) {
      // If join fails, try without profile join
      console.warn(
        "Failed to join profiles, trying without join:",
        entriesErrorWithProfile.message
      );
      const { data: entriesWithoutProfile, error: entriesErrorWithoutProfile } =
        await supabase
          .from("leaderboard_entries")
          .select(
            "id, leaderboard_id, user_id, rank, score, metadata, created_at, updated_at"
          )
          .eq("leaderboard_id", leaderboardId)
          .order("rank", { ascending: true })
          .limit(100);

      entries = entriesWithoutProfile;
      entriesError = entriesErrorWithoutProfile;
    } else {
      entries = entriesWithProfile;
      entriesError = null;
    }

    if (entriesError) {
      console.error("Leaderboard entries query error:", entriesError);
      // If entries query fails, return leaderboard with empty entries instead of failing
      return {
        leaderboard,
        entries: [],
        user_rank: undefined,
        user_score: undefined,
      };
    }

    // Find user's rank if userId provided
    let userRank: number | undefined;
    let userScore: number | undefined;

    if (userId && entries) {
      const userEntry = entries.find(
        (entry: LeaderboardEntry) => entry.user_id === userId
      );
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
 * Get all leaderboards (optimized - only select needed columns)
 */
export async function getAllLeaderboards(): Promise<Leaderboard[]> {
  const supabase = await getServiceClient();

  try {
    const { data, error } = await supabase
      .from("leaderboards")
      .select(
        "id, name, name_english, description, leaderboard_type, is_active, period_type, period_start, period_end, created_at, updated_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      handleQueryError(error, 'Failed to get leaderboards');
    }

    // Map period_type to period to match Leaderboard interface
    return (data || []).map((lb: any) => ({
      ...lb,
      period: (lb.period_type as Leaderboard['period']) || 'all_time',
    })) as Leaderboard[];
  } catch (error) {
    return [];
  }
}

/**
 * Get leaderboard data with pagination
 */
export async function getLeaderboardDataPaginated(
  leaderboardId: string,
  userId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardData | null> {
  const supabase = await getServiceClient();

  try {
    // Get leaderboard info (optimized - only select needed columns)
    const { data: leaderboardRaw, error: leaderboardError } = await supabase
      .from("leaderboards")
      .select(
        "id, name, name_english, description, leaderboard_type, is_active, period_type, period_start, period_end, created_at, updated_at"
      )
      .eq("id", leaderboardId)
      .eq("is_active", true)
      .single();

    if (leaderboardError) {
      console.error("Leaderboard query error:", leaderboardError);
      if (leaderboardError.code === "PGRST116") {
        return null;
      }
      throw leaderboardError;
    }

    if (!leaderboardRaw) {
      return null;
    }

    // Map period_type to period to match Leaderboard interface
    const leaderboard: Leaderboard = {
      ...leaderboardRaw,
      period: (leaderboardRaw.period_type as Leaderboard['period']) || 'all_time',
    };

    // Get leaderboard entries with pagination (optimized - only select needed columns)
    let entries;
    let entriesError;

    const { data: entriesWithProfile, error: entriesErrorWithProfile } =
      await supabase
        .from("leaderboard_entries")
        .select(
          `
        id,
        leaderboard_id,
        user_id,
        rank,
        score,
        metadata,
        created_at,
        updated_at,
        profiles:user_id(username, full_name, avatar_url)
      `
        )
        .eq("leaderboard_id", leaderboardId)
        .order("rank", { ascending: true })
        .range(offset, offset + limit - 1);

    if (entriesErrorWithProfile) {
      console.warn(
        "Failed to join profiles, trying without join:",
        entriesErrorWithProfile.message
      );
      const { data: entriesWithoutProfile, error: entriesErrorWithoutProfile } =
        await supabase
          .from("leaderboard_entries")
          .select(
            "id, leaderboard_id, user_id, rank, score, metadata, created_at, updated_at"
          )
          .eq("leaderboard_id", leaderboardId)
          .order("rank", { ascending: true })
          .range(offset, offset + limit - 1);

      entries = entriesWithoutProfile;
      entriesError = entriesErrorWithoutProfile;
    } else {
      entries = entriesWithProfile;
      entriesError = null;
    }

    if (entriesError) {
      console.error("Leaderboard entries query error:", entriesError);
      return {
        leaderboard,
        entries: [],
        user_rank: undefined,
        user_score: undefined,
      };
    }

    // Find user's rank if userId provided
    let userRank: number | undefined;
    let userScore: number | undefined;

    if (userId) {
      const { data: userEntry } = await supabase
        .from("leaderboard_entries")
        .select("rank, score")
        .eq("leaderboard_id", leaderboardId)
        .eq("user_id", userId)
        .single();

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

// ============================================
// GAMIFICATION DASHBOARD
// ============================================

/**
 * Get complete gamification dashboard data (optimized)
 */
export async function getGamificationDashboard(
  userId: string
): Promise<GamificationDashboard | null> {
  try {
    // Get user stats first as it's required
    const userStats = await getUserGamificationStats(userId);
    if (!userStats) {
      return null;
    }

    // Get remaining data in parallel
    const [recentBadges, activeChallenges, leaderboards, upcomingEvents] =
      await Promise.all([
        getUserBadges(userId).then((badges) => badges.slice(0, 5)),
        getUserChallengeProgress(userId).then((challenges) =>
          challenges.filter((c) => !c.is_completed).slice(0, 3)
        ),
        getAllLeaderboards().then(async (leaderboards) => {
          const topLeaderboards = leaderboards.slice(0, 3);
          const leaderboardData = await Promise.all(
            topLeaderboards.map((lb) => getLeaderboardData(lb.id, userId))
          );
          return leaderboardData.filter(Boolean) as LeaderboardData[];
        }),
        getActiveChallenges().then((challenges) => challenges.slice(0, 5)),
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
 * @deprecated Not currently used, but kept for potential future use
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateLevelProgress(userPoints: UserPoints): number {
  return Math.min(
    ((userPoints.total_points - (userPoints.current_level - 1) ** 2 * 100) /
      (userPoints.points_to_next_level -
        (userPoints.current_level - 1) ** 2 * 100)) *
      100,
    100
  );
}

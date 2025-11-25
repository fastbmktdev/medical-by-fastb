'use client';

import { useMemo } from 'react';
import {
  GamificationStats,
  Badge,
  UserStreak,
  Challenge,
  ChallengeProgress,
  LeaderboardEntry
} from '@shared/types/gamification.types';
import {
  getRarityColor,
  getRarityIcon,
  getLevelIcon,
  getLevelTitle,
  getLevelColor,
  getChallengeTypeIcon,
  getChallengeTypeColor,
  getStreakIcon,
  getStreakColor,
  getStreakTitle,
  getStreakDescription,
  getStreakStatus,
  getRankIcon,
  getRankColor,
  getActionIcon,
  getActionColor,
  getActionTitle,
  formatRelativeDate,
  calculateLevelProgress,
  formatPoints
} from './gamificationUtils';

// Hook for badge display logic
export function useBadgeDisplay(badge: Badge, isEarned: boolean = false, earnedAt?: string) {
  return useMemo(() => ({
    rarityColor: getRarityColor(badge.rarity),
    rarityIcon: getRarityIcon(badge.rarity),
    isEarned,
    earnedAt,
    formattedEarnedDate: earnedAt ? new Date(earnedAt).toLocaleDateString('th-TH') : null
  }), [badge.rarity, isEarned, earnedAt]);
}

// Hook for level display logic
export function useLevelDisplay(userStats: GamificationStats) {
  return useMemo(() => {
    const progressPercentage = calculateLevelProgress(
      userStats.total_points,
      userStats.current_level,
      userStats.points_to_next_level
    );

    return {
      levelIcon: getLevelIcon(userStats.current_level),
      levelTitle: getLevelTitle(userStats.current_level),
      levelColor: getLevelColor(userStats.current_level),
      progressPercentage,
      formattedPoints: formatPoints(userStats.total_points),
      pointsToNext: userStats.points_to_next_level - userStats.total_points
    };
  }, [userStats]);
}

// Hook for challenge display logic
export function useChallengeDisplay(challenge: Challenge | ChallengeProgress) {
  return useMemo(() => {
    const challengeData = 'challenge' in challenge ? challenge.challenge : challenge;
    const progress = 'progress_percentage' in challenge ? challenge : null;

    return {
      typeIcon: getChallengeTypeIcon(challengeData.challenge_type),
      typeColor: getChallengeTypeColor(challengeData.challenge_type),
      isProgress: !!progress,
      progressPercentage: progress?.progress_percentage || 0,
      isCompleted: progress?.is_completed || false,
      formattedStartDate: challengeData.start_date ? 
        new Date(challengeData.start_date).toLocaleDateString('th-TH') : null,
      formattedEndDate: challengeData.end_date ? 
        new Date(challengeData.end_date).toLocaleDateString('th-TH') : null
    };
  }, [challenge]);
}

// Hook for streak display logic
export function useStreakDisplay(streak: UserStreak) {
  return useMemo(() => {
    const status = getStreakStatus(streak.current_streak);
    
    return {
      icon: getStreakIcon(streak.streak_type),
      color: getStreakColor(streak.streak_type),
      title: getStreakTitle(streak.streak_type),
      description: getStreakDescription(streak.streak_type),
      status,
      progressPercentage: Math.min((streak.current_streak / 30) * 100, 100),
      daysToThirty: Math.max(30 - streak.current_streak, 0),
      formattedLastActivity: streak.last_activity_date ? 
        new Date(streak.last_activity_date).toLocaleDateString('th-TH') : null
    };
  }, [streak]);
}

// Hook for leaderboard entry display logic
export function useLeaderboardEntryDisplay(entry: LeaderboardEntry, isCurrentUser: boolean = false) {
  return useMemo(() => ({
    rankIcon: getRankIcon(entry.rank),
    rankColor: getRankColor(entry.rank),
    isCurrentUser,
    formattedScore: formatPoints(entry.score),
    userInitial: entry.user?.username?.charAt(0).toUpperCase() || '?',
    displayName: entry.user?.full_name || entry.user?.username || 'ผู้ใช้ไม่ระบุชื่อ'
  }), [entry, isCurrentUser]);
}

// Hook for points history display logic
export function usePointsHistoryDisplay(activities: Array<{ action_type: string; points: number; created_at: string; [key: string]: unknown }>) {
  return useMemo(() => 
    activities.map(activity => ({
      ...activity,
      actionIcon: getActionIcon(activity.action_type),
      actionColor: getActionColor(activity.action_type),
      actionTitle: getActionTitle(activity.action_type),
      formattedDate: formatRelativeDate(activity.created_at),
      isPositive: activity.points > 0
    }))
  , [activities]);
}

// Hook for gamification widget display logic
export function useGamificationWidgetDisplay(stats: GamificationStats | null) {
  return useMemo(() => {
    if (!stats) return null;

    // Calculate level display directly instead of using hook in useMemo
    const progressPercentage = calculateLevelProgress(
      stats.total_points,
      stats.current_level,
      stats.points_to_next_level
    );
    const levelDisplay = {
      levelIcon: getLevelIcon(stats.current_level),
      levelTitle: getLevelTitle(stats.current_level),
      levelColor: getLevelColor(stats.current_level),
      progressPercentage,
      formattedPoints: formatPoints(stats.total_points),
      pointsToNext: stats.points_to_next_level - stats.total_points
    };
    
    return {
      ...levelDisplay,
      hasStreaks: stats.current_streaks.length > 0,
      hasChallenges: stats.active_challenges.length > 0,
      hasActivities: stats.recent_activities.length > 0,
      streakCount: stats.current_streaks.length,
      challengeCount: stats.active_challenges.length,
      badgeCount: stats.badges_earned
    };
  }, [stats]);
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  GamificationStats, 
  UserBadge, 
  ChallengeProgress, 
  LeaderboardData,
  PointsAwardResponse,
  StreakUpdateResponse,
  ChallengeJoinResponse
} from '@shared/types/gamification.types';

interface UseGamificationReturn {
  // Data
  stats: GamificationStats | null;
  badges: UserBadge[];
  challenges: ChallengeProgress[];
  leaderboards: LeaderboardData[];
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  awardPoints: (points: number, actionType: string, description?: string, referenceId?: string, referenceType?: string) => Promise<PointsAwardResponse | null>;
  updateStreak: (streakType: string, activityDate?: string) => Promise<StreakUpdateResponse | null>;
  joinChallenge: (challengeId: string) => Promise<ChallengeJoinResponse | null>;
  refreshData: () => Promise<void>;
}

export function useGamification(): UseGamificationReturn {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch gamification stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/stats');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Fetch user badges
  const fetchBadges = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/badges?type=earned');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch badges');
      }

      setBadges(result.data);
    } catch (err) {
      console.error('Error fetching badges:', err);
    }
  }, []);

  // Fetch user challenges
  const fetchChallenges = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/challenges?type=user_progress');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch challenges');
      }

      setChallenges(result.data);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
  }, []);

  // Fetch leaderboards
  const fetchLeaderboards = useCallback(async () => {
    try {
      const response = await fetch('/api/gamification/leaderboards');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch leaderboards');
      }

      // Get top 3 leaderboards with data
      const leaderboardPromises = result.data.slice(0, 3).map(async (lb: { id: string }) => {
        const lbResponse = await fetch(`/api/gamification/leaderboards?id=${lb.id}`);
        const lbResult = await lbResponse.json();
        return lbResult.data;
      });

      const leaderboardData = await Promise.all(leaderboardPromises);
      setLeaderboards(leaderboardData.filter(Boolean));
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
    }
  }, []);

  // Award points to user
  const awardPoints = useCallback(async (
    points: number,
    actionType: string,
    description?: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<PointsAwardResponse | null> => {
    try {
      const response = await fetch('/api/gamification/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
          action_type: actionType,
          action_description: description,
          reference_id: referenceId,
          reference_type: referenceType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to award points');
      }

      // Refresh stats after awarding points
      await fetchStats();

      return result.data;
    } catch (err) {
      console.error('Error awarding points:', err);
      return null;
    }
  }, [fetchStats]);

  // Update user streak
  const updateStreak = useCallback(async (
    streakType: string,
    activityDate?: string
  ): Promise<StreakUpdateResponse | null> => {
    try {
      const response = await fetch('/api/gamification/streaks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streak_type: streakType,
          activity_date: activityDate,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update streak');
      }

      // Refresh stats after updating streak
      await fetchStats();

      return result.data;
    } catch (err) {
      console.error('Error updating streak:', err);
      return null;
    }
  }, [fetchStats]);

  // Join challenge
  const joinChallenge = useCallback(async (
    challengeId: string
  ): Promise<ChallengeJoinResponse | null> => {
    try {
      const response = await fetch('/api/gamification/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          challenge_id: challengeId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join challenge');
      }

      // Refresh challenges after joining
      await fetchChallenges();

      return result.data;
    } catch (err) {
      console.error('Error joining challenge:', err);
      return null;
    }
  }, [fetchChallenges]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchStats(),
        fetchBadges(),
        fetchChallenges(),
        fetchLeaderboards(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchBadges, fetchChallenges, fetchLeaderboards]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    // Data
    stats,
    badges,
    challenges,
    leaderboards,
    
    // Loading states
    loading,
    error,
    
    // Actions
    awardPoints,
    updateStreak,
    joinChallenge,
    refreshData,
  };
}

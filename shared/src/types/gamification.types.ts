// Gamification Types
// ประเภทข้อมูลสำหรับระบบ Gamification ของ medical Platform

// ============================================
// CORE GAMIFICATION TYPES
// ============================================

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  current_level: number;
  points_to_next_level: number;
  created_at: string;
  updated_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  action_description?: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  name_english?: string;
  description: string;
  description_english?: string;
  icon_url?: string;
  points_required: number;
  category: 'appointment' | 'loyalty' | 'social' | 'learning' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge; // Populated when joining with badges table
}

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: 'appointment' | 'login' | 'review' | 'article_read';
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  title_english?: string;
  description: string;
  description_english?: string;
  challenge_type: 'daily' | 'weekly' | 'monthly' | 'special';
  points_reward: number;
  badge_reward_id?: string;
  requirements: Record<string, unknown>; // Flexible JSON structure
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  max_participants?: number;
  created_at: string;
  updated_at: string;
  badge_reward?: Badge; // Populated when joining with badges table
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: Record<string, unknown>; // Flexible JSON structure
  is_completed: boolean;
  completed_at?: string;
  points_earned: number;
  created_at: string;
  updated_at: string;
  challenge?: Challenge; // Populated when joining with challenges table
}

export interface Leaderboard {
  id: string;
  name: string;
  name_english?: string;
  description?: string;
  leaderboard_type: 'points' | 'appointments' | 'streak' | 'monthly' | 'all_time';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;
  rank: number;
  score: number;
  period_start?: string;
  period_end?: string;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  }; // Populated when joining with profiles
}

export interface GamificationRule {
  id: string;
  rule_name: string;
  action_type: string;
  points_awarded: number;
  conditions?: Record<string, unknown>; // Flexible JSON structure
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// GAMIFICATION RESPONSE TYPES
// ============================================

export interface GamificationStats {
  total_points: number;
  current_level: number;
  points_to_next_level: number;
  badges_earned: number;
  current_streaks: UserStreak[];
  active_challenges: UserChallenge[];
  recent_activities: PointsHistory[];
}

export interface LeaderboardData {
  leaderboard: Leaderboard;
  entries: LeaderboardEntry[];
  total_entries?: number;
  user_rank?: number;
  user_score?: number;
}

export interface BadgeProgress {
  badge: Badge;
  is_earned: boolean;
  earned_at?: string;
  progress_percentage: number;
  progress_description: string;
}

export interface ChallengeProgress {
  challenge: Challenge;
  user_challenge?: UserChallenge;
  progress_percentage: number;
  is_completed: boolean;
  time_remaining?: string;
}

// ============================================
// GAMIFICATION ACTION TYPES
// ============================================

export interface AwardPointsRequest {
  user_id: string;
  points: number;
  action_type: string;
  action_description?: string;
  reference_id?: string;
  reference_type?: string;
}

export interface UpdateStreakRequest {
  user_id: string;
  streak_type: 'appointment' | 'login' | 'review' | 'article_read';
  activity_date?: string;
}

export interface JoinChallengeRequest {
  user_id: string;
  challenge_id: string;
}

export interface UpdateChallengeProgressRequest {
  user_challenge_id: string;
  progress: Record<string, unknown>;
}

// ============================================
// GAMIFICATION API RESPONSES
// ============================================

export interface GamificationApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PointsAwardResponse {
  points_awarded: number;
  new_total_points: number;
  new_level: number;
  badges_earned: Badge[];
  message: string;
}

export interface StreakUpdateResponse {
  streak_updated: boolean;
  current_streak: number;
  longest_streak: number;
  streak_bonus_points?: number;
}

export interface ChallengeJoinResponse {
  challenge_joined: boolean;
  challenge: Challenge;
  user_challenge: UserChallenge;
}

// ============================================
// GAMIFICATION UI TYPES
// ============================================

export interface GamificationDashboard {
  user_stats: GamificationStats;
  recent_badges: UserBadge[];
  active_challenges: ChallengeProgress[];
  leaderboards: LeaderboardData[];
  upcoming_challenges: Challenge[];
}

export interface BadgeDisplay {
  badge: Badge;
  is_earned: boolean;
  earned_at?: string;
  rarity_color: string;
  rarity_icon: string;
}

export interface LevelDisplay {
  current_level: number;
  current_points: number;
  points_to_next_level: number;
  progress_percentage: number;
  level_title: string;
  level_icon: string;
}

export interface StreakDisplay {
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  streak_icon: string;
  streak_color: string;
}

// ============================================
// GAMIFICATION CONSTANTS
// ============================================

export const GAMIFICATION_ACTIONS = {
  appointment: 'appointment',
  PROFILE_UPDATE: 'profile_update',
  REVIEW: 'review',
  SOCIAL_SHARE: 'social_share',
  ARTICLE_READ: 'article_read',
  VIDEO_WATCHED: 'video_watched',
  LOGIN: 'login',
  REFERRAL: 'referral',
  CHALLENGE_COMPLETE: 'challenge_complete',
} as const;

export const BADGE_CATEGORIES = {
  appointment: 'appointment',
  LOYALTY: 'loyalty',
  SOCIAL: 'social',
  LEARNING: 'learning',
  SPECIAL: 'special',
} as const;

export const BADGE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export const STREAK_TYPES = {
  appointment: 'appointment',
  LOGIN: 'login',
  REVIEW: 'review',
  ARTICLE_READ: 'article_read',
} as const;

export const CHALLENGE_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SPECIAL: 'special',
} as const;

export const LEADERBOARD_TYPES = {
  POINTS: 'points',
  appointments: 'appointments',
  STREAK: 'streak',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time',
} as const;

// ============================================
// GAMIFICATION UTILITY TYPES
// ============================================

export type GamificationAction = typeof GAMIFICATION_ACTIONS[keyof typeof GAMIFICATION_ACTIONS];
export type BadgeCategory = typeof BADGE_CATEGORIES[keyof typeof BADGE_CATEGORIES];
export type BadgeRarity = typeof BADGE_RARITIES[keyof typeof BADGE_RARITIES];
export type StreakType = typeof STREAK_TYPES[keyof typeof STREAK_TYPES];
export type ChallengeType = typeof CHALLENGE_TYPES[keyof typeof CHALLENGE_TYPES];
export type LeaderboardType = typeof LEADERBOARD_TYPES[keyof typeof LEADERBOARD_TYPES];

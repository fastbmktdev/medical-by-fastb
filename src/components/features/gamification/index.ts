/**
 * Gamification Feature Components
 * 
 * Components for the gamification system including badges, challenges,
 * leaderboards, points tracking, and user engagement features.
 * 
 * These components integrate with the gamification service and provide
 * consistent UI patterns for displaying user progress and achievements.
 */

// Core Gamification Components
export { default as BadgeCollection } from './BadgeCollection';
export { default as ChallengeList } from './ChallengeList';
export { default as GamificationDashboard } from './GamificationDashboard';
export { default as GamificationWidget } from './GamificationWidget';

// Display Components
export { default as LevelDisplay } from './LevelDisplay';
export { default as PointsHistory } from './PointsHistory';
export { default as StreakDisplay } from './StreakDisplay';

// Interactive Components
export { default as LeaderboardWidget } from './LeaderboardWidget';
export { default as GamificationNotification } from './GamificationNotification';

// Shared Gamification Components and Utilities
export * from './shared';

// Re-export gamification types for convenience
export type {
  Badge,
  Challenge,
  LeaderboardEntry,
} from '@/types/gamification.types';
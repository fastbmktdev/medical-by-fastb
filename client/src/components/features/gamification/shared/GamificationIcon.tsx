'use client';

import React from 'react';

interface GamificationIconProps {
  type: 'badge' | 'challenge' | 'streak' | 'level' | 'points' | 'leaderboard';
  subType?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function GamificationIcon({ type, subType, size = 'md', className = '' }: GamificationIconProps) {
  const getIcon = () => {
    switch (type) {
      case 'badge':
        return getBadgeIcon(subType);
      case 'challenge':
        return getChallengeIcon(subType);
      case 'streak':
        return getStreakIcon(subType);
      case 'level':
        return getLevelIcon(subType);
      case 'points':
        return '🏆';
      case 'leaderboard':
        return getLeaderboardIcon(subType);
      default:
        return '🏅';
    }
  };

  const getBadgeIcon = (category?: string) => {
    switch (category) {
      case 'appointment': return '📅';
      case 'loyalty': return '❤️';
      case 'social': return '👥';
      case 'learning': return '📚';
      case 'special': return '⭐';
      default: return '🏅';
    }
  };

  const getChallengeIcon = (challengeType?: string) => {
    switch (challengeType) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '🗓️';
      case 'special': return '🎉';
      default: return '🎯';
    }
  };

  const getStreakIcon = (streakType?: string) => {
    switch (streakType) {
      case 'appointment': return '📅';
      case 'login': return '🔑';
      case 'review': return '⭐';
      case 'article_read': return '📖';
      default: return '🔥';
    }
  };

  const getLevelIcon = (level?: string) => {
    const levelNum = parseInt(level || '1');
    if (levelNum <= 3) return '🥊';
    if (levelNum <= 6) return '🥋';
    if (levelNum <= 8) return '🏆';
    return '👑';
  };

  const getLeaderboardIcon = (leaderboardType?: string) => {
    switch (leaderboardType) {
      case 'points': return '🏆';
      case 'appointments': return '📅';
      case 'streak': return '🔥';
      case 'monthly': return '📊';
      case 'all_time': return '⭐';
      default: return '🏅';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm': return 'text-lg';
      case 'md': return 'text-2xl';
      case 'lg': return 'text-3xl';
      case 'xl': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  return (
    <span className={`${getSizeClass()} ${className}`}>
      {getIcon()}
    </span>
  );
}
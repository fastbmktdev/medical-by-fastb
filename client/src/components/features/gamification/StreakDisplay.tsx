'use client';

import React from 'react';
import { UserStreak } from '@shared/types/gamification.types';
import { 
  GamificationCard, 
  GamificationProgressBar,
  useStreakDisplay
} from './shared';

interface StreakDisplayProps {
  streak: UserStreak;
  className?: string;
}

export default function StreakDisplay({ streak, className = '' }: StreakDisplayProps) {
  const streakDisplay = useStreakDisplay(streak);

  return (
    <GamificationCard className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{streakDisplay.icon}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">
              {streakDisplay.title}
            </h3>
            <p className="text-xs text-zinc-400">
              {streakDisplay.description}
            </p>
          </div>
        </div>
      </div>

      {/* Streak Numbers */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400">
            {streak.current_streak}
          </div>
          <div className="text-xs text-zinc-400">สตรีคปัจจุบัน</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {streak.longest_streak}
          </div>
          <div className="text-xs text-zinc-400">สตรีคสูงสุด</div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <div className={`inline-flex items-center px-3 py-1  text-sm font-medium ${streakDisplay.color}`}>
          <span className={`${streakDisplay.status.color}`}>{streakDisplay.status.text}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {streak.current_streak > 0 && (
        <div className="mt-3">
          <GamificationProgressBar
            progress={streakDisplay.progressPercentage}
            variant="streak"
            size="sm"
          />
          <div className="text-xs text-zinc-500 mt-1 text-center">
            {streakDisplay.daysToThirty > 0 
              ? `อีก ${streakDisplay.daysToThirty} วันถึง 30 วัน`
              : 'สตรีคยาวนานมาก!'
            }
          </div>
        </div>
      )}

      {/* Last Activity */}
      {streakDisplay.formattedLastActivity && (
        <div className="mt-3 text-center">
          <div className="text-xs text-zinc-500">
            กิจกรรมล่าสุด: {streakDisplay.formattedLastActivity}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {streak.current_streak === 0 && (
        <div className="mt-3 text-center">
          <div className="text-sm text-zinc-400">
            เริ่มต้นสตรีคใหม่วันนี้!
          </div>
        </div>
      )}
    </GamificationCard>
  );
}

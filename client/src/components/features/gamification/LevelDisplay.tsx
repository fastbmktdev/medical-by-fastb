'use client';

import React from 'react';
import { GamificationStats } from '@shared/types/gamification.types';
import { 
  GamificationCard, 
  GamificationProgressBar,
  useLevelDisplay
} from './shared';

interface LevelDisplayProps {
  userStats: GamificationStats;
  className?: string;
}

export default function LevelDisplay({ userStats, className = '' }: LevelDisplayProps) {
  const levelDisplay = useLevelDisplay(userStats);

  return (
    <GamificationCard variant="elevated" size="lg" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center text-white">
          {levelDisplay.levelIcon} ระดับของคุณ
        </h2>
        <div className="text-right">
          <div className="text-2xl font-semibold text-blue-400">{levelDisplay.formattedPoints}</div>
          <div className="text-sm text-zinc-400">คะแนนรวม</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-medium text-white">{levelDisplay.levelTitle}</span>
          <span className="text-sm text-zinc-400">ระดับ {userStats.current_level}</span>
        </div>
        
        <GamificationProgressBar
          progress={levelDisplay.progressPercentage}
          variant="level"
          size="lg"
          label={`ต้องการอีก ${levelDisplay.pointsToNext} คะแนน`}
          showPercentage={true}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-blue-950/50  p-3 border border-blue-700/30">
          <div className="text-2xl font-semibold text-blue-400">{userStats.current_level}</div>
          <div className="text-sm text-zinc-400">ระดับปัจจุบัน</div>
        </div>
        
        <div className="bg-green-950/50  p-3 border border-green-700/30">
          <div className="text-2xl font-semibold text-green-400">{userStats.badges_earned}</div>
          <div className="text-sm text-zinc-400">เหรียญที่ได้รับ</div>
        </div>
        
        <div className="bg-purple-950/50  p-3 border border-purple-700/30">
          <div className="text-2xl font-semibold text-purple-400">{userStats.active_challenges.length}</div>
          <div className="text-sm text-zinc-400">ความท้าทาย</div>
        </div>
        
        <div className="bg-orange-950/50  p-3 border border-orange-700/30">
          <div className="text-2xl font-semibold text-orange-400">{userStats.current_streaks.length}</div>
          <div className="text-sm text-zinc-400">สตรีค</div>
        </div>
      </div>
    </GamificationCard>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useGamification } from '@/lib/hooks/useGamification';

interface GamificationWidgetProps {
  className?: string;
}

export default function GamificationWidget({ className = '' }: GamificationWidgetProps) {
  const { stats, loading, error } = useGamification();

  if (loading) {
    return (
      <div className={`bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg shadow-md p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-zinc-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={`bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg shadow-md p-4 ${className}`}>
        <div className="text-center text-zinc-500">
          <div className="text-2xl mb-2">🏆</div>
          <p className="text-sm">ไม่สามารถโหลดข้อมูล Gamification ได้</p>
        </div>
      </div>
    );
  }

  const getLevelIcon = (level: number) => {
    if (level <= 3) return '🥊';
    if (level <= 6) return '🥋';
    if (level <= 8) return '🏆';
    return '👑';
  };

  const getLevelTitle = (level: number) => {
    const titles = [
      'นักชกหน้าใหม่', 'นักชกฝึกหัด', 'นักชกมือใหม่', 'นักชกประจำ', 'นักชกมืออาชีพ',
      'นักชกแชมป์', 'นักชกตำนาน', 'นักชกเทพ', 'นักชกอมตะ', 'นักชกสูงสุด'
    ];
    return titles[Math.min(level - 1, titles.length - 1)] || 'นักชกสูงสุด';
  };

  const progressPercentage = Math.min(
    ((stats.total_points - ((stats.current_level - 1) ** 2 * 100)) / 
     (stats.points_to_next_level - ((stats.current_level - 1) ** 2 * 100))) * 100,
    100
  );

  return (
    <div className={`bg-gradient-to-br from-blue-950/50 to-purple-950/50 backdrop-blur-sm border border-blue-700/30 rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getLevelIcon(stats.current_level)}</span>
          <div>
            <h3 className="font-semibold text-white text-sm">
              {getLevelTitle(stats.current_level)}
            </h3>
            <p className="text-xs text-zinc-400">ระดับ {stats.current_level}</p>
          </div>
        </div>
        
        <Link 
          href="/dashboard/gamification"
          className="text-blue-400 hover:text-blue-300 text-xs font-medium"
        >
          ดูทั้งหมด
        </Link>
      </div>

      {/* Points Display */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-zinc-300 mb-1">
          <span>คะแนนรวม</span>
          <span>{(stats.total_points || 0).toLocaleString()}</span>
        </div>
        
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>ต้องการอีก {stats.points_to_next_level - stats.total_points} คะแนน</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-400">{stats.badges_earned}</div>
          <div className="text-xs text-zinc-400">เหรียญ</div>
        </div>
        
        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-purple-400">{stats.active_challenges.length}</div>
          <div className="text-xs text-zinc-400">ความท้าทาย</div>
        </div>
        
        <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-2">
          <div className="text-lg font-bold text-orange-400">{stats.current_streaks.length}</div>
          <div className="text-xs text-zinc-400">สตรีค</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex space-x-2">
        <Link
          href="/dashboard/gamification"
          className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg text-center hover:bg-blue-700 transition-colors"
        >
          ดูความคืบหน้า
        </Link>
        <Link
          href="/dashboard/gamification?tab=leaderboards"
          className="flex-1 bg-purple-600 text-white text-xs py-2 px-3 rounded-lg text-center hover:bg-purple-700 transition-colors"
        >
          ตารางคะแนน
        </Link>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { LeaderboardData } from '@/types/gamification.types';
import Image from 'next/image';

interface LeaderboardWidgetProps {
  leaderboard: LeaderboardData;
  className?: string;
}

export default function LeaderboardWidget({ leaderboard, className = '' }: LeaderboardWidgetProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-900/50 text-yellow-300 border border-yellow-700';
      case 2: return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
      case 3: return 'bg-orange-900/50 text-orange-300 border border-orange-700';
      default: return 'bg-blue-900/50 text-blue-300 border border-blue-700';
    }
  };

  const getLeaderboardIcon = (type: string) => {
    switch (type) {
      case 'points': return '🏆';
      case 'bookings': return '📅';
      case 'streak': return '🔥';
      case 'monthly': return '📊';
      case 'all_time': return '⭐';
      default: return '🏅';
    }
  };

  return (
    <div className={`bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">
            {getLeaderboardIcon(leaderboard.leaderboard.leaderboard_type)}
          </span>
          <div>
            <h3 className="font-semibold text-white">
              {leaderboard.leaderboard.name}
            </h3>
            <p className="text-sm text-zinc-400">
              {leaderboard.leaderboard.description}
            </p>
          </div>
        </div>
        
        {leaderboard.user_rank && (
          <div className="text-right">
            <div className="text-sm text-zinc-400">อันดับของคุณ</div>
            <div className="text-2xl font-bold text-blue-400">
              #{leaderboard.user_rank}
            </div>
            {leaderboard.user_score && (
              <div className="text-sm text-zinc-500">
                {leaderboard.user_score} คะแนน
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {leaderboard.entries.slice(0, 10).map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              entry.rank === leaderboard.user_rank ? 'bg-blue-950/50 border border-blue-700/50' : 'bg-zinc-900/30 border border-zinc-800/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(entry.rank)}`}>
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex items-center space-x-2">
                {entry.user?.avatar_url ? (
                  <Image
                    width={32}
                    height={32}
                    src={entry.user.avatar_url}
                    alt={entry.user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                    <span className="text-zinc-300 text-sm">
                      {entry.user?.username?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="font-medium text-white">
                    {entry.user?.full_name || entry.user?.username || 'ผู้ใช้ไม่ระบุชื่อ'}
                  </div>
                  <div className="text-sm text-zinc-400">
                    @{entry.user?.username || 'unknown'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-white">
                {entry.score.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-500">
                {leaderboard.leaderboard.leaderboard_type === 'points' ? 'คะแนน' :
                 leaderboard.leaderboard.leaderboard_type === 'bookings' ? 'การจอง' :
                 leaderboard.leaderboard.leaderboard_type === 'streak' ? 'สตรีค' : 'คะแนน'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {leaderboard.entries.length > 10 && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium" aria-label="Button">
            ดูทั้งหมด ({leaderboard.entries.length} คน)
          </button>
        </div>
      )}

      {/* No Entries */}
      {leaderboard.entries.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          <div className="text-4xl mb-2">🏆</div>
          <p>ยังไม่มีข้อมูลในตารางคะแนนนี้</p>
        </div>
      )}
    </div>
  );
}

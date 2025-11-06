'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/database/supabase/client';
import { LeaderboardData, LeaderboardEntry } from '@/types/gamification.types';
import Image from 'next/image';
import { Link } from '@/navigation';

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const leaderboardId = params.id as string;
  const supabase = createClient();

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    loadUser();
  }, [supabase]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const offset = (page - 1) * limit;
        
        const response = await fetch(
          `/api/gamification/leaderboards?id=${leaderboardId}&limit=${limit}&offset=${offset}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to load leaderboard');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setLeaderboardData(result.data);
        } else {
          throw new Error(result.error || 'Failed to load leaderboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (leaderboardId) {
      loadLeaderboard();
    }
  }, [leaderboardId, page, limit]);

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

  const getScoreLabel = (type: string) => {
    switch (type) {
      case 'points': return 'คะแนน';
      case 'bookings': return 'การจอง';
      case 'streak': return 'สตรีค';
      default: return 'คะแนน';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="border-4 border-red-600 border-t-transparent rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (error || !leaderboardData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">ไม่พบข้อมูล</h1>
          <p className="text-zinc-400 mb-4">{error || 'ไม่พบข้อมูลตารางคะแนน'}</p>
          <Link
            href="/dashboard/gamification"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            กลับไปหน้า Gamification
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil((leaderboardData.entries.length || 0) / limit);
  const hasMore = leaderboardData.entries.length >= limit;

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/gamification"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            ← กลับไปหน้า Gamification
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-4xl">
              {getLeaderboardIcon(leaderboardData.leaderboard.leaderboard_type)}
            </span>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {leaderboardData.leaderboard.name}
              </h1>
              {leaderboardData.leaderboard.description && (
                <p className="text-zinc-400 mt-1">
                  {leaderboardData.leaderboard.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Rank Card */}
        {leaderboardData.user_rank && (
          <div className="mb-6 bg-blue-950/50 border border-blue-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400 mb-1">อันดับของคุณ</div>
                <div className="text-3xl font-bold text-blue-400">
                  #{leaderboardData.user_rank}
                </div>
                {leaderboardData.user_score !== undefined && (
                  <div className="text-sm text-zinc-500 mt-1">
                    {leaderboardData.user_score.toLocaleString()} {getScoreLabel(leaderboardData.leaderboard.leaderboard_type)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">อันดับ</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">ผู้ใช้</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-300">
                    {getScoreLabel(leaderboardData.leaderboard.leaderboard_type)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {leaderboardData.entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                      <div className="text-4xl mb-2">🏆</div>
                      <p>ยังไม่มีข้อมูลในตารางคะแนนนี้</p>
                    </td>
                  </tr>
                ) : (
                  leaderboardData.entries.map((entry: LeaderboardEntry) => {
                    const isCurrentUser = userId && entry.user_id === userId;
                    return (
                      <tr
                        key={entry.id}
                        className={`hover:bg-zinc-900/30 transition-colors ${
                          isCurrentUser ? 'bg-blue-950/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            {entry.user?.avatar_url ? (
                              <Image
                                width={40}
                                height={40}
                                src={entry.user.avatar_url}
                                alt={entry.user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                                <span className="text-zinc-300 text-sm">
                                  {entry.user?.username?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className={`font-medium ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                                {entry.user?.full_name || entry.user?.username || 'ผู้ใช้ไม่ระบุชื่อ'}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-blue-400">(คุณ)</span>
                                )}
                              </div>
                              <div className="text-sm text-zinc-400">
                                @{entry.user?.username || 'unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-white">
                            {entry.score.toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {hasMore && (
          <div className="mt-6 flex justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <span className="px-4 py-2 text-zinc-300">
              หน้า {page}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


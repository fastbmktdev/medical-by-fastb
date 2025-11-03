'use client';

import { useState, useEffect } from 'react';
import { GamificationDashboard as GamificationDashboardType } from '@/types/gamification.types';
import LevelDisplay from './LevelDisplay';
import BadgeCollection from './BadgeCollection';
import ChallengeList from './ChallengeList';
import LeaderboardWidget from './LeaderboardWidget';
import StreakDisplay from './StreakDisplay';
import PointsHistory from './PointsHistory';

interface GamificationDashboardProps {
  className?: string;
}

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center">
      {icon} {title}
    </h2>
    {children}
  </div>
);

export default function GamificationDashboard({ className = '' }: GamificationDashboardProps) {
  const [dashboard, setDashboard] = useState<GamificationDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification/dashboard');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch dashboard');
      setDashboard(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">กำลังโหลด...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
         aria-label="Button">
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-gray-600">ไม่พบข้อมูล Gamification</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">🏆 ระบบ Gamification</h1>
        <p className="text-blue-100">สะสมคะแนน รับเหรียญ และแข่งขันกับเพื่อนๆ</p>
      </div>

      {/* Level and Points Display */}
      <LevelDisplay userStats={dashboard.user_stats} />

      {dashboard.user_stats.current_streaks.length > 0 && (
        <Section title="สตรีคของคุณ" icon="🔥">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboard.user_stats.current_streaks.map((streak) => (
              <StreakDisplay key={streak.id} streak={streak} />
            ))}
          </div>
        </Section>
      )}

      {dashboard.recent_badges.length > 0 && (
        <Section title="เหรียญล่าสุด" icon="🏅">
          <BadgeCollection badges={dashboard.recent_badges} showAll={false} />
        </Section>
      )}

      {dashboard.active_challenges.length > 0 && (
        <Section title="ความท้าทายที่กำลังทำ" icon="🎯">
          <ChallengeList challenges={dashboard.active_challenges} />
        </Section>
      )}

      {dashboard.leaderboards.length > 0 && (
        <Section title="ตารางคะแนน" icon="🏆">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard.leaderboards.map((leaderboard) => (
              <LeaderboardWidget key={leaderboard.leaderboard.id} leaderboard={leaderboard} />
            ))}
          </div>
        </Section>
      )}

      {dashboard.upcoming_events.length > 0 && (
        <Section title="กิจกรรมที่จะมาถึง" icon="📅">
          <ChallengeList challenges={dashboard.upcoming_events} />
        </Section>
      )}

      {dashboard.user_stats.recent_activities.length > 0 && (
        <Section title="กิจกรรมล่าสุด" icon="📊">
          <PointsHistory activities={dashboard.user_stats.recent_activities} />
        </Section>
      )}
    </div>
  );
}

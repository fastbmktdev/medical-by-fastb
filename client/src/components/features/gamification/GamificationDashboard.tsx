"use client";

import { useState, useEffect } from "react";
import { GamificationDashboard as GamificationDashboardType } from '@shared/types/gamification.types';
import LevelDisplay from "./LevelDisplay";
import BadgeCollection from "./BadgeCollection";
import ChallengeList from "./ChallengeList";
import LeaderboardWidget from "./LeaderboardWidget";
import StreakDisplay from "./StreakDisplay";
import PointsHistory from "./PointsHistory";
import Link from "next/link";
import { Skeleton } from "@/components/design-system/primitives/Skeleton";

interface GamificationDashboardProps {
  className?: string;
}

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <div className="bg-zinc-100/50 backdrop-blur-sm border border-zinc-800/50  shadow-md p-6">
    <h2 className="text-xl font-semibold mb-4 flex items-center text-zinc-950">
      {icon} {title}
    </h2>
    {children}
  </div>
);

export default function GamificationDashboard({
  className = "",
}: GamificationDashboardProps) {
  const [dashboard, setDashboard] = useState<GamificationDashboardType | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gamification/dashboard");
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Error fetching dashboard: Received non-JSON response', {
          status: response.status,
          contentType,
          preview: text.substring(0, 200)
        });
        setError('ไม่สามารถโหลดข้อมูล dashboard ได้ (Server error)');
        setDashboard(null);
        return;
      }

      const result = await response.json();
      
      if (!response.ok) {
        // Handle different error status codes
        let errorMessage = result.error || "ไม่สามารถโหลดข้อมูล dashboard ได้";
        
        if (response.status === 401) {
          errorMessage = "กรุณาเข้าสู่ระบบเพื่อดูข้อมูล dashboard";
        } else if (response.status === 500) {
          errorMessage = result.message 
            ? `เกิดข้อผิดพลาด: ${result.message}`
            : "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง";
        }
        
        console.error("Error fetching dashboard:", {
          status: response.status,
          error: result.error,
          message: result.message,
          stack: result.stack
        });
        
        throw new Error(errorMessage);
      }
      
      setDashboard(result.data);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูล dashboard ได้";
      console.error("Error fetching dashboard:", {
        error: err,
        message: errorMsg
      });
      setError(errorMsg);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header Skeleton */}
        <div className="bg-linear-to-r from-blue-900/80 to-purple-900/80  p-6 border border-blue-700/30 backdrop-blur-sm">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Level Display Skeleton */}
        <div className="bg-zinc-100/50 backdrop-blur-sm border border-zinc-800/50  p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-24" variant="circle" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-2 w-full max-w-lg" />
            </div>
          </div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-zinc-100/50 backdrop-blur-sm border border-zinc-800/50  p-6"
            >
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-950 mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-zinc-400 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="bg-blue-600 px-4 py-2  hover:bg-blue-700 transition-colors"
          aria-label="ลองโหลดข้อมูลใหม่"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <p className="text-zinc-400">ไม่พบข้อมูล Gamification</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-start">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 mb-2 bg-red-600 text-zinc-950  hover:bg-red-700 transition-colors font-normal min-h-9"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          กลับไปหน้า Dashboard
        </Link>
      </div>
      {/* Header */}
      <div className="bg-linear-to-r from-blue-900/80 to-purple-900/80  p-6 text-zinc-950 border border-blue-700/30 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold mb-2">🏆 ระบบ Gamification</h1>
        <p className="text-blue-200">
          สะสมคะแนน รับเหรียญ และแข่งขันกับเพื่อนๆ
        </p>
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
              <LeaderboardWidget
                key={leaderboard.leaderboard.id}
                leaderboard={leaderboard}
              />
            ))}
          </div>
        </Section>
      )}

      {dashboard.upcoming_challenges.length > 0 && (
        <Section title="กิจกรรมที่จะมาถึง" icon="📅">
          <ChallengeList challenges={dashboard.upcoming_challenges} />
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

"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, Progress } from "@heroui/react";
import { TrophyIcon, StarIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  points_required: number;
}

interface EarnedBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

interface BadgeWithProgress extends Badge {
  earned?: boolean;
  progress?: number;
}

export function AchievementsShowcase() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [allBadges, setAllBadges] = useState<BadgeWithProgress[]>([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await fetch("/api/users/achievements");
      const data = await response.json();

      if (data.success) {
        setEarnedBadges(data.data.earned_badges || []);
        setAllBadges(
          Array.isArray(data.data.all_badges)
            ? (data.data.all_badges as BadgeWithProgress[])
            : []
        );
        setCurrentPoints(data.data.current_points || 0);
        setCurrentLevel(data.data.current_level || 1);
      }
    } catch (error) {
      console.error("Failed to load achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse bg-zinc-900/50 h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-white">Achievements & Badges</h3>
        <div className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          <span className="text-white font-semibold">
            Level {currentLevel} • {currentPoints} Points
          </span>
        </div>
      </div>

      {/* Earned Badges */}
      <div>
        <h4 className="mb-3 font-medium text-white">
          Badges ที่ได้รับ ({earnedBadges.length})
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {earnedBadges.map((earned) => (
            <Card
              key={earned.id}
              className="bg-linear-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50"
            >
              <CardBody className="items-center justify-center text-center p-4">
                <div className="mb-2">
                  {earned.badges?.icon_url ? (
                    <Image
                      src={earned.badges.icon_url}
                      alt={earned.badges.name}
                      sizes='100%'
                      fill
                    />
                  ) : (
                    <TrophyIcon className="w-12 h-12 text-yellow-500" />
                  )}
                </div>
                <h5 className="font-semibold text-white text-sm">
                  {earned.badges?.name}
                </h5>
                <p className="text-zinc-400 text-xs mt-1">
                  {new Date(earned.earned_at).toLocaleDateString("th-TH")}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* All Badges with Progress */}
      <div>
        <h4 className="mb-3 font-medium text-white">Badges ทั้งหมด</h4>
        <div className="space-y-3">
          {allBadges.slice(0, 5).map((badge) => (
            <Card
              key={badge.id}
              className={`bg-zinc-950/50 border ${badge.earned ? "border-yellow-500/50" : "border-zinc-700"}`}
            >
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {badge.icon_url ? (
                      <Image
                        src={badge.icon_url}
                        alt={badge.name}
                        sizes='100%'
                        fill
                      />
                    ) : (
                      <TrophyIcon className="w-10 h-10 text-zinc-400" />
                    )}
                    <div>
                      <h5 className="font-semibold text-white">{badge.name}</h5>
                      <p className="text-zinc-400 text-xs">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  {badge.earned && (
                    <StarIcon className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                {!badge.earned && badge.points_required && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">ความคืบหน้า</span>
                      <span className="text-zinc-400">
                        {currentPoints} / {badge.points_required} Points
                      </span>
                    </div>
                    <Progress
                      value={badge.progress}
                      color="warning"
                      size="sm"
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

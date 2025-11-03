'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge, Badge } from '@/types/gamification.types';
import { 
  GamificationCard, 
  GamificationLoadingState, 
  GamificationEmptyState
} from './shared';

interface BadgeCollectionProps {
  badges: UserBadge[];
  showAll?: boolean;
  className?: string;
}

export default function BadgeCollection({ badges, showAll = true, className = '' }: BadgeCollectionProps) {
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'earned' | 'available'>('all');

  useEffect(() => {
    if (showAll) {
      fetchAllBadges();
    }
  }, [showAll]);

  const fetchAllBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gamification/badges?type=all');
      const result = await response.json();

      if (response.ok) {
        setAllBadges(result.data);
      }
    } catch (error) {
      // Error fetching badges
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking': return '📅';
      case 'loyalty': return '❤️';
      case 'social': return '👥';
      case 'learning': return '📚';
      case 'special': return '⭐';
      default: return '🏅';
    }
  };

  const earnedBadgeIds = new Set(badges.map(b => b.badge_id));

  const filteredBadges = showAll ? allBadges.filter(badge => {
    if (filter === 'earned') return earnedBadgeIds.has(badge.id);
    if (filter === 'available') return !earnedBadgeIds.has(badge.id);
    return true;
  }) : badges.map(b => b.badge).filter(Boolean) as Badge[];

  if (loading) {
    return <GamificationLoadingState message="กำลังโหลดเหรียญ..." className={className} />;
  }

  return (
    <div className={className}>
      {showAll && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setFilter('earned')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'earned' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ได้รับแล้ว
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === 'available' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ยังไม่ได้รับ
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const earnedAt = badges.find(b => b.badge_id === badge.id)?.earned_at;
          // Calculate display properties directly instead of using hook in callback
          const rarityColorClass = badge.rarity === 'common' ? 'bg-gray-100 text-gray-800' : 
                                   badge.rarity === 'rare' ? 'bg-blue-100 text-blue-800' : 
                                   badge.rarity === 'epic' ? 'bg-purple-100 text-purple-800' : 
                                   'bg-yellow-100 text-yellow-800';
          const rarityIcon = badge.rarity === 'common' ? '🥉' : badge.rarity === 'rare' ? '🥈' : badge.rarity === 'epic' ? '🥇' : '💎';
          const formattedEarnedDate = earnedAt ? new Date(earnedAt).toLocaleDateString('th-TH') : null;
          
          return (
            <GamificationCard
              key={badge.id}
              variant={isEarned ? 'bordered' : 'default'}
              className={`relative ${
                isEarned 
                  ? 'border-green-300 bg-green-50' 
                  : 'hover:border-blue-300'
              }`}
            >
              {/* Badge Icon */}
              <div className="text-center mb-3">
                <div className="text-4xl mb-2">
                  {badge.icon_url ? (
                    <img 
                      src={badge.icon_url} 
                      alt={badge.name}
                      className="w-12 h-12 mx-auto object-contain"
                    />
                  ) : (
                    getCategoryIcon(badge.category)
                  )}
                </div>
                
                {/* Rarity Badge */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rarityColorClass}`}>
                  {rarityIcon} {badge.rarity}
                </div>
              </div>

              {/* Badge Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {badge.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {badge.description}
                </p>
                
                {/* Points Required */}
                <div className="text-xs text-gray-500 mb-2">
                  ต้องการ {badge.points_required} คะแนน
                </div>

                {/* Earned Status */}
                {isEarned && formattedEarnedDate && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    ได้รับเมื่อ {formattedEarnedDate}
                  </div>
                )}
              </div>

              {/* Earned Overlay */}
              {isEarned && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </GamificationCard>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <GamificationEmptyState 
          type="badges" 
          message="ไม่พบเหรียญที่ตรงกับเงื่อนไข"
        />
      )}
    </div>
  );
}

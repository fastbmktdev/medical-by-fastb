'use client';

import React, { useState, useEffect } from 'react';
import { UserBadge, Badge } from '@/types/gamification.types';

interface BadgeCollectionProps {
  badges: UserBadge[];
  showAll?: boolean;
  className?: string;
}

export function BadgeCollection({ badges, showAll = true, className = '' }: BadgeCollectionProps) {
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
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return '🥉';
      case 'rare': return '🥈';
      case 'epic': return '🥇';
      case 'legendary': return '💎';
      default: return '🏅';
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
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">กำลังโหลดเหรียญ...</span>
      </div>
    );
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
          
          return (
            <div
              key={badge.id}
              className={`relative bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-lg ${
                isEarned 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 hover:border-blue-300'
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
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                  {getRarityIcon(badge.rarity)} {badge.rarity}
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
                {isEarned && earnedAt && (
                  <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    ได้รับเมื่อ {new Date(earnedAt).toLocaleDateString('th-TH')}
                  </div>
                )}
              </div>

              {/* Earned Overlay */}
              {isEarned && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🏅</div>
          <p>ไม่พบเหรียญที่ตรงกับเงื่อนไข</p>
        </div>
      )}
    </div>
  );
}

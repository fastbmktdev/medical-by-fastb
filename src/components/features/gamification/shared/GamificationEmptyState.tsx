'use client';

import React from 'react';
import { GamificationIcon } from './GamificationIcon';

interface GamificationEmptyStateProps {
  type: 'badges' | 'challenges' | 'streaks' | 'leaderboard' | 'activities' | 'general';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function GamificationEmptyState({ 
  type, 
  title,
  message,
  action,
  className = ''
}: GamificationEmptyStateProps) {
  const getDefaultContent = () => {
    switch (type) {
      case 'badges':
        return {
          icon: 'badge' as const,
          title: title || 'ไม่พบเหรียญ',
          message: message || 'ยังไม่มีเหรียญที่ได้รับ เริ่มทำกิจกรรมเพื่อรับเหรียญแรกของคุณ!'
        };
      case 'challenges':
        return {
          icon: 'challenge' as const,
          title: title || 'ไม่มีความท้าทาย',
          message: message || 'ไม่มีความท้าทายในขณะนี้ กลับมาดูใหม่ในภายหลัง'
        };
      case 'streaks':
        return {
          icon: 'streak' as const,
          title: title || 'ไม่มีสตรีค',
          message: message || 'เริ่มต้นสตรีคใหม่วันนี้!'
        };
      case 'leaderboard':
        return {
          icon: 'leaderboard' as const,
          title: title || 'ไม่มีข้อมูลตารางคะแนน',
          message: message || 'ยังไม่มีข้อมูลในตารางคะแนนนี้'
        };
      case 'activities':
        return {
          icon: 'points' as const,
          title: title || 'ไม่มีกิจกรรม',
          message: message || 'ยังไม่มีกิจกรรมล่าสุด'
        };
      default:
        return {
          icon: 'points' as const,
          title: title || 'ไม่พบข้อมูล',
          message: message || 'ไม่มีข้อมูลที่จะแสดง'
        };
    }
  };

  const content = getDefaultContent();

  return (
    <div className={`text-center py-8 text-zinc-500 ${className}`}>
      <div className="mb-4">
        <GamificationIcon type={content.icon} size="xl" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">
        {content.title}
      </h3>
      <p className="text-zinc-400 mb-4 max-w-md mx-auto">
        {content.message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
         aria-label="Button">
          {action.label}
        </button>
      )}
    </div>
  );
}
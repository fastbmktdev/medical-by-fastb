'use client';

import React, { useState, useEffect } from 'react';
import { PointsAwardResponse } from '@shared/types/gamification.types';

interface GamificationNotificationProps {
  className?: string;
}

interface Notification {
  id: string;
  type: 'points' | 'badge' | 'level' | 'streak';
  title: string;
  message: string;
  points?: number;
  badge?: string;
  level?: number;
  show: boolean;
}

export default function GamificationNotification({ className = '' }: GamificationNotificationProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for gamification events
  useEffect(() => {
    const handleGamificationEvent = (event: CustomEvent) => {
      const { type, data } = event.detail;
      
      let notification: Notification;

      switch (type) {
        case 'points_awarded':
          const pointsData = data as PointsAwardResponse;
          notification = {
            id: `points-${Date.now()}`,
            type: 'points',
            title: 'ได้รับคะแนน!',
            message: pointsData.message,
            points: pointsData.points_awarded,
            show: true,
          };
          break;

        case 'badge_earned':
          notification = {
            id: `badge-${Date.now()}`,
            type: 'badge',
            title: 'ได้รับเหรียญใหม่!',
            message: `คุณได้รับเหรียญ: ${data.badge_name}`,
            badge: data.badge_name,
            show: true,
          };
          break;

        case 'level_up':
          notification = {
            id: `level-${Date.now()}`,
            type: 'level',
            title: 'เลื่อนระดับ!',
            message: `ยินดีด้วย! คุณขึ้นไประดับ ${data.new_level} แล้ว`,
            level: data.new_level,
            show: true,
          };
          break;

        case 'streak_bonus':
          notification = {
            id: `streak-${Date.now()}`,
            type: 'streak',
            title: 'โบนัสสตรีค!',
            message: `สตรีค ${data.streak_type} ${data.current_streak} วัน - ได้รับโบนัส ${data.bonus_points} คะแนน`,
            show: true,
          };
          break;

        default:
          return;
      }

      setNotifications(prev => [...prev, notification]);

      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, show: false } : n)
        );
        
        // Remove notification after animation
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 500);
      }, 5000);
    };

    // Listen for custom gamification events
    window.addEventListener('gamification-event', handleGamificationEvent as EventListener);

    return () => {
      window.removeEventListener('gamification-event', handleGamificationEvent as EventListener);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'points': return '🏆';
      case 'badge': return '🏅';
      case 'level': return '⭐';
      case 'streak': return '🔥';
      default: return '🎉';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'points': return 'bg-blue-500';
      case 'badge': return 'bg-yellow-500';
      case 'level': return 'bg-purple-500';
      case 'streak': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, show: false } : n)
    );
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 500);
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`transform transition-all duration-500 ease-in-out ${
            notification.show 
              ? 'translate-x-0 opacity-100' 
              : 'translate-x-full opacity-0'
          }`}
        >
          <div className={`${getNotificationColor(notification.type)}  shadow-lg p-4 max-w-sm`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">
                    {notification.title}
                  </h4>
                  <p className="text-sm opacity-90">
                    {notification.message}
                  </p>
                  {notification.points && (
                    <div className="text-xs mt-1 opacity-75">
                      +{notification.points} คะแนน
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => dismissNotification(notification.id)}
                className=" hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper function to trigger gamification events
export function triggerGamificationEvent(type: string, data: Record<string, unknown>) {
  const event = new CustomEvent('gamification-event', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
}

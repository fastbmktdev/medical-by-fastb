'use client';

import React from 'react';
import { PointsHistory as PointsHistoryType } from '@shared/types/gamification.types';
import { 
  GamificationEmptyState,
  getActionIcon,
  getActionTitle,
  getActionColor,
  formatRelativeDate
} from './shared';

interface PointsHistoryProps {
  activities: PointsHistoryType[];
  className?: string;
}

export default function PointsHistory({ activities, className = '' }: PointsHistoryProps) {
  // Map PointsHistoryType to the format expected by usePointsHistoryDisplay
  // const mappedActivities: Array<{ action_type: string; points: number; created_at: string; [key: string]: unknown }> = activities.map(a => ({
  //   action_type: a.action_type,
  //   points: a.points,
  //   created_at: a.created_at
  // }));
  // const displayActivities = usePointsHistoryDisplay(mappedActivities);

  if (activities.length === 0) {
    return <GamificationEmptyState type="activities" className={className} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-3 bg-zinc-900/50  hover:bg-zinc-800/50 transition-colors border border-zinc-800/50"
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {getActionIcon(activity.action_type)}
            </div>
            
            <div>
              <div className="font-medium text-zinc-950">
                {getActionTitle(activity.action_type)}
              </div>
              {activity.action_description && (
                <div className="text-sm text-zinc-400">
                  {activity.action_description}
                </div>
              )}
              <div className="text-xs text-zinc-500">
                {formatRelativeDate(activity.created_at)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1  text-sm font-medium ${getActionColor(activity.action_type)}`}>
              {activity.points > 0 ? '+' : ''}{activity.points}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

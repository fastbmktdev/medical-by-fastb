'use client';

import React from 'react';

interface GamificationProgressBarProps {
  progress: number; // 0-100
  variant?: 'default' | 'gradient' | 'streak' | 'level';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function GamificationProgressBar({ 
  progress, 
  variant = 'default',
  size = 'md',
  showPercentage = false,
  label,
  className = ''
}: GamificationProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const getBarClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-linear-to-r from-blue-500 to-purple-500';
      case 'streak':
        return 'bg-linear-to-r from-orange-400 to-red-500';
      case 'level':
        return 'bg-linear-to-r from-green-400 to-blue-500';
      default:
        return 'bg-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-1';
      case 'lg':
        return 'h-4';
      default:
        return 'h-2';
    }
  };

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm text-zinc-400 mb-1">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      
      <div className={`w-full bg-zinc-800  ${getSizeClasses()}`}>
        <div
          className={`${getSizeClasses()}  transition-all duration-500 ${getBarClasses()}`}
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
    </div>
  );
}
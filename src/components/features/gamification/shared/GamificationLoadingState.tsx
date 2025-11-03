'use client';

import React from 'react';

interface GamificationLoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'pulse';
  className?: string;
}

export function GamificationLoadingState({ 
  message = 'กำลังโหลด...', 
  variant = 'spinner',
  className = ''
}: GamificationLoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-zinc-800 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-zinc-800 rounded w-full"></div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-pulse">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-zinc-400">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-zinc-300">{message}</span>
    </div>
  );
}
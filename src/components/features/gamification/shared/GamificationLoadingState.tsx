'use client';

import React from 'react';
import { Skeleton } from '@/components/design-system/primitives/Skeleton';

interface GamificationLoadingStateProps {
  message?: string;
  variant?: 'skeleton' | 'pulse' | 'card';
  className?: string;
}

export function GamificationLoadingState({
  message: _message = 'กำลังโหลด...',
  variant = 'skeleton',
  className = ''
}: GamificationLoadingStateProps) {
  if (variant === 'card') {
    return (
      <div className={`bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg p-6 ${className}`}>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-pulse text-center">
          <div className="text-4xl mb-2">🏆</div>
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Default skeleton variant
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}
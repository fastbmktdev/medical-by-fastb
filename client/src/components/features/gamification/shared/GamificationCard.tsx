'use client';

import React from 'react';

interface GamificationCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'bordered' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function GamificationCard({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  loading = false
}: GamificationCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-linear-to-br from-blue-950/50 to-purple-950/50 border border-blue-700/30';
      case 'bordered':
        return 'bg-zinc-100/50 border-2 border-zinc-700 hover:border-blue-600/50 backdrop-blur-sm';
      case 'elevated':
        return 'bg-zinc-100/50 shadow-lg border border-zinc-800/50 hover:shadow-xl backdrop-blur-sm';
      default:
        return 'bg-zinc-100/50 border border-zinc-800/50 hover:shadow-md backdrop-blur-sm';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-3 ';
      case 'lg':
        return 'p-6 ';
      default:
        return 'p-4 ';
    }
  };

  if (loading) {
    return (
      <div className={`${getVariantClasses()} ${getSizeClasses()} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-800  w-1/2 mb-2"></div>
          <div className="h-3 bg-zinc-800  w-3/4 mb-2"></div>
          <div className="h-8 bg-zinc-800  w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${getVariantClasses()} ${getSizeClasses()} transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}
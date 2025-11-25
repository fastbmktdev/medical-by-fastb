"use client";

import React from "react";
import { cn } from '@shared/lib/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton
   */
  width?: string | number;
  /**
   * Height of the skeleton
   */
  height?: string | number;
  /**
   * Border radius variant
   */
  variant?: "default" | "" | "circle" | "none";
  /**
   * Animation type
   */
  animation?: "pulse" | "wave" | "none";
}

/**
 * Base Skeleton component for loading states
 */
export function Skeleton({
  className,
  width,
  height,
  variant = "default",
  animation = "pulse",
  style,
  ...props
}: SkeletonProps): React.ReactElement {
  const variantClasses = {
    default: "",
    "": "",
    circle: "rounded-full",
    none: "",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]",
    none: "",
  };

  return (
    <div
      className={cn(
        "bg-gray-200",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Skeleton Card component for loading card layouts
 */
export function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        " border border-gray-300 bg-gray-100 p-6 space-y-4",
        className
      )}
      {...props}
    >
      {/* Image placeholder */}
      <Skeleton className="w-full h-48 mb-4" variant="default" />
      
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Description lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      
      {/* Footer actions */}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" variant="default" />
        <Skeleton className="h-10 w-24" variant="default" />
      </div>
    </div>
  );
}

/**
 * Skeleton Table component for loading table layouts
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rows?: number; columns?: number }) {
  return (
    <div
      className={cn("w-full space-y-3", className)}
      {...props}
    >
      {/* Table header */}
      <div className="flex gap-4 pb-3 border-b border-gray-300">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`header-${i}`}
            className="h-5 flex-1"
            width={i === 0 ? "40%" : undefined}
          />
        ))}
      </div>
      
      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className="h-4 flex-1"
                width={colIndex === 0 ? "40%" : undefined}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton List component for loading list layouts
 */
export function SkeletonList({
  items = 5,
  className,
  showAvatar = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { items?: number; showAvatar?: boolean }) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={`list-item-${i}`} className="flex gap-4 items-start">
          {/* Avatar */}
          {showAvatar && (
            <Skeleton className="w-10 h-10 shrink-0" variant="circle" />
          )}
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton Text component for loading text lines
 */
export function SkeletonText({
  lines = 3,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={`text-${i}`}
          className="h-4"
          width={i === lines - 1 ? "80%" : "100%"}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Avatar component
 */
export function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      variant="circle"
      {...props}
    />
  );
}

/**
 * Skeleton Button component
 */
export function SkeletonButton({
  size = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };

  return (
    <Skeleton
      className={cn(sizeClasses[size], className)}
      variant="default"
      {...props}
    />
  );
}

/**
 * Skeleton Form component
 */
export function SkeletonForm({
  fields = 4,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { fields?: number }) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          {/* Label */}
          <Skeleton className="h-4 w-24" />
          {/* Input */}
          <Skeleton className="h-10 w-full" variant="default" />
        </div>
      ))}
      
      {/* Submit button */}
      <div className="flex gap-2 pt-4">
        <SkeletonButton size="lg" />
        <SkeletonButton size="lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton Dashboard Grid - Common dashboard layout
 */
export function SkeletonDashboard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`stat-${i}`}
            className=" border border-gray-300 bg-gray-100 p-4 space-y-2"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large section */}
        <div className="lg:col-span-2">
          <SkeletonCard />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}


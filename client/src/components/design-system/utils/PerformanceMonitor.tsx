'use client';

import { useEffect, useState, ReactNode } from 'react';

interface PerformanceMonitorProps {
  children: ReactNode;
  name?: string;
  enabled?: boolean;
}

/**
 * Performance monitoring wrapper component
 */
export function PerformanceMonitor({
  children,
  name = 'Component',
  enabled = process.env.NODE_ENV === 'development',
}: PerformanceMonitorProps) {
  const [renderTime, setRenderTime] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    
    // Use requestAnimationFrame to measure after render
    const measureRender = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setRenderTime(duration);
      
      if (duration > 16) { // More than one frame (60fps)
        console.warn(`⚠️ Slow render detected in ${name}: ${duration.toFixed(2)}ms`);
      }
    };

    requestAnimationFrame(measureRender);
  }, [enabled, name]);

  useEffect(() => {
    if (!enabled || renderTime === null) return;

    console.log(`⚡ ${name} render time: ${renderTime.toFixed(2)}ms`);
  }, [enabled, name, renderTime]);

  return <>{children}</>;
}

/**
 * HOC for performance monitoring
 */
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
) {
  const WrappedComponent = (props: P) => (
    <PerformanceMonitor name={name || Component.displayName || Component.name}>
      <Component {...props} />
    </PerformanceMonitor>
  );

  WrappedComponent.displayName = `withPerformanceMonitor(${name || Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
/**
 * Performance Optimization Utilities
 * 
 * Utilities for optimizing component performance and re-rendering.
 */

import React, { memo, useMemo, useCallback, useState, useEffect, useRef, DependencyList } from 'react';

/**
 * Enhanced memo with better display name handling
 */
export function createMemoComponent<T extends React.ComponentType<Record<string, unknown>>>(
  Component: T,
  displayName?: string,
  areEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean
): T {
  const MemoComponent = memo(Component as React.FunctionComponent<React.ComponentProps<T>>, areEqual) as unknown as T;
  
  if (displayName) {
    MemoComponent.displayName = `Memo(${displayName})`;
  } else if (Component.displayName || Component.name) {
    MemoComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  }
  
  return MemoComponent;
}

/**
 * Stable callback hook that doesn't change reference unless dependencies change
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Stable value hook that only recalculates when dependencies change
 */
export function useStableValue<T>(
  factory: () => T,
  deps: DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Debounced value hook for performance optimization
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      options
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

/**
 * Performance monitoring utilities
 */
export const performance = {
  /**
   * Mark the start of a performance measurement
   */
  mark: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  },

  /**
   * Mark the end of a performance measurement and log the duration
   */
  measure: (name: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = window.performance.getEntriesByName(name)[0];
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    }
  },

  /**
   * Wrap a component with performance monitoring
   */
  monitor<T extends React.ComponentType<Record<string, unknown>>>(
    Component: T,
    name?: string
  ): T {
    const componentName = name || Component.displayName || Component.name || 'Component';
    
    const MonitoredComponent = (props: React.ComponentProps<T>) => {
      useEffect(() => {
        performance.mark(`${componentName}-render`);
        return () => {
          performance.measure(`${componentName}-render`);
        };
      });

      return React.createElement(Component, props as unknown as React.ComponentProps<T>);
    };

    MonitoredComponent.displayName = `Monitored(${componentName})`;
    return MonitoredComponent as T;
  }
};


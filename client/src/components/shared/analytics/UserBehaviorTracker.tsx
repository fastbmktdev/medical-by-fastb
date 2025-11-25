"use client";

/**
 * User Behavior Tracker Component
 * 
 * Prepares infrastructure for third-party user behavior tracking tools
 * like Hotjar, Crazy Egg, or similar services.
 * 
 * This component can be extended to integrate with:
 * - Hotjar (heatmaps, session recordings, surveys)
 * - Crazy Egg (heatmaps, A/B testing)
 * - FullStory (session replay)
 * - LogRocket (session replay, error tracking)
 */

import { useEffect } from 'react';
import { trackScrollDepth, trackTimeOnPage } from '@shared/lib/utils/click-tracking';

interface UserBehaviorTrackerProps {
  /**
   * Enable Hotjar integration
   */
  enableHotjar?: boolean;
  hotjarId?: string;

  /**
   * Enable Crazy Egg integration
   */
  enableCrazyEgg?: boolean;
  crazyEggId?: string;

  /**
   * Enable scroll depth tracking
   */
  enableScrollTracking?: boolean;

  /**
   * Enable time on page tracking
   */
  enableTimeTracking?: boolean;

  /**
   * Page path for tracking
   */
  pagePath?: string;
}

/**
 * User Behavior Tracker Component
 * 
 * Tracks user behavior including scroll depth, time on page,
 * and prepares infrastructure for third-party tools.
 */
export function UserBehaviorTracker({
  enableHotjar = false,
  hotjarId,
  enableCrazyEgg = false,
  crazyEggId,
  enableScrollTracking = true,
  enableTimeTracking = true,
  pagePath,
}: UserBehaviorTrackerProps) {
  useEffect(() => {
    // Initialize Hotjar if enabled
    if (enableHotjar && hotjarId && typeof window !== 'undefined') {
      const hotjarWindow = window as typeof window & {
        hj?: ((...args: unknown[]) => void) & { q?: unknown[][] };
        _hjSettings?: { hjid: number; hjsv: number };
      };

      hotjarWindow.hj =
        hotjarWindow.hj ||
        function (...args: unknown[]) {
          (hotjarWindow.hj!.q = hotjarWindow.hj!.q || []).push(args);
        };

      hotjarWindow._hjSettings = {
        hjid: parseInt(hotjarId, 10),
        hjsv: 6,
      };

      const head = document.getElementsByTagName('head')[0];
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://static.hotjar.com/c/hotjar-${hotjarWindow._hjSettings.hjid}.js?sv=${hotjarWindow._hjSettings.hjsv}`;
      head.appendChild(script);
    }

    // Initialize Crazy Egg if enabled
    if (enableCrazyEgg && crazyEggId && typeof window !== 'undefined') {
      (function() {
        const ce = document.createElement('script');
        ce.type = 'text/javascript';
        ce.async = true;
        ce.src = `https://script.crazyegg.com/pages/scripts/${crazyEggId}.js`;
        const s = document.getElementsByTagName('script')[0];
        s.parentNode?.insertBefore(ce, s);
      })();
    }
  }, [enableHotjar, hotjarId, enableCrazyEgg, crazyEggId]);

  // Scroll depth tracking
  useEffect(() => {
    if (!enableScrollTracking || typeof window === 'undefined') return;

    let maxScroll = 0;
    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track milestones: 25%, 50%, 75%, 100%
      if (scrollPercent >= 25 && maxScroll < 25) {
        trackScrollDepth(25, pagePath);
        maxScroll = 25;
      } else if (scrollPercent >= 50 && maxScroll < 50) {
        trackScrollDepth(50, pagePath);
        maxScroll = 50;
      } else if (scrollPercent >= 75 && maxScroll < 75) {
        trackScrollDepth(75, pagePath);
        maxScroll = 75;
      } else if (scrollPercent >= 100 && maxScroll < 100) {
        trackScrollDepth(100, pagePath);
        maxScroll = 100;
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
    return () => window.removeEventListener('scroll', trackScroll);
  }, [enableScrollTracking, pagePath]);

  // Time on page tracking
  useEffect(() => {
    if (!enableTimeTracking || typeof window === 'undefined') return;

    const startTime = Date.now();
    const path = pagePath || window.location.pathname;

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 0) {
        trackTimeOnPage(timeSpent, path);
      }
    };
  }, [enableTimeTracking, pagePath]);

  return null; // This component doesn't render anything
}

/**
 * Hook for user behavior tracking
 */
export function useUserBehaviorTracking(options?: {
  enableScrollTracking?: boolean;
  enableTimeTracking?: boolean;
  pagePath?: string;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const {
      enableScrollTracking = true,
      enableTimeTracking = true,
      pagePath,
    } = options || {};

    // Scroll tracking
    if (enableScrollTracking) {
      let maxScroll = 0;
      const trackScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);

        if (scrollPercent >= 25 && maxScroll < 25) {
          trackScrollDepth(25, pagePath);
          maxScroll = 25;
        } else if (scrollPercent >= 50 && maxScroll < 50) {
          trackScrollDepth(50, pagePath);
          maxScroll = 50;
        } else if (scrollPercent >= 75 && maxScroll < 75) {
          trackScrollDepth(75, pagePath);
          maxScroll = 75;
        } else if (scrollPercent >= 100 && maxScroll < 100) {
          trackScrollDepth(100, pagePath);
          maxScroll = 100;
        }
      };

      window.addEventListener('scroll', trackScroll, { passive: true });
      return () => window.removeEventListener('scroll', trackScroll);
    }

    // Time tracking
    if (enableTimeTracking) {
      const startTime = Date.now();
      const path = pagePath || window.location.pathname;

      return () => {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        if (timeSpent > 0) {
          trackTimeOnPage(timeSpent, path);
        }
      };
    }
  }, [options]);
}

export default UserBehaviorTracker;


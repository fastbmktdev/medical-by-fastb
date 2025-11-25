"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@shared/lib/utils/analytics';

/**
 * Hook to track page views automatically
 * 
 * Usage: Add `usePageView()` to any page component
 * 
 * Note: Only tracks pathname to avoid Suspense boundary issues with useSearchParams
 */
export function usePageView() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view with pathname only
    // Query params are tracked by GA automatically via page_path
    trackPageView(pathname);
  }, [pathname]);
}
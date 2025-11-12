"use client";

import { createElement } from 'react';
import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';

/**
 * Google Analytics Component
 * 
 * This component loads Google Analytics script using Next.js third-parties.
 * Make sure to set NEXT_PUBLIC_GA_MEASUREMENT_ID in your environment variables.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    // Don't render anything if GA ID is not configured
    console.warn('Google Analytics: NEXT_PUBLIC_GA_MEASUREMENT_ID is not set');
    return null;
  }

  return createElement(NextGoogleAnalytics, { gaId });
}


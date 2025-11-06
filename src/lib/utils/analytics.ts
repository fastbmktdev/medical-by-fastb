/**
 * Google Analytics Utility Functions
 * 
 * This file provides utility functions for tracking events with Google Analytics.
 * Uses gtag for tracking page views, events, and conversions.
 */

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'set',
      targetId: string | Date | Record<string, unknown>,
      config?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Track page view
 * @param url - The URL of the page
 * @param title - Optional page title
 */
export function trackPageView(url: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
    page_path: url,
    page_title: title,
  });
}

/**
 * Track custom event
 * @param eventName - Name of the event
 * @param eventParams - Optional event parameters
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, eventParams);
}

/**
 * Track conversion event
 * @param conversionId - Google Ads conversion ID (optional)
 * @param value - Conversion value (optional)
 * @param currency - Currency code (default: 'THB')
 */
export function trackConversion(
  conversionId?: string,
  value?: number,
  currency: string = 'THB'
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const params: Record<string, unknown> = {
    send_to: conversionId || process.env.NEXT_PUBLIC_GA_CONVERSION_ID,
  };

  if (value !== undefined) {
    params.value = value;
    params.currency = currency;
  }

  window.gtag('event', 'conversion', params);
}

/**
 * Track booking completion
 * @param bookingId - Booking ID
 * @param gymId - Gym ID
 * @param packageId - Package ID
 * @param amount - Booking amount
 */
export function trackBookingCompletion(
  bookingId: string,
  gymId: string,
  packageId: string,
  amount: number
): void {
  trackEvent('booking_completed', {
    booking_id: bookingId,
    gym_id: gymId,
    package_id: packageId,
    value: amount,
    currency: 'THB',
  });
}

/**
 * Track payment success
 * @param paymentId - Payment ID
 * @param amount - Payment amount
 * @param bookingId - Associated booking ID (optional)
 */
export function trackPaymentSuccess(
  paymentId: string,
  amount: number,
  bookingId?: string
): void {
  trackEvent('payment_success', {
    payment_id: paymentId,
    value: amount,
    currency: 'THB',
    booking_id: bookingId,
  });

  // Track as conversion
  trackConversion(undefined, amount, 'THB');
}

/**
 * Track user signup
 * @param userId - User ID
 * @param method - Signup method (email, google, etc.)
 */
export function trackUserSignup(userId: string, method: string = 'email'): void {
  trackEvent('sign_up', {
    user_id: userId,
    method: method,
  });
}

/**
 * Track user login
 * @param userId - User ID
 * @param method - Login method (email, google, etc.)
 */
export function trackUserLogin(userId: string, method: string = 'email'): void {
  trackEvent('login', {
    user_id: userId,
    method: method,
  });
}

/**
 * Track search event
 * @param searchTerm - The search query
 * @param category - Search category (gyms, events, shop, etc.)
 * @param resultCount - Number of results (optional)
 */
export function trackSearch(
  searchTerm: string,
  category?: string,
  resultCount?: number
): void {
  trackEvent('search', {
    search_term: searchTerm,
    search_category: category || 'all',
    result_count: resultCount,
  });
}

/**
 * Track product view
 * @param productId - Product ID
 * @param productName - Product name
 * @param category - Product category
 * @param price - Product price
 */
export function trackProductView(
  productId: string,
  productName: string,
  category?: string,
  price?: number
): void {
  trackEvent('view_item', {
    item_id: productId,
    item_name: productName,
    item_category: category,
    value: price,
    currency: 'THB',
  });
}

/**
 * Check if Google Analytics is available
 */
export function isAnalyticsAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}


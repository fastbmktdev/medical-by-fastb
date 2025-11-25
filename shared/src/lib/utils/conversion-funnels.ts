/**
 * Conversion Funnel Tracking Utilities
 * 
 * Provides utilities for tracking user journeys through conversion funnels,
 * analyzing drop-off points, and measuring conversion rates.
 */

import { trackEvent } from './analytics';

/**
 * Funnel step names
 */
export type FunnelStep = 
  | 'view_page'
  | 'view_product'
  | 'add_to_cart'
  | 'start_checkout'
  | 'enter_payment'
  | 'complete_purchase'
  | 'signup'
  | 'login'
  | 'book_class'
  | 'complete_booking';

/**
 * Track funnel step entry
 */
export function trackFunnelStep(
  funnelName: string,
  step: FunnelStep,
  stepNumber: number,
  totalSteps: number,
  userId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('funnel_step', {
    funnel_name: funnelName,
    step: step,
    step_number: stepNumber,
    total_steps: totalSteps,
    progress_percentage: Math.round((stepNumber / totalSteps) * 100),
    user_id: userId,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track funnel completion
 */
export function trackFunnelCompletion(
  funnelName: string,
  totalSteps: number,
  timeToComplete?: number,
  userId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('funnel_completion', {
    funnel_name: funnelName,
    total_steps: totalSteps,
    time_to_complete: timeToComplete,
    user_id: userId,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track funnel abandonment
 */
export function trackFunnelAbandonment(
  funnelName: string,
  step: FunnelStep,
  stepNumber: number,
  timeSpent?: number,
  userId?: string,
  reason?: string,
  additionalData?: Record<string, unknown>
): void {
  trackEvent('funnel_abandonment', {
    funnel_name: funnelName,
    abandoned_at_step: step,
    step_number: stepNumber,
    time_spent: timeSpent,
    user_id: userId,
    reason: reason,
    location: typeof window !== 'undefined' ? window.location.pathname : undefined,
    ...additionalData,
  });
}

/**
 * Track appointment funnel
 */
export function trackBookingFunnel(
  step: 'view_hospital' | 'view_package' | 'select_date' | 'enter_details' | 'payment' | 'complete',
  stepNumber: number,
  hospitalId?: string,
  packageId?: string,
  userId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackFunnelStep(
    'appointment',
    step === 'view_hospital' ? 'view_page' :
    step === 'view_package' ? 'view_product' :
    step === 'select_date' ? 'start_checkout' :
    step === 'enter_details' ? 'start_checkout' :
    step === 'payment' ? 'enter_payment' :
    'complete_booking',
    stepNumber,
    6,
    userId,
    {
      hospital_id: hospitalId,
      package_id: packageId,
      ...additionalData,
    }
  );
}

/**
 * Track purchase funnel
 */
export function trackPurchaseFunnel(
  step: 'view_product' | 'add_to_cart' | 'view_cart' | 'checkout' | 'payment' | 'complete',
  stepNumber: number,
  productId?: string,
  cartValue?: number,
  userId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackFunnelStep(
    'purchase',
    step === 'view_product' ? 'view_product' :
    step === 'add_to_cart' ? 'add_to_cart' :
    step === 'view_cart' ? 'start_checkout' :
    step === 'checkout' ? 'start_checkout' :
    step === 'payment' ? 'enter_payment' :
    'complete_purchase',
    stepNumber,
    6,
    userId,
    {
      product_id: productId,
      cart_value: cartValue,
      ...additionalData,
    }
  );
}

/**
 * Track signup funnel
 */
export function trackSignupFunnel(
  step: 'landing' | 'form' | 'verification' | 'complete',
  stepNumber: number,
  method?: string,
  userId?: string,
  additionalData?: Record<string, unknown>
): void {
  trackFunnelStep(
    'signup',
    step === 'landing' ? 'view_page' :
    step === 'form' ? 'signup' :
    step === 'verification' ? 'signup' :
    'signup',
    stepNumber,
    4,
    userId,
    {
      signup_method: method,
      ...additionalData,
    }
  );
}

/**
 * Calculate funnel conversion rate
 */
export function calculateConversionRate(
  completedCount: number,
  startedCount: number
): number {
  if (startedCount === 0) return 0;
  return (completedCount / startedCount) * 100;
}

/**
 * Calculate drop-off rate
 */
export function calculateDropOffRate(
  stepCount: number,
  previousStepCount: number
): number {
  if (previousStepCount === 0) return 0;
  return ((previousStepCount - stepCount) / previousStepCount) * 100;
}


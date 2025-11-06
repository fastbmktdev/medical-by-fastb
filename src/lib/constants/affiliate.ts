/**
 * Affiliate Commission Rate Configuration
 * 
 * Commission rates are now stored in the database (affiliate_commission_rates table)
 * for flexibility and admin management.
 * 
 * Fallback constants are provided for backward compatibility and initial setup.
 */

// Fallback rates (used if database is unavailable or during initial migration)
export const AFFILIATE_COMMISSION_RATES_FALLBACK = {
  signup: 0, // No commission for signup (or 5% if you want to reward signups)
  booking: 10, // 10% commission on bookings
  product_purchase: 5, // 5% commission on product purchases
  event_ticket_purchase: 10, // 10% commission on event tickets
  subscription: 15, // 15% commission on subscriptions
  referral: 0, // Legacy referral (no commission, just points)
} as const;

export type ConversionType = 
  | 'signup'
  | 'booking'
  | 'product_purchase'
  | 'event_ticket_purchase'
  | 'subscription'
  | 'referral';

// Cache for commission rates (refreshed every 5 minutes)
let commissionRatesCache: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate commission amount based on conversion value and rate
 */
export function calculateCommissionAmount(
  conversionValue: number,
  commissionRate: number
): number {
  return Math.round((conversionValue * commissionRate) / 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Get commission rate for a conversion type from database
 * Falls back to constants if database is unavailable
 * 
 * @param conversionType - The type of conversion
 * @param supabaseClient - Optional Supabase client (will create one if not provided)
 * @returns Commission rate (0-100)
 */
export async function getCommissionRate(
  conversionType: ConversionType,
  supabaseClient?: any
): Promise<number> {
  // Check cache first
  const now = Date.now();
  if (commissionRatesCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return commissionRatesCache[conversionType] ?? AFFILIATE_COMMISSION_RATES_FALLBACK[conversionType] ?? 0;
  }

  try {
    // Import dynamically to avoid circular dependencies
    const { createClient } = await import('@/lib/database/supabase/server');
    const supabase = supabaseClient || await createClient();

    const { data, error } = await supabase
      .from('affiliate_commission_rates')
      .select('conversion_type, commission_rate')
      .eq('is_active', true);

    if (error) {
      console.warn('Failed to fetch commission rates from database, using fallback:', error);
      return AFFILIATE_COMMISSION_RATES_FALLBACK[conversionType] ?? 0;
    }

    // Build cache from database results
    const rates: Record<string, number> = {};
    if (data) {
      data.forEach((rate: { conversion_type: string; commission_rate: number | string }) => {
        rates[rate.conversion_type] = parseFloat(rate.commission_rate.toString());
      });
    }

    // Fill in missing rates with fallback values
    Object.keys(AFFILIATE_COMMISSION_RATES_FALLBACK).forEach((type) => {
      if (!rates[type]) {
        rates[type] = AFFILIATE_COMMISSION_RATES_FALLBACK[type as ConversionType];
      }
    });

    // Update cache
    commissionRatesCache = rates;
    cacheTimestamp = now;

    return rates[conversionType] ?? AFFILIATE_COMMISSION_RATES_FALLBACK[conversionType] ?? 0;
  } catch (error) {
    console.warn('Error fetching commission rates, using fallback:', error);
    return AFFILIATE_COMMISSION_RATES_FALLBACK[conversionType] ?? 0;
  }
}

/**
 * Synchronous version that uses cache or fallback
 * Use this when you can't use async (e.g., in some edge cases)
 * 
 * @param conversionType - The type of conversion
 * @returns Commission rate (0-100)
 */
export function getCommissionRateSync(conversionType: ConversionType): number {
  if (commissionRatesCache) {
    return commissionRatesCache[conversionType] ?? AFFILIATE_COMMISSION_RATES_FALLBACK[conversionType] ?? 0;
  }
  return AFFILIATE_COMMISSION_RATES_FALLBACK[conversionType] ?? 0;
}

/**
 * Clear the commission rates cache (useful after admin updates rates)
 */
export function clearCommissionRatesCache(): void {
  commissionRatesCache = null;
  cacheTimestamp = 0;
}


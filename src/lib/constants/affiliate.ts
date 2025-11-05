/**
 * Affiliate Commission Rate Constants
 * 
 * Commission rates for different conversion types.
 * These can be moved to a database table later for more flexibility.
 */

export const AFFILIATE_COMMISSION_RATES = {
  signup: 0, // No commission for signup (or 5% if you want to reward signups)
  booking: 10, // 10% commission on bookings
  product_purchase: 5, // 5% commission on product purchases
  event_ticket_purchase: 10, // 10% commission on event tickets
  subscription: 15, // 15% commission on subscriptions
  referral: 0, // Legacy referral (no commission, just points)
} as const;

export type ConversionType = keyof typeof AFFILIATE_COMMISSION_RATES;

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
 * Get commission rate for a conversion type
 */
export function getCommissionRate(conversionType: ConversionType): number {
  return AFFILIATE_COMMISSION_RATES[conversionType] || 0;
}


/**
 * Promotion Utility Functions
 * Functions for calculating discounts and validating promotions
 */

import { roundToTwoDecimals } from './number-utils';

export interface Promotion {
  id: string;
  title?: string;
  title_english?: string | null;
  description?: string | null;
  coupon_code?: string | null;
  discount_type: 'percentage' | 'fixed_amount' | null;
  discount_value: number | null;
  package_id: string | null;
  hospital_id?: string | null;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  max_uses: number | null;
  current_uses: number | null;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  first_time_user_only?: boolean;
  applicable_product_ids?: string[] | null;
  applicable_hospital_ids?: string[] | null;
  free_shipping?: boolean;
}

export interface DiscountResult {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  promotionId: string | null;
  isValid: boolean;
  error?: string;
}

/**
 * Calculate discounted price based on promotion
 * @param packagePrice - Original package price
 * @param promotion - Promotion object
 * @returns DiscountResult with calculated prices
 */
export function calculateDiscountPrice(
  packagePrice: number,
  promotion: Promotion | null
): DiscountResult {
  // Default result (no discount)
  const defaultResult: DiscountResult = {
    originalPrice: packagePrice,
    discountAmount: 0,
    finalPrice: packagePrice,
    promotionId: null,
    isValid: true,
  };

  // No promotion provided
  if (!promotion) {
    return defaultResult;
  }

  // Check if promotion is active
  if (!promotion.is_active) {
    return {
      ...defaultResult,
      isValid: false,
      error: 'โปรโมชั่นไม่เปิดใช้งาน',
    };
  }

  // Check date validity
  const now = new Date();
  if (promotion.start_date) {
    const startDate = new Date(promotion.start_date);
    if (now < startDate) {
      return {
        ...defaultResult,
        isValid: false,
        error: 'โปรโมชั่นยังไม่เริ่มต้น',
      };
    }
  }
  if (promotion.end_date) {
    const endDate = new Date(promotion.end_date);
    if (now > endDate) {
      return {
        ...defaultResult,
        isValid: false,
        error: 'โปรโมชั่นหมดอายุแล้ว',
      };
    }
  }

  // Check if promotion has reached max uses
  if (promotion.max_uses !== null && promotion.current_uses !== null) {
    if (promotion.current_uses >= promotion.max_uses) {
      return {
        ...defaultResult,
        isValid: false,
        error: 'โปรโมชั่นถูกใช้ครบแล้ว',
      };
    }
  }

  // Check minimum purchase amount
  if (promotion.min_purchase_amount !== null) {
    if (packagePrice < promotion.min_purchase_amount) {
      return {
        ...defaultResult,
        isValid: false,
        error: `ต้องซื้อขั้นต่ำ ฿${promotion.min_purchase_amount.toLocaleString()}`,
      };
    }
  }

  // No discount type means no discount
  if (!promotion.discount_type || promotion.discount_value === null) {
    return defaultResult;
  }

  let discountAmount = 0;

  // Calculate discount based on type
  if (promotion.discount_type === 'percentage') {
    // Percentage discount
    const percentageDiscount = (packagePrice * promotion.discount_value) / 100;
    
    // Apply max discount cap if set
    if (promotion.max_discount_amount !== null) {
      discountAmount = Math.min(percentageDiscount, promotion.max_discount_amount);
    } else {
      discountAmount = percentageDiscount;
    }
  } else if (promotion.discount_type === 'fixed_amount') {
    // Fixed amount discount
    discountAmount = Math.min(promotion.discount_value, packagePrice); // Can't discount more than price
  }

  // Calculate final price
  const finalPrice = Math.max(0, packagePrice - discountAmount);

  return {
    originalPrice: packagePrice,
    discountAmount: roundToTwoDecimals(discountAmount), // Round to 2 decimal places
    finalPrice: roundToTwoDecimals(finalPrice),
    promotionId: promotion.id,
    isValid: true,
  };
}

/**
 * Filter promotions that are applicable to a package
 * @param promotions - Array of promotions
 * @param packageId - Package ID to check
 * @returns Filtered promotions that apply to this package
 */
export function filterApplicablePromotions(
  promotions: Promotion[],
  packageId: string
): Promotion[] {
  return promotions.filter((promotion) => {
    // Promotion must be active
    if (!promotion.is_active) return false;

    // Check date validity
    const now = new Date();
    if (promotion.start_date) {
      const startDate = new Date(promotion.start_date);
      if (now < startDate) return false;
    }
    if (promotion.end_date) {
      const endDate = new Date(promotion.end_date);
      if (now > endDate) return false;
    }

    // Check if promotion has reached max uses
    if (promotion.max_uses !== null && promotion.current_uses !== null) {
      if (promotion.current_uses >= promotion.max_uses) return false;
    }

    // Check if promotion applies to this package
    // If package_id is null, it applies to all packages
    if (promotion.package_id === null) return true;
    if (promotion.package_id === packageId) return true;

    return false;
  });
}

/**
 * Format discount display text
 * @param promotion - Promotion object
 * @returns Formatted discount text
 */
export function formatDiscountText(promotion: Promotion | null): string {
  if (!promotion || !promotion.discount_type || promotion.discount_value === null) {
    return '';
  }

  if (promotion.discount_type === 'percentage') {
    return `ลด ${promotion.discount_value}%`;
  } else {
    return `ลด ฿${promotion.discount_value.toLocaleString()}`;
  }
}


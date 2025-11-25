/**
 * Promotion Service
 * Business logic for promotion and coupon code operations
 */

import { getServiceClient } from './service-utils';
import { calculateDiscountPrice, type DiscountResult } from '@shared/lib/utils/promotion';

export interface Promotion {
  id: string;
  title?: string;
  title_english?: string | null;
  description?: string | null;
  coupon_code?: string | null;
  discount_type: 'percentage' | 'fixed_amount' | null;
  discount_value: number | null;
  package_id: string | null;
  hospital_id: string | null;
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

export interface ValidateCouponInput {
  couponCode: string;
  userId: string;
  amount: number;
  paymentType: 'hospital_booking' | 'product' | 'ticket';
  productId?: string;
  hospitalId?: string;
  packageId?: string;
}

export interface ValidateCouponResult {
  isValid: boolean;
  promotion: Promotion | null;
  discount: DiscountResult;
  error?: string;
}

/**
 * Check if user is a first-time user (has no completed orders)
 * Optimized: only select id column and limit to 1
 */
export async function isFirstTimeUser(userId: string): Promise<boolean> {
  const supabase = await getServiceClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['completed', 'processing', 'confirmed'])
    .limit(1);

  if (error) {
    console.error('Error checking first-time user:', error);
    // If we can't check, assume not first-time for safety
    return false;
  }

  return !orders || orders.length === 0;
}

/**
 * Validate coupon code and check if it can be applied
 * Optimized: only select needed columns
 */
export async function validateCoupon(
  input: ValidateCouponInput
): Promise<ValidateCouponResult> {
  const supabase = await getServiceClient();

  // Find promotion by coupon code (optimized - only select needed columns)
  const { data: promotion, error } = await supabase
    .from('promotions')
    .select('id, title, title_english, description, coupon_code, discount_type, discount_value, package_id, hospital_id, min_purchase_amount, max_discount_amount, max_uses, current_uses, is_active, start_date, end_date, first_time_user_only, applicable_product_ids, applicable_hospital_ids, free_shipping')
    .eq('coupon_code', input.couponCode.toUpperCase().trim())
    .maybeSingle();

  if (error || !promotion) {
    return {
      isValid: false,
      promotion: null,
      discount: {
        originalPrice: input.amount,
        discountAmount: 0,
        finalPrice: input.amount,
        promotionId: null,
        isValid: false,
      },
      error: 'ไม่พบโค้ดส่วนลดนี้',
    };
  }

  // Check if promotion is active
  if (!promotion.is_active) {
    return {
      isValid: false,
      promotion: promotion as Promotion,
      discount: {
        originalPrice: input.amount,
        discountAmount: 0,
        finalPrice: input.amount,
        promotionId: promotion.id,
        isValid: false,
      },
      error: 'โปรโมชั่นไม่เปิดใช้งาน',
    };
  }

  // Check date validity
  const now = new Date();
  if (promotion.start_date) {
    const startDate = new Date(promotion.start_date);
    if (now < startDate) {
      return {
        isValid: false,
        promotion: promotion as Promotion,
        discount: {
          originalPrice: input.amount,
          discountAmount: 0,
          finalPrice: input.amount,
          promotionId: promotion.id,
          isValid: false,
        },
        error: 'โปรโมชั่นยังไม่เริ่มต้น',
      };
    }
  }
  if (promotion.end_date) {
    const endDate = new Date(promotion.end_date);
    if (now > endDate) {
      return {
        isValid: false,
        promotion: promotion as Promotion,
        discount: {
          originalPrice: input.amount,
          discountAmount: 0,
          finalPrice: input.amount,
          promotionId: promotion.id,
          isValid: false,
        },
        error: 'โปรโมชั่นหมดอายุแล้ว',
      };
    }
  }

  // Check if promotion has reached max uses
  if (promotion.max_uses !== null && promotion.current_uses !== null) {
    if (promotion.current_uses >= promotion.max_uses) {
      return {
        isValid: false,
        promotion: promotion as Promotion,
        discount: {
          originalPrice: input.amount,
          discountAmount: 0,
          finalPrice: input.amount,
          promotionId: promotion.id,
          isValid: false,
        },
        error: 'โปรโมชั่นถูกใช้ครบแล้ว',
      };
    }
  }

  // Check first-time user requirement
  if (promotion.first_time_user_only) {
    const isFirstTime = await isFirstTimeUser(input.userId);
    if (!isFirstTime) {
      return {
        isValid: false,
        promotion: promotion as Promotion,
        discount: {
          originalPrice: input.amount,
          discountAmount: 0,
          finalPrice: input.amount,
          promotionId: promotion.id,
          isValid: false,
        },
        error: 'โปรโมชั่นนี้สำหรับลูกค้าใหม่เท่านั้น',
      };
    }
  }

  // Check minimum purchase amount
  if (promotion.min_purchase_amount !== null) {
    if (input.amount < promotion.min_purchase_amount) {
      return {
        isValid: false,
        promotion: promotion as Promotion,
        discount: {
          originalPrice: input.amount,
          discountAmount: 0,
          finalPrice: input.amount,
          promotionId: promotion.id,
          isValid: false,
        },
        error: `ต้องซื้อขั้นต่ำ ฿${promotion.min_purchase_amount.toLocaleString('th-TH')}`,
      };
    }
  }

  // Check applicable products (for product payments)
  if (input.paymentType === 'product' && input.productId) {
    const applicableProductIds = promotion.applicable_product_ids || [];
    if (applicableProductIds.length > 0) {
      if (!applicableProductIds.includes(input.productId)) {
        return {
          isValid: false,
          promotion: promotion as Promotion,
          discount: {
            originalPrice: input.amount,
            discountAmount: 0,
            finalPrice: input.amount,
            promotionId: promotion.id,
            isValid: false,
          },
          error: 'โปรโมชั่นนี้ไม่สามารถใช้กับสินค้านี้ได้',
        };
      }
    }
  }

  // Check applicable hospitals (for hospital appointment payments)
  if (input.paymentType === 'hospital_booking' && input.hospitalId) {
    const applicablehospitalIds = promotion.applicable_hospital_ids || [];
    // Also check hospital_id field for partner promotions
    if (applicablehospitalIds.length > 0 || promotion.hospital_id) {
      const isApplicable =
        applicablehospitalIds.includes(input.hospitalId) ||
        promotion.hospital_id === input.hospitalId;
      if (!isApplicable) {
        return {
          isValid: false,
          promotion: promotion as Promotion,
          discount: {
            originalPrice: input.amount,
            discountAmount: 0,
            finalPrice: input.amount,
            promotionId: promotion.id,
            isValid: false,
          },
          error: 'โปรโมชั่นนี้ไม่สามารถใช้กับโรงพยาบาลนี้ได้',
        };
      }
    }
  }

  // Check package-specific promotions (for hospital appointments)
  if (input.paymentType === 'hospital_booking' && input.packageId) {
    if (promotion.package_id !== null && promotion.package_id !== input.packageId) {
      return {
        isValid: false,
        promotion: promotion as Promotion,
        discount: {
          originalPrice: input.amount,
          discountAmount: 0,
          finalPrice: input.amount,
          promotionId: promotion.id,
          isValid: false,
        },
        error: 'โปรโมชั่นนี้ไม่สามารถใช้กับแพ็คเกจนี้ได้',
      };
    }
  }

  // Calculate discount
  const discount = calculateDiscountPrice(input.amount, promotion as Promotion);

  if (!discount.isValid) {
    return {
      isValid: false,
      promotion: promotion as Promotion,
      discount,
      error: discount.error || 'ไม่สามารถใช้โปรโมชั่นนี้ได้',
    };
  }

  return {
    isValid: true,
    promotion: promotion as Promotion,
    discount,
  };
}

/**
 * Increment promotion usage count
 * Optimized: use RPC first, fallback to direct update if needed
 */
export async function incrementPromotionUsage(promotionId: string): Promise<void> {
  const supabase = await getServiceClient();

  const { error } = await supabase.rpc('increment_promotion_uses', {
    promotion_id: promotionId,
  });

  // Fallback if RPC doesn't exist (optimized - only select current_uses)
  if (error) {
    const { data: promotion } = await supabase
      .from('promotions')
      .select('current_uses')
      .eq('id', promotionId)
      .single();

    if (promotion) {
      await supabase
        .from('promotions')
        .update({
          current_uses: (promotion.current_uses || 0) + 1,
        })
        .eq('id', promotionId);
    }
  }
}

/**
 * Get promotion by coupon code
 * Optimized: only select needed columns
 */
export async function getPromotionByCouponCode(
  couponCode: string
): Promise<Promotion | null> {
  const supabase = await getServiceClient();

  const { data: promotion, error } = await supabase
    .from('promotions')
    .select('id, title, title_english, description, coupon_code, discount_type, discount_value, package_id, hospital_id, min_purchase_amount, max_discount_amount, max_uses, current_uses, is_active, start_date, end_date, first_time_user_only, applicable_product_ids, applicable_hospital_ids, free_shipping')
    .eq('coupon_code', couponCode.toUpperCase().trim())
    .maybeSingle();

  if (error || !promotion) {
    return null;
  }

  return promotion as Promotion;
}


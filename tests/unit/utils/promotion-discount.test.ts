/**
 * Promotion Discount System Tests
 * Tests for promotion discount calculation and validation
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateDiscountPrice,
  filterApplicablePromotions,
  formatDiscountText,
  type Promotion,
  type DiscountResult,
} from '@/lib/utils/promotion';

describe('Promotion Discount System', () => {
  const basePromotion: Promotion = {
    id: 'test-promo-1',
    title: 'Test Promotion',
    discount_type: 'percentage',
    discount_value: 10,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };

  describe('calculateDiscountPrice', () => {
    it('should return original price when no promotion is provided', () => {
      const result = calculateDiscountPrice(1000, null);
      
      expect(result.originalPrice).toBe(1000);
      expect(result.discountAmount).toBe(0);
      expect(result.finalPrice).toBe(1000);
      expect(result.promotionId).toBeNull();
      expect(result.isValid).toBe(true);
    });

    it('should return error when promotion is inactive', () => {
      const promotion: Promotion = {
        ...basePromotion,
        is_active: false,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('โปรโมชั่นไม่เปิดใช้งาน');
    });

    it('should calculate percentage discount correctly', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 20,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.originalPrice).toBe(1000);
      expect(result.discountAmount).toBe(200);
      expect(result.finalPrice).toBe(800);
      expect(result.promotionId).toBe('test-promo-1');
      expect(result.isValid).toBe(true);
    });

    it('should calculate fixed amount discount correctly', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'fixed_amount',
        discount_value: 500,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.originalPrice).toBe(1000);
      expect(result.discountAmount).toBe(500);
      expect(result.finalPrice).toBe(500);
      expect(result.isValid).toBe(true);
    });

    it('should not discount more than package price (fixed amount)', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'fixed_amount',
        discount_value: 1500, // More than package price
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.discountAmount).toBe(1000); // Capped at package price
      expect(result.finalPrice).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should apply max discount cap for percentage discounts', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 50, // 50% of 1000 = 500
        max_discount_amount: 300, // But capped at 300
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.discountAmount).toBe(300); // Capped at max_discount_amount
      expect(result.finalPrice).toBe(700);
      expect(result.isValid).toBe(true);
    });

    it('should return error when package price is below min purchase amount', () => {
      const promotion: Promotion = {
        ...basePromotion,
        min_purchase_amount: 2000,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('ต้องซื้อขั้นต่ำ');
    });

    it('should return error when promotion has reached max uses', () => {
      const promotion: Promotion = {
        ...basePromotion,
        max_uses: 10,
        current_uses: 10,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('โปรโมชั่นถูกใช้ครบแล้ว');
    });

    it('should allow promotion when current_uses is less than max_uses', () => {
      const promotion: Promotion = {
        ...basePromotion,
        max_uses: 10,
        current_uses: 5,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.isValid).toBe(true);
    });

    it('should return error when promotion start date is in the future', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const promotion: Promotion = {
        ...basePromotion,
        start_date: futureDate.toISOString(),
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('โปรโมชั่นยังไม่เริ่มต้น');
    });

    it('should return error when promotion end date has passed', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const promotion: Promotion = {
        ...basePromotion,
        end_date: pastDate.toISOString(),
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('โปรโมชั่นหมดอายุแล้ว');
    });

    it('should round discount amounts to 2 decimal places', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 33.333, // 33.333% of 1000 = 333.33
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.discountAmount).toBe(333.33);
      expect(result.finalPrice).toBe(666.67);
    });

    it('should handle edge case: 100% discount', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 100,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.discountAmount).toBe(1000);
      expect(result.finalPrice).toBe(0);
      expect(result.isValid).toBe(true);
    });

    it('should handle edge case: 0% discount', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 0,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.discountAmount).toBe(0);
      expect(result.finalPrice).toBe(1000);
      expect(result.isValid).toBe(true);
    });

    it('should return no discount when discount_type is null', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: null,
        discount_value: null,
      };
      
      const result = calculateDiscountPrice(1000, promotion);
      
      expect(result.discountAmount).toBe(0);
      expect(result.finalPrice).toBe(1000);
      expect(result.promotionId).toBeNull();
    });
  });

  describe('filterApplicablePromotions', () => {
    const packageId = 'package-123';

    it('should filter out inactive promotions', () => {
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', is_active: false },
        { ...basePromotion, id: '2', is_active: true },
      ];
      
      const result = filterApplicablePromotions(promotions, packageId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter out promotions that have reached max uses', () => {
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', max_uses: 10, current_uses: 10 },
        { ...basePromotion, id: '2', max_uses: 10, current_uses: 5 },
      ];
      
      const result = filterApplicablePromotions(promotions, packageId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should include promotions with null package_id (applies to all)', () => {
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', package_id: null },
        { ...basePromotion, id: '2', package_id: 'different-package' },
      ];
      
      const result = filterApplicablePromotions(promotions, packageId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should include promotions that match package_id', () => {
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', package_id: packageId },
        { ...basePromotion, id: '2', package_id: 'different-package' },
      ];
      
      const result = filterApplicablePromotions(promotions, packageId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should filter out promotions with future start dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', start_date: futureDate.toISOString() },
        { ...basePromotion, id: '2', start_date: null },
      ];
      
      const result = filterApplicablePromotions(promotions, packageId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter out promotions with past end dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', end_date: pastDate.toISOString() },
        { ...basePromotion, id: '2', end_date: null },
      ];
      
      const result = filterApplicablePromotions(promotions, packageId);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });
  });

  describe('formatDiscountText', () => {
    it('should format percentage discount correctly', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 20,
      };
      
      const result = formatDiscountText(promotion);
      
      expect(result).toBe('ลด 20%');
    });

    it('should format fixed amount discount correctly', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'fixed_amount',
        discount_value: 500,
      };
      
      const result = formatDiscountText(promotion);
      
      expect(result).toBe('ลด ฿500');
    });

    it('should return empty string when promotion is null', () => {
      const result = formatDiscountText(null);
      
      expect(result).toBe('');
    });

    it('should return empty string when discount_type is null', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: null,
        discount_value: null,
      };
      
      const result = formatDiscountText(promotion);
      
      expect(result).toBe('');
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle complex scenario: percentage with max cap and min purchase', () => {
      const promotion: Promotion = {
        ...basePromotion,
        discount_type: 'percentage',
        discount_value: 50, // 50% of 2000 = 1000
        max_discount_amount: 500, // But capped at 500
        min_purchase_amount: 1500,
      };
      
      // Package price meets min purchase
      const result1 = calculateDiscountPrice(2000, promotion);
      expect(result1.isValid).toBe(true);
      expect(result1.discountAmount).toBe(500); // Capped
      expect(result1.finalPrice).toBe(1500);
      
      // Package price below min purchase
      const result2 = calculateDiscountPrice(1000, promotion);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('ต้องซื้อขั้นต่ำ');
    });

    it('should handle multiple promotions filtering correctly', () => {
      const promotions: Promotion[] = [
        { ...basePromotion, id: '1', package_id: null, is_active: true },
        { ...basePromotion, id: '2', package_id: 'package-123', is_active: true },
        { ...basePromotion, id: '3', package_id: 'different-package', is_active: true },
        { ...basePromotion, id: '4', package_id: null, is_active: false },
        { ...basePromotion, id: '5', package_id: null, max_uses: 5, current_uses: 5 },
      ];
      
      const result = filterApplicablePromotions(promotions, 'package-123');
      
      // Should include: 1 (null package_id), 2 (matches package_id)
      // Should exclude: 3 (different package), 4 (inactive), 5 (max uses reached)
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id)).toContain('1');
      expect(result.map(p => p.id)).toContain('2');
    });
  });
});


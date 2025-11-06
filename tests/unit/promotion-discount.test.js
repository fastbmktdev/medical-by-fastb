/**
 * Promotion Discount System Manual Tests
 * Run with: node tests/scripts/promotion-discount.test.js
 */

const { calculateDiscountPrice, filterApplicablePromotions, formatDiscountText } = require('../../src/lib/utils/promotion');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toContain: (substring) => {
      if (!String(actual).includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    },
    toBeGreaterThan: (value) => {
      if (actual <= value) {
        throw new Error(`Expected ${actual} to be greater than ${value}`);
      }
    },
    toBeLessThan: (value) => {
      if (actual < value) {
        throw new Error(`Expected ${actual} to be less than ${value}`);
      }
    },
  };
}

console.log('🧪 Running Promotion Discount Tests...\n');

// Test 1: No promotion
test('should return original price when no promotion is provided', () => {
  const result = calculateDiscountPrice(1000, null);
  expect(result.originalPrice).toBe(1000);
  expect(result.discountAmount).toBe(0);
  expect(result.finalPrice).toBe(1000);
  expect(result.isValid).toBe(true);
});

// Test 2: Percentage discount
test('should calculate percentage discount correctly', () => {
  const promotion = {
    id: 'test-1',
    discount_type: 'percentage',
    discount_value: 20,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.originalPrice).toBe(1000);
  expect(result.discountAmount).toBe(200);
  expect(result.finalPrice).toBe(800);
  expect(result.isValid).toBe(true);
});

// Test 3: Fixed amount discount
test('should calculate fixed amount discount correctly', () => {
  const promotion = {
    id: 'test-2',
    discount_type: 'fixed_amount',
    discount_value: 500,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.originalPrice).toBe(1000);
  expect(result.discountAmount).toBe(500);
  expect(result.finalPrice).toBe(500);
  expect(result.isValid).toBe(true);
});

// Test 4: Max discount cap
test('should apply max discount cap for percentage discounts', () => {
  const promotion = {
    id: 'test-3',
    discount_type: 'percentage',
    discount_value: 50, // 50% of 2000 = 1000
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: 500, // But capped at 500
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const result = calculateDiscountPrice(2000, promotion);
  expect(result.discountAmount).toBe(500); // Capped
  expect(result.finalPrice).toBe(1500);
  expect(result.isValid).toBe(true);
});

// Test 5: Min purchase amount
test('should return error when package price is below min purchase amount', () => {
  const promotion = {
    id: 'test-4',
    discount_type: 'percentage',
    discount_value: 10,
    package_id: null,
    min_purchase_amount: 2000,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.isValid).toBe(false);
  expect(result.error).toContain('ต้องซื้อขั้นต่ำ');
});

// Test 6: Max uses reached
test('should return error when promotion has reached max uses', () => {
  const promotion = {
    id: 'test-5',
    discount_type: 'percentage',
    discount_value: 10,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: 10,
    current_uses: 10,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.isValid).toBe(false);
  expect(result.error).toBe('โปรโมชั่นถูกใช้ครบแล้ว');
});

// Test 7: Inactive promotion
test('should return error when promotion is inactive', () => {
  const promotion = {
    id: 'test-6',
    discount_type: 'percentage',
    discount_value: 10,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: false,
    start_date: null,
    end_date: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.isValid).toBe(false);
  expect(result.error).toBe('โปรโมชั่นไม่เปิดใช้งาน');
});

// Test 8: Format discount text
test('should format percentage discount text correctly', () => {
  const promotion = {
    id: 'test-7',
    discount_type: 'percentage',
    discount_value: 20,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const text = formatDiscountText(promotion);
  expect(text).toBe('ลด 20%');
});

// Test 9: Format fixed amount text
test('should format fixed amount discount text correctly', () => {
  const promotion = {
    id: 'test-8',
    discount_type: 'fixed_amount',
    discount_value: 500,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
    is_active: true,
    start_date: null,
    end_date: null,
  };
  
  const text = formatDiscountText(promotion);
  expect(text).toBe('ลด ฿500');
});

// Test 10: Filter applicable promotions
test('should filter applicable promotions correctly', () => {
  const promotions = [
    {
      id: '1',
      discount_type: 'percentage',
      discount_value: 10,
      package_id: null, // Applies to all
      is_active: true,
      start_date: null,
      end_date: null,
      max_uses: null,
      current_uses: null,
    },
    {
      id: '2',
      discount_type: 'percentage',
      discount_value: 15,
      package_id: 'package-123', // Specific package
      is_active: true,
      start_date: null,
      end_date: null,
      max_uses: null,
      current_uses: null,
    },
    {
      id: '3',
      discount_type: 'percentage',
      discount_value: 20,
      package_id: 'different-package',
      is_active: true,
      start_date: null,
      end_date: null,
      max_uses: null,
      current_uses: null,
    },
    {
      id: '4',
      discount_type: 'percentage',
      discount_value: 25,
      package_id: null,
      is_active: false, // Inactive
      start_date: null,
      end_date: null,
      max_uses: null,
      current_uses: null,
    },
  ];
  
  const result = filterApplicablePromotions(promotions, 'package-123');
  // Should include: 1 (null package_id), 2 (matches package_id)
  // Should exclude: 3 (different package), 4 (inactive)
  expect(result.length).toBe(2);
  expect(result.find(p => p.id === '1')).toBeTruthy();
  expect(result.find(p => p.id === '2')).toBeTruthy();
});

console.log('\n✨ All tests completed!');


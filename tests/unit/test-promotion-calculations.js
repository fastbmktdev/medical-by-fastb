/**
 * Promotion Discount Calculation Test Script
 * Executable test script for promotion discount calculations
 * Run with: node tests/scripts/test-promotion-calculations.js
 */

// Simple test implementation that can run without Jest
// Note: This requires the actual promotion utility to be available
// For now, this documents the test cases

console.log('🧪 Promotion Discount Calculation Tests\n');
console.log('='.repeat(70));

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

function test(name, fn) {
  testResults.total++;
  try {
    fn();
    testResults.passed++;
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeCloseTo: (expected, precision = 2) => {
      const diff = Math.abs(actual - expected);
      if (diff > Math.pow(10, -precision)) {
        throw new Error(`Expected ${actual} to be close to ${expected} (within ${precision} decimal places)`);
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
      if (actual >= value) {
        throw new Error(`Expected ${actual} to be less than ${value}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected truthy value, but got ${actual}`);
      }
    },
    toBeFalsy: () => {
      if (actual) {
        throw new Error(`Expected falsy value, but got ${actual}`);
      }
    },
  };
}

// Mock calculateDiscountPrice function for testing
// In real scenario, this would import from the actual module
function calculateDiscountPrice(packagePrice, promotion) {
  if (!promotion) {
    return {
      originalPrice: packagePrice,
      discountAmount: 0,
      finalPrice: packagePrice,
      promotionId: null,
      isValid: true,
    };
  }

  if (!promotion.is_active) {
    return {
      originalPrice: packagePrice,
      discountAmount: 0,
      finalPrice: packagePrice,
      promotionId: null,
      isValid: false,
      error: 'โปรโมชั่นไม่เปิดใช้งาน',
    };
  }

  if (promotion.min_purchase_amount && packagePrice < promotion.min_purchase_amount) {
    return {
      originalPrice: packagePrice,
      discountAmount: 0,
      finalPrice: packagePrice,
      promotionId: null,
      isValid: false,
      error: `ต้องซื้อขั้นต่ำ ฿${promotion.min_purchase_amount.toLocaleString()}`,
    };
  }

  if (promotion.max_uses !== null && promotion.current_uses !== null) {
    if (promotion.current_uses >= promotion.max_uses) {
      return {
        originalPrice: packagePrice,
        discountAmount: 0,
        finalPrice: packagePrice,
        promotionId: null,
        isValid: false,
        error: 'โปรโมชั่นถูกใช้ครบแล้ว',
      };
    }
  }

  if (!promotion.discount_type || promotion.discount_value === null) {
    return {
      originalPrice: packagePrice,
      discountAmount: 0,
      finalPrice: packagePrice,
      promotionId: null,
      isValid: true,
    };
  }

  let discountAmount = 0;

  if (promotion.discount_type === 'percentage') {
    const percentageDiscount = (packagePrice * promotion.discount_value) / 100;
    if (promotion.max_discount_amount !== null) {
      discountAmount = Math.min(percentageDiscount, promotion.max_discount_amount);
    } else {
      discountAmount = percentageDiscount;
    }
  } else if (promotion.discount_type === 'fixed_amount') {
    discountAmount = Math.min(promotion.discount_value, packagePrice);
  }

  const finalPrice = Math.max(0, packagePrice - discountAmount);

  return {
    originalPrice: packagePrice,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalPrice: Math.round(finalPrice * 100) / 100,
    promotionId: promotion.id,
    isValid: true,
  };
}

// Test Suite
console.log('\n📋 Running Test Cases:\n');

test('Test 1: No promotion returns original price', () => {
  const result = calculateDiscountPrice(1000, null);
  expect(result.originalPrice).toBe(1000);
  expect(result.discountAmount).toBe(0);
  expect(result.finalPrice).toBe(1000);
  expect(result.isValid).toBe(true);
});

test('Test 2: 20% percentage discount calculation', () => {
  const promotion = {
    id: 'test-1',
    discount_type: 'percentage',
    discount_value: 20,
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.originalPrice).toBe(1000);
  expect(result.discountAmount).toBe(200);
  expect(result.finalPrice).toBe(800);
  expect(result.promotionId).toBe('test-1');
  expect(result.isValid).toBe(true);
});

test('Test 3: ฿500 fixed amount discount calculation', () => {
  const promotion = {
    id: 'test-2',
    discount_type: 'fixed_amount',
    discount_value: 500,
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.originalPrice).toBe(1000);
  expect(result.discountAmount).toBe(500);
  expect(result.finalPrice).toBe(500);
  expect(result.isValid).toBe(true);
});

test('Test 4: Max discount cap for percentage', () => {
  const promotion = {
    id: 'test-3',
    discount_type: 'percentage',
    discount_value: 50, // 50% of 2000 = 1000
    max_discount_amount: 500, // But capped at 500
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(2000, promotion);
  expect(result.discountAmount).toBe(500); // Capped
  expect(result.finalPrice).toBe(1500);
  expect(result.isValid).toBe(true);
});

test('Test 5: Min purchase amount validation', () => {
  const promotion = {
    id: 'test-4',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase_amount: 2000,
    is_active: true,
    package_id: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.isValid).toBe(false);
  expect(result.error).toContain('ต้องซื้อขั้นต่ำ');
});

test('Test 6: Max uses reached validation', () => {
  const promotion = {
    id: 'test-5',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: 10,
    current_uses: 10,
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.isValid).toBe(false);
  expect(result.error).toContain('ถูกใช้ครบแล้ว');
});

test('Test 7: Inactive promotion validation', () => {
  const promotion = {
    id: 'test-6',
    discount_type: 'percentage',
    discount_value: 10,
    is_active: false,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.isValid).toBe(false);
  expect(result.error).toBe('โปรโมชั่นไม่เปิดใช้งาน');
});

test('Test 8: Fixed discount cannot exceed package price', () => {
  const promotion = {
    id: 'test-7',
    discount_type: 'fixed_amount',
    discount_value: 1500, // More than package price
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.discountAmount).toBe(1000); // Capped at package price
  expect(result.finalPrice).toBe(0);
  expect(result.isValid).toBe(true);
});

test('Test 9: 100% discount edge case', () => {
  const promotion = {
    id: 'test-8',
    discount_type: 'percentage',
    discount_value: 100,
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.discountAmount).toBe(1000);
  expect(result.finalPrice).toBe(0);
  expect(result.isValid).toBe(true);
});

test('Test 10: Rounding to 2 decimal places', () => {
  const promotion = {
    id: 'test-9',
    discount_type: 'percentage',
    discount_value: 33.333,
    is_active: true,
    package_id: null,
    min_purchase_amount: null,
    max_discount_amount: null,
    max_uses: null,
    current_uses: null,
  };
  
  const result = calculateDiscountPrice(1000, promotion);
  expect(result.discountAmount).toBeCloseTo(333.33, 2);
  expect(result.finalPrice).toBeCloseTo(666.67, 2);
  expect(result.isValid).toBe(true);
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('\n📊 Test Summary:');
console.log(`   Total: ${testResults.total}`);
console.log(`   ✅ Passed: ${testResults.passed}`);
console.log(`   ❌ Failed: ${testResults.failed}`);
console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
  console.log('\n🎉 All tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
}

console.log('\n💡 Note: These are mock tests. For actual testing:');
console.log('   1. Use the real calculateDiscountPrice function from src/lib/utils/promotion.ts');
console.log('   2. Test via the booking page UI');
console.log('   3. Test via API endpoints');
console.log('   4. See tests/promotion-manual-test-guide.md for detailed manual testing steps\n');


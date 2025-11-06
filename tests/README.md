# Tests Documentation

## 📋 Overview

โปรเจคนี้ใช้ **Jest** สำหรับ Unit Tests และ **Playwright** สำหรับ E2E Tests

## 🚀 Quick Start

### รัน Unit Tests ทั้งหมด
```bash
npm test
```

### รัน Unit Tests แบบ watch mode (auto-rerun เมื่อไฟล์เปลี่ยน)
```bash
npm run test:watch
```

### รัน Unit Tests พร้อม Coverage Report
```bash
npm run test:coverage
```

### รัน Test File เฉพาะ
```bash
npm test -- tests/unit/promotion-discount.test.ts
```

### รัน Promotion Tests โดยเฉพาะ
```bash
npm run test:promotion
```

### รัน E2E Tests
```bash
npm run test:e2e
```

## 📁 Test Directory Structure

```
tests/
├── unit/              # Unit tests (Jest)
│   ├── promotion-discount.test.ts
│   ├── promotion-api.test.ts
│   └── test-*.js
├── integration/       # Integration tests
│   ├── admin-management.test.js
│   ├── database-utilities.test.js
│   ├── development-setup.test.js
│   ├── storage-configuration.test.js
│   └── test-google-analytics.js
├── affiliate/         # Affiliate system tests
│   ├── test-affiliate-signup.js
│   ├── test-affiliate-booking*.js
│   ├── test-affiliate-commission*.js
│   ├── test-affiliate-payment*.js
│   └── test-affiliate-stats-api.js
├── e2e/              # End-to-end tests (Playwright)
│   ├── auth-flow.spec.ts
│   ├── affiliate-dashboard.spec.ts
│   ├── affiliate-signup-sessionstorage.spec.ts
│   ├── admin-gym-management.spec.ts
│   ├── login-existing-users.spec.ts
│   └── helpers.ts
├── analysis/         # Code analysis tests
├── screenshots/      # Test screenshots
└── run-all-tests.js  # Test runner script
```

## 📚 Test Categories

### 1. Unit Tests (`unit/`)
Individual function and component tests using Jest.

**Coverage:**
- Promotion discount calculations
- Promotion API logic
- Utility functions

### 2. Integration Tests (`integration/`)
Tests that verify multiple components working together.

**Coverage:**
- Admin management
- Database utilities
- Development setup
- Storage configuration
- Google Analytics integration

### 3. Affiliate Tests (`affiliate/`)
Comprehensive tests for the affiliate/referral system.

**Coverage:**
- Signup and registration flows
- Booking tracking with referrals
- Commission calculations
- Payment processing
- Analytics and statistics

See [affiliate/README.md](./affiliate/README.md) for detailed documentation.

### 4. E2E Tests (`e2e/`)
End-to-end browser tests using Playwright.

**Coverage:**
- Authentication flows
- Affiliate dashboard
- Admin gym management
- User login scenarios

### 5. Analysis Tests (`analysis/`)
Code quality and security analysis tests.

## ✅ Test Results

### Promotion Discount Tests
- **Total Tests**: 27 tests
- **Status**: ✅ All passing
- **Coverage**: 
  - `calculateDiscountPrice()` - 100%
  - `filterApplicablePromotions()` - 100%
  - `formatDiscountText()` - 100%

### Test Categories

1. **calculateDiscountPrice Tests** (15 tests)
   - Percentage discount calculation
   - Fixed amount discount calculation
   - Max discount cap
   - Min purchase validation
   - Max uses validation
   - Date range validation
   - Edge cases (100% discount, 0% discount, rounding)

2. **filterApplicablePromotions Tests** (6 tests)
   - Inactive promotion filtering
   - Max uses filtering
   - Package ID matching
   - Date range filtering

3. **formatDiscountText Tests** (4 tests)
   - Percentage formatting
   - Fixed amount formatting
   - Null/empty cases

4. **Edge Cases and Integration Tests** (2 tests)
   - Complex scenarios
   - Multiple promotions filtering

## 🛠️ Configuration

Jest configuration อยู่ใน `jest.config.js`:
- Test environment: `node`
- Module mapping: `@/` → `src/`
- Transform: TypeScript via `ts-jest`
- Coverage: HTML, LCOV, text reports

## 📝 Writing New Tests

### 1. สร้าง Test File
```typescript
// tests/my-feature.test.ts
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '@/lib/utils/my-utils';

describe('My Feature', () => {
  it('should work correctly', () => {
    const result = myFunction();
    expect(result).toBe(true);
  });
});
```

### 2. ใช้ Absolute Imports
```typescript
// ✅ Good - ใช้ @/ prefix
import { calculateDiscountPrice } from '@/lib/utils/promotion';

// ❌ Bad - ใช้ relative paths
import { calculateDiscountPrice } from '../../src/lib/utils/promotion';
```

### 3. Test Structure
```typescript
describe('Feature Name', () => {
  describe('Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## 🎯 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | รัน tests ทั้งหมด |
| `npm run test:watch` | รัน tests แบบ watch mode |
| `npm run test:coverage` | รัน tests พร้อม coverage report |
| `npm run test:promotion` | รัน promotion tests |
| `npm run test:e2e` | รัน E2E tests (Playwright) |

## 📊 Coverage Reports

หลังจากรัน `npm run test:coverage`:
- **Text Report**: แสดงใน terminal
- **HTML Report**: อยู่ใน `coverage/lcov-report/index.html`
- **LCOV Report**: อยู่ใน `coverage/lcov.info`

เปิด HTML report:
```bash
open coverage/lcov-report/index.html
```

## 🔍 Debugging Tests

### รัน Test แบบ Debug
```bash
node --inspect-brk node_modules/.bin/jest tests/promotion-discount.test.ts
```

### ใช้ `console.log` ใน Tests
```typescript
it('should debug', () => {
  const result = myFunction();
  console.log('Debug:', result);
  expect(result).toBe(true);
});
```

## 📚 Test Best Practices

1. **Test One Thing**: แต่ละ test ควร test แค่สิ่งเดียว
2. **Use Descriptive Names**: ชื่อ test ควรบอกว่าทดสอบอะไร
3. **Arrange-Act-Assert**: ใช้ pattern นี้ในการเขียน tests
4. **Test Edge Cases**: ทดสอบ edge cases และ error cases
5. **Keep Tests Fast**: Tests ควรรันเร็ว (< 1 วินาที)
6. **Isolate Tests**: Tests ไม่ควรพึ่งพากัน

## 🐛 Troubleshooting

### Error: Cannot find module '@/...'
- ตรวจสอบว่า `jest.config.js` มี `moduleNameMapper` สำหรับ `@/` prefix
- ตรวจสอบว่า path ใน `tsconfig.json` ถูกต้อง

### Error: SyntaxError: Cannot use import statement outside a module
- ตรวจสอบว่า `jest.config.js` มี `extensionsToTreatAsEsm: ['.ts', '.tsx']`
- ตรวจสอบว่า `ts-jest` config มี `useESM: true`

### Tests ไม่พบไฟล์
- ตรวจสอบว่า test file อยู่ใน pattern ที่กำหนดใน `testMatch`
- ตรวจสอบว่าไฟล์มี extension `.test.ts` หรือ `.test.tsx`

## 📖 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)


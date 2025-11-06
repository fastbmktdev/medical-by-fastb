# Unit Tests

## 📋 Overview

Unit tests สำหรับทดสอบ functions และ components แบบอิสระ โดยใช้ **Jest** เป็น test runner

## 📁 Structure

```
unit/
├── utils/          # Utility functions (promotion, affiliate, validation, etc.)
├── services/       # Service layer (gamification, booking, payment, etc.)
└── lib/            # Library functions
```

## 🚀 Running Tests

### รัน unit tests ทั้งหมด
```bash
npm run test:unit
```

### รัน tests เฉพาะ utils
```bash
npm run test:unit:utils
```

### รัน tests เฉพาะ services
```bash
npm run test:unit:services
```

### รัน test file เฉพาะ
```bash
npm test -- tests/unit/utils/promotion.test.ts
```

### Watch mode
```bash
npm run test:watch
```

## ✅ Test Coverage

### Utils (192+ functions to test)
- ✅ **promotion.ts** - 3 functions (27 tests) - 100%
- ⏳ **affiliate.ts** - 6 functions - Partial coverage
- ⏳ **validation.ts** - 17 functions - Not tested
- ⏳ **sanitize.ts** - 6 functions - Not tested
- ⏳ **file-validation.ts** - 4 functions - Not tested
- ⏳ **qrcode.ts** - 3 functions - Not tested
- ⏳ **analytics.ts** - 10 functions - Not tested
- ⏳ Other utils - 140+ functions - Not tested

### Services (50+ functions to test)
- ⏳ **gamification.service.ts** - 15 functions - Not tested
- ⏳ **booking.service.ts** - 11 functions - Not tested
- ⏳ **payment.service.ts** - 20+ functions - Not tested
- ⏳ **auth.service.ts** - 9 functions - Not tested
- ⏳ **gym.service.ts** - 9 functions - Not tested

## 📝 Writing Unit Tests

### Test Template
```typescript
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '@/lib/utils/my-utils';

describe('MyUtils', () => {
  describe('myFunction', () => {
    it('should return expected result', () => {
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

### Best Practices
1. ใช้ Arrange-Act-Assert pattern
2. Test one thing per test case
3. Use descriptive test names
4. Test edge cases และ error cases
5. Mock external dependencies
6. Keep tests fast (< 100ms per test)

## 🎯 Priority Functions to Test

### 🔴 High Priority
1. Validation utils (XSS, SQL injection prevention)
2. Sanitize utils (Security-critical)
3. Payment service (Financial critical)
4. Booking service (Business critical)
5. Auth service (Security critical)

### 🟠 Medium Priority
1. Gamification service
2. Gym service
3. Analytics utils
4. File validation
5. PDF generator

### 🟡 Low Priority
1. QR code utils
2. Export utils
3. Text utils
4. Toast utils

## 📚 References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Function Testing List](../../docs/FUNCTION_TESTING_LIST.md)

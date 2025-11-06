# API Route Tests

## 📋 Overview

API route tests สำหรับทดสอบ Next.js API endpoints โดยใช้ **Jest** และ **Supertest**

## 📁 Structure

```
api/
├── auth/              # Authentication endpoints
├── users/             # User management endpoints
├── gyms/              # Gym management endpoints
├── bookings/          # Booking endpoints
├── payments/          # Payment endpoints
├── gamification/      # Gamification endpoints
├── affiliate/         # Affiliate endpoints
└── partner/           # Partner management endpoints
```

## 🚀 Running Tests

### รัน API tests ทั้งหมด
```bash
npm run test:api
```

### รัน tests แต่ละหมวด
```bash
npm run test:api:auth
npm run test:api:users
npm run test:api:gyms
npm run test:api:bookings
npm run test:api:payments
npm run test:api:gamification
npm run test:api:affiliate
npm run test:api:partner
```

### รัน test file เฉพาะ
```bash
npm test -- tests/api/auth/signup.test.ts
```

## ✅ Test Coverage

### Authentication Routes ⏳
- ⏳ POST `/api/auth/signup`
  - [ ] Signup successfully
  - [ ] Email already exists
  - [ ] Invalid email format
  - [ ] Weak password
  - [ ] Referral code handling

- ⏳ POST `/api/auth/login`
  - [ ] Login with email
  - [ ] Login with username
  - [ ] Invalid credentials
  - [ ] Rate limiting

### User Routes ⏳
- ⏳ GET `/api/users` (Admin only)
- ⏳ GET `/api/users/profile`
- ⏳ PUT `/api/users/profile`
- ⏳ POST `/api/users/profile/picture`
- ⏳ 14+ more endpoints

### Booking Routes ⏳
- ⏳ POST `/api/bookings`
- ⏳ GET `/api/bookings`
- ⏳ GET `/api/bookings/[id]`
- ⏳ PATCH `/api/bookings/[id]`

### Payment Routes ⏳
- ⏳ POST `/api/payments/intent`
- ⏳ GET `/api/payments`
- ⏳ POST `/api/webhooks/stripe`
- ⏳ 6+ more endpoints

### Gamification Routes ⏳
- ⏳ GET `/api/gamification/stats`
- ⏳ POST `/api/gamification/award-points`
- ⏳ GET `/api/gamification/badges`
- ⏳ 7+ more endpoints

### Affiliate Routes (Partial) ⚠️
- ✅ GET `/api/affiliate` (มี test แล้ว)
- ✅ POST `/api/affiliate` (มี test แล้ว)
- ⏳ POST `/api/affiliate/conversions`

### Partner Routes (16 tests) ⚠️
- ✅ POST `/api/partner/promotions` (5 tests)
- ✅ PATCH `/api/partner/promotions/[id]` (2 tests)
- ✅ GET `/api/promotions/active` (3 tests)
- ✅ Booking with Promotion (4 tests)
- ✅ Payment with Promotion (2 tests)
- ⏳ 20+ more endpoints

## 📝 Writing API Tests

### Test Template
```typescript
import { describe, it, expect } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/your-route/route';

describe('API: /api/your-route', () => {
  describe('POST /api/your-route', () => {
    it('should return 200 with valid data', async () => {
      // Arrange
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          // your test data
        },
      });

      // Act
      await handler(req, res);

      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual({
        // expected response
      });
    });

    it('should return 400 with invalid data', async () => {
      // Test validation error
    });

    it('should return 401 with unauthorized user', async () => {
      // Test authentication
    });

    it('should return 403 with forbidden access', async () => {
      // Test authorization
    });
  });
});
```

### Best Practices
1. Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)
2. Test authentication และ authorization
3. Test validation errors
4. Test success scenarios
5. Test error scenarios (4xx, 5xx)
6. Test rate limiting
7. Test database transactions
8. Mock external API calls
9. Use proper test data cleanup

## 🔧 Testing Tools

### Required Dependencies
```bash
npm install --save-dev supertest node-mocks-http
```

### Mock Supabase Client
```typescript
import { createClient } from '@supabase/supabase-js';

// Mock for testing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
}));
```

## 🎯 Priority APIs to Test

### 🔴 High Priority (Critical for business)
1. POST `/api/auth/signup` - User registration
2. POST `/api/auth/login` - User authentication
3. POST `/api/bookings` - Booking creation
4. POST `/api/payments/intent` - Payment creation
5. POST `/api/webhooks/stripe` - Payment webhook
6. GET `/api/users/profile` - User profile
7. POST `/api/partner/promotions` - Promotion management

### 🟠 Medium Priority
1. GET `/api/gamification/stats` - User gamification
2. POST `/api/gamification/award-points` - Points system
3. GET `/api/affiliate` - Affiliate tracking
4. POST `/api/gyms` - Gym management
5. GET `/api/partner/analytics` - Partner analytics

### 🟡 Low Priority
1. Newsletter endpoints
2. Search endpoints
3. Export endpoints
4. QR code generation

## 🔒 Security Testing

### Authentication Testing
```typescript
it('should reject unauthenticated requests', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    // No auth header
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(401);
});
```

### Authorization Testing
```typescript
it('should reject unauthorized role', async () => {
  const { req, res } = createMocks({
    method: 'GET',
    headers: {
      authorization: 'Bearer regular_user_token',
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(403);
});
```

### Input Validation Testing
```typescript
it('should reject XSS attempts', async () => {
  const { req, res } = createMocks({
    method: 'POST',
    body: {
      name: '<script>alert("xss")</script>',
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
});
```

## 📚 References

- [Next.js API Testing](https://nextjs.org/docs/app/building-your-application/testing)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Function Testing List](../../docs/FUNCTION_TESTING_LIST.md)
- [Testing Summary](../../docs/TESTING_SUMMARY.md)

# Integration Tests

## 📋 Overview

Integration tests สำหรับทดสอบการทำงานร่วมกันของหลาย components/services โดยใช้ **Jest** และเชื่อมต่อกับ database/API จริง

## 📁 Structure

```
integration/
├── affiliate/      # Affiliate system integration (signup, booking, payment, commission)
├── database/       # Database utilities and admin management
├── payments/       # Payment flow with Stripe integration
└── analytics/      # Google Analytics integration
```

## 🚀 Running Tests

### รัน integration tests ทั้งหมด
```bash
npm run test:integration
```

### รัน tests แต่ละหมวด
```bash
npm run test:integration:affiliate
npm run test:integration:database
npm run test:integration:payments
npm run test:integration:analytics
```

### รัน test file เฉพาะ
```bash
npm test -- tests/integration/affiliate/signup-flow.test.ts
```

## ✅ Test Coverage

### Affiliate System (16 test cases) ✅
- ✅ **Signup Flow** (4 test cases)
  - Signup with referral code in URL
  - Signup with referral code in sessionStorage
  - Signup without referral code
  - Signup with invalid referral code

- ✅ **Booking Flow** (3 test cases)
  - Booking by referred user
  - Booking by non-referred user
  - Multiple bookings by same referred user

- ✅ **Payment Flow** (4 test cases)
  - Payment success for booking
  - Payment success for product purchase
  - Payment success for event ticket
  - Payment failure

- ✅ **Commission Calculation** (3 test cases)
  - Commission rates validation
  - Commission amount calculation
  - Zero value conversions

- ✅ **Affiliate Dashboard** (2 test cases)
  - GET /api/affiliate returns correct stats
  - Dashboard displays data correctly

### Database Integration (5 tests) ✅
- ✅ Admin management
- ✅ Database utilities
- ✅ Development setup
- ✅ Storage configuration

### Payments Integration ⏳
- ⏳ Stripe webhook integration
- ⏳ Payment intent flow
- ⏳ Refund flow
- ⏳ Dispute handling

### Analytics Integration (15+ test cases) ⏳
- ⏳ Google Analytics setup
- ⏳ Page view tracking
- ⏳ Event tracking (signup, login, booking, payment)
- ⏳ Conversion tracking
- ⏳ Error handling

## 📝 Writing Integration Tests

### Test Template
```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Feature Integration', () => {
  let supabase;

  beforeAll(async () => {
    // Setup: Create test database connection
    supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  });

  afterAll(async () => {
    // Cleanup: Remove test data
  });

  it('should complete full flow', async () => {
    // Arrange: Create test data

    // Act: Execute flow

    // Assert: Verify results

    // Cleanup: Delete test data
  });
});
```

### Best Practices
1. ใช้ real database/API connections
2. Clean up test data after each test
3. Use transactions for rollback
4. Test happy path และ error scenarios
5. Verify side effects (database changes, API calls)
6. Use proper authentication/authorization
7. Test timing and race conditions

## 🔧 Environment Setup

Integration tests ต้องการ environment variables:

```bash
# .env.local or .env.test
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_test_key
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id (optional)
```

## 🎯 Priority Tests to Write

### 🔴 High Priority
1. Payment flow with Stripe webhooks
2. Booking creation with database integrity
3. User authentication flow
4. Partner application approval flow

### 🟠 Medium Priority
1. Analytics event tracking
2. Email notification flow
3. File upload integration
4. Search functionality

### 🟡 Low Priority
1. Newsletter subscription
2. QR code generation
3. PDF export

## 🐛 Troubleshooting

### Database connection errors
- ตรวจสอบ environment variables
- ตรวจสอบ Supabase project status
- ตรวจสอบ network connectivity

### Test data conflicts
- ใช้ unique identifiers สำหรับ test data
- Clean up data in afterEach/afterAll hooks
- Use test database if available

### Stripe webhook errors
- ใช้ Stripe test mode
- Use Stripe CLI for local webhook testing
- Verify webhook signature

## 📚 References

- [Testing Summary](../../docs/TESTING_SUMMARY.md)
- [Affiliate System Tests](./affiliate/README.md)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

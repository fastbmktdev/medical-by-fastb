# Affiliate System Tests

This directory contains comprehensive tests for the affiliate/referral system.

## Test Files

### Signup & Registration
- `test-affiliate-signup.js` - Basic affiliate signup flow
- `test-affiliate-signup-no-referral.js` - Signup without referral code
- `test-affiliate-signup-invalid-referral.js` - Signup with invalid referral code

### Booking & Referrals
- `test-affiliate-booking.js` - Single booking with referral
- `test-affiliate-booking-multiple.js` - Multiple bookings tracking
- `test-affiliate-booking-non-referred.js` - Bookings without referral

### Commission Calculations
- `test-affiliate-commission-calculation.js` - Commission calculation logic
- `test-affiliate-commission-rates.js` - Different commission rate scenarios
- `test-affiliate-commission-zero.js` - Zero commission edge cases

### Payment Processing
- `test-affiliate-payment-booking.js` - Payment for bookings with referral
- `test-affiliate-payment-product.js` - Payment for product purchases
- `test-affiliate-payment-ticket.js` - Payment for ticket purchases
- `test-affiliate-payment-failure.js` - Payment failure scenarios

### Analytics & Stats
- `test-affiliate-stats-api.js` - Affiliate statistics API endpoints

## Running Tests

### Run All Affiliate Tests
```bash
# Run all tests in this directory
npm run test:affiliate

# Or using Node directly
for file in tests/affiliate/test-*.js; do node "$file"; done
```

### Run Individual Tests
```bash
# Signup tests
node tests/affiliate/test-affiliate-signup.js

# Commission tests
node tests/affiliate/test-affiliate-commission-calculation.js

# Payment tests
node tests/affiliate/test-affiliate-payment-booking.js
```

## Test Coverage

- ✅ Affiliate signup and registration
- ✅ Referral code generation and validation
- ✅ Booking tracking with referrals
- ✅ Commission calculations
- ✅ Multiple booking scenarios
- ✅ Payment integration
- ✅ Stats and analytics API
- ✅ Edge cases and error handling

## Test Requirements

All tests require:
- Supabase local instance running
- Test environment variables in `.env.local`
- Test database with affiliate tables
- Mock payment provider (for payment tests)

## Related Tests

- [E2E Tests](../e2e/) - End-to-end affiliate dashboard tests
- [Integration Tests](../integration/) - System integration tests
- [Unit Tests](../unit/) - Individual function tests

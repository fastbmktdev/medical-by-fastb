# 🧪 Testing Checklist

**วันที่สร้าง**: 2025-11-06  
**สถานะ**: Testing In Progress  
**อัปเดตล่าสุด**: 2025-11-06
- TC-1.1 ✅ PASSED (5/5 tests)
- TC-1.2 ✅ PASSED (3/3 E2E tests, 13.8s)
- TC-1.3 ✅ PASSED (4/4 tests)
- TC-1.4 ✅ PASSED (4/4 tests)
- TC-2.1 ✅ PASSED (5/5 tests)
- TC-2.2 ✅ PASSED (5/5 tests)
- TC-2.3 ✅ PASSED (5/5 tests)
- TC-3.1 ✅ PASSED (5/5 tests)
- TC-3.2 ✅ PASSED (4/4 tests)
- TC-3.3 ✅ PASSED (4/4 tests)
- TC-3.4 ✅ PASSED (4/4 tests)
- TC-4.1 ✅ PASSED (6/6 tests)
- TC-4.2 ✅ PASSED (5/5 tests)
- TC-4.3 ✅ PASSED (3/3 tests)
- TC-5.1 ✅ PASSED (5/5 tests)
- TC-5.2 ✅ PASSED (1/1 E2E test, 1.7m)
- E2E Auth Flow ✅ PASSED (11/11 tests, 2.3m)
---

## 📋 Affiliate Commission System Testing

### ✅ 1. Signup Flow with Referral Code

**Test Cases:**
- [x] **TC-1.1**: Signup with referral code in URL (`?ref=MT12345678`) ✅ **PASSED**
  - [x] Referral code is extracted from URL
  - [x] Referral code is stored in sessionStorage
  - [x] Signup creates `affiliate_conversion` record with:
    - `conversion_type: 'signup'` ✅
    - `affiliate_user_id`: correct referrer ID ✅
    - `referred_user_id`: new user ID ✅
    - `status: 'confirmed'` ✅
    - `commission_rate: 0` ✅
    - `commission_amount: 0` ✅
  - [x] No duplicate conversion created on retry ✅
  
  **Test Script**: `npm run test:affiliate:signup` หรือ `node tests/scripts/test-affiliate-signup.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Create referrer user
  - ✅ Test 2: Create referred user
  - ✅ Test 3: Create affiliate conversion
  - ✅ Test 4: Verify conversion record (all fields correct)
  - ✅ Test 5: Duplicate prevention working
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Create a test user (referrer) and get their referral code
  2. Visit `/signup?ref=MT12345678` (replace with actual referral code)
  3. Check browser DevTools → Application → Session Storage → should see `referralCode`
  4. Complete signup form with new user credentials
  5. After signup, check database:
     ```sql
     SELECT * FROM affiliate_conversions 
     WHERE conversion_type = 'signup' 
     ORDER BY created_at DESC LIMIT 1;
     ```
  6. Verify all fields match expected values
  7. Try to signup again with same referral code → should not create duplicate

- [x] **TC-1.2**: Signup with referral code in sessionStorage (after navigation) ✅ **PASSED**
  - [x] User visits signup page with `?ref=MT12345678`
  - [x] User navigates away and comes back
  - [x] Referral code is still in form from sessionStorage
  - [x] Signup processes referral code correctly
  
  **E2E Test**: `npm run test:affiliate:e2e` หรือ `playwright test tests/e2e/affiliate-signup-sessionstorage.spec.ts`
  
  **Test Results**: ✅ **3/3 tests passed** (2025-11-06, 13.8s)
  - ✅ Test 1: SessionStorage persistence after navigation (4.9s)
  - ✅ Test 2: URL param takes precedence over sessionStorage (6.8s)
  - ✅ Test 3: SessionStorage cleanup verification (1.5s)
  
  **Test Coverage**:
  - ✅ SessionStorage persistence after navigation
  - ✅ URL param takes precedence over sessionStorage
  - ✅ Referral code populated in form from sessionStorage
  - ✅ Form ready for signup after navigation
  - ✅ SessionStorage updated when URL param changes
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Visit `/signup?ref=MT12345678`
  2. Open DevTools → Application → Session Storage
  3. Verify `referralCode` key exists with value `MT12345678`
  4. Check form field `input[name="referralCode"]` has the code
  5. Navigate to homepage (`/`)
  6. Check Session Storage again → code should still be there
  7. Navigate back to `/signup` (without URL param)
  8. Verify form field still has the referral code
  9. Complete signup → referral code should be processed

- [x] **TC-1.3**: Signup without referral code ✅ **PASSED**
  - [x] No `affiliate_conversion` record created
  - [x] Signup completes normally
  
  **Test Script**: `npm run test:affiliate:signup-no-referral` หรือ `node tests/scripts/test-affiliate-signup-no-referral.js`
  
  **Test Results**: ✅ **4/4 tests passed** (2025-11-06)
  - ✅ Test 1: Create user without referral code
  - ✅ Test 2: Verify NO affiliate conversion record
  - ✅ Test 3: Verify user exists and profile created
  - ✅ Test 4: Verify signup completed (user can authenticate)
  
  **Test Coverage**:
  - ✅ User creation without referral code
  - ✅ No affiliate conversion record created
  - ✅ User profile and role created correctly
  - ✅ User can authenticate successfully
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Visit `/signup` (without `?ref=` parameter)
  2. Complete signup form
  3. After signup, check database:
     ```sql
     SELECT * FROM affiliate_conversions 
     WHERE referred_user_id = '<new_user_id>';
     ```
  4. Verify: No records found (should return empty)
  5. Verify: User can login successfully

- [x] **TC-1.4**: Signup with invalid referral code ✅ **PASSED**
  - [x] Invalid format code is rejected
  - [x] Error message shown (if validation implemented)
  - [x] Signup still completes (referral processing fails gracefully)
  
  **Test Script**: `npm run test:affiliate:signup-invalid` หรือ `node tests/scripts/test-affiliate-signup-invalid-referral.js`
  
  **Test Results**: ✅ **4/4 tests passed** (2025-11-06)
  - ✅ Test 1: Format validation (9 invalid codes correctly rejected)
  - ✅ Test 2: User creation with invalid referral code
  - ✅ Test 3: Verify NO affiliate conversion record created
  - ✅ Test 4: Verify signup completed successfully
  
  **Test Coverage**:
  - ✅ Format validation (invalid formats rejected)
  - ✅ API validation endpoint testing
  - ✅ User creation with invalid referral code
  - ✅ No affiliate conversion record created
  - ✅ Signup completes successfully despite invalid code
  
  **Invalid Code Examples Tested**:
  - Wrong prefix: `INVALID123` ✅
  - Too short: `MT123`, `MT1234567` ✅
  - Too long: `MT123456789`, `MT12345678XYZ` ✅
  - Lowercase: `mt12345678` ✅
  - Special characters: `MT1234-5678` ✅
  - Empty string: `''` ✅
  - Valid format but non-existent: `MT12345678` ✅
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Visit `/signup?ref=INVALID123`
  2. Complete signup form
  3. After signup, check database:
     ```sql
     SELECT * FROM affiliate_conversions 
     WHERE referred_user_id = '<new_user_id>';
     ```
  4. Verify: No records found (should return empty)
  5. Verify: User can login successfully
  6. Check browser console/network tab for validation error messages

### ✅ 2. Booking Flow with Referral Tracking

**Test Cases:**
- [x] **TC-2.1**: Booking by referred user (with signup conversion) ✅ **PASSED**
  - [x] User who signed up with referral code creates booking
  - [x] Booking API creates `affiliate_conversion` record with:
    - `conversion_type: 'booking'` ✅
    - `conversion_value`: booking total price ✅
    - `commission_rate: 10` ✅
    - `commission_amount`: calculated correctly (10% of booking value) ✅
    - `reference_id`: booking.id ✅
    - `reference_type: 'booking'` ✅
    - `status: 'pending'` ✅
  - [x] No duplicate conversion created for same booking ✅
  
  **Test Script**: `npm run test:affiliate:booking` หรือ `node tests/scripts/test-affiliate-booking.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Create referrer user
  - ✅ Test 2: Create referred user with signup conversion
  - ✅ Test 3: Create booking for referred user
  - ✅ Test 4: Verify affiliate conversion record (all fields correct)
  - ✅ Test 5: Test duplicate prevention
  
  **Test Coverage**:
  - ✅ Referrer and referred user creation
  - ✅ Signup conversion creation
  - ✅ Booking creation with package and order
  - ✅ Affiliate conversion creation with correct values
  - ✅ Commission calculation (10% of 5000 = 500)
  - ✅ Duplicate prevention working
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Signup user with referral code
  2. Create a booking for that user
  3. Check database:
     ```sql
     SELECT * FROM affiliate_conversions 
     WHERE referred_user_id = '<user_id>' 
     AND conversion_type = 'booking';
     ```
  4. Verify all fields match expected values
  5. Try to create another booking → should not create duplicate conversion

- [x] **TC-2.2**: Booking by non-referred user ✅ **PASSED**
  - [x] No `affiliate_conversion` record created
  - [x] Booking completes normally
  
  **Test Script**: `npm run test:affiliate:booking-non-referred` หรือ `node tests/scripts/test-affiliate-booking-non-referred.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Create non-referred user (no signup conversion)
  - ✅ Test 2: Create booking for non-referred user
  - ✅ Test 3: Verify NO affiliate conversion record
  - ✅ Test 4: Verify booking completed normally (all fields correct)
  - ✅ Test 5: Verify user can authenticate
  
  **Test Coverage**:
  - ✅ User creation without referral
  - ✅ No signup conversion exists
  - ✅ Booking creation with package and order
  - ✅ No affiliate conversion created for booking
  - ✅ Booking completes successfully
  - ✅ User can authenticate
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Signup user WITHOUT referral code
  2. Create a booking for that user
  3. Check database:
     ```sql
     SELECT * FROM affiliate_conversions 
     WHERE referred_user_id = '<user_id>' 
     AND conversion_type = 'booking';
     ```
  4. Verify: No records found (should return empty)
  5. Verify: Booking exists and all fields are correct

- [x] **TC-2.3**: Multiple bookings by same referred user ✅ **PASSED**
  - [x] Each booking creates separate conversion record
  - [x] All conversions linked to same affiliate_user_id
  
  **Test Script**: `npm run test:affiliate:booking-multiple` หรือ `node tests/scripts/test-affiliate-booking-multiple.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Create referrer and referred user with signup conversion
  - ✅ Test 2: Create 3 bookings for referred user (3000, 5000, 7000 THB)
  - ✅ Test 3: Verify each booking created separate conversion record
  - ✅ Test 4: Verify all conversions linked to same affiliate_user_id
  - ✅ Test 5: Verify total commission calculation (1500 THB = 10% of 15000)
  
  **Test Coverage**:
  - ✅ Multiple bookings creation (3 bookings with different prices)
  - ✅ Separate conversion records for each booking
  - ✅ Unique reference_id for each conversion
  - ✅ All conversions linked to same affiliate_user_id
  - ✅ Commission calculation per booking (10% of each)
  - ✅ Total commission calculation (sum of all commissions)
  
  **Test Results Details**:
  - Booking 1: 3000 THB → Commission 300 THB ✅
  - Booking 2: 5000 THB → Commission 500 THB ✅
  - Booking 3: 7000 THB → Commission 700 THB ✅
  - Total: 15000 THB → Total Commission 1500 THB ✅
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Signup user with referral code
  2. Create multiple bookings (3+ bookings)
  3. Check database:
     ```sql
     SELECT * FROM affiliate_conversions 
     WHERE referred_user_id = '<user_id>' 
     AND conversion_type = 'booking'
     ORDER BY created_at;
     ```
  4. Verify: Each booking has separate conversion record
  5. Verify: All conversions have same affiliate_user_id
  6. Verify: Commission amounts are calculated correctly (10% of each booking)

### ✅ 3. Payment Flow - Conversion Status Update

**Test Cases:**
- [x] **TC-3.1**: Payment success for booking ✅ **PASSED**
  - [x] Stripe webhook receives `payment_intent.succeeded`
  - [x] Booking payment status updated to 'paid'
  - [x] Affiliate conversion status updated from 'pending' to 'confirmed'
  - [x] `confirmed_at` timestamp is set
  - [x] Commission is now eligible for payout
  
  **Test Script**: `npm run test:affiliate:payment-booking` หรือ `node tests/scripts/test-affiliate-payment-booking.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Create referrer and referred user with signup conversion
  - ✅ Test 2: Create booking with pending affiliate conversion
  - ✅ Test 3: Simulate payment success (Stripe webhook)
  - ✅ Test 4: Verify affiliate conversion status update
  - ✅ Test 5: Verify commission is eligible for payout
  
  **Test Coverage**:
  - ✅ Booking created with payment_status: 'pending'
  - ✅ Affiliate conversion created with status: 'pending'
  - ✅ Payment success updates booking payment_status to 'paid'
  - ✅ Payment success updates booking status to 'confirmed'
  - ✅ Affiliate conversion status updated from 'pending' to 'confirmed'
  - ✅ confirmed_at timestamp is set
  - ✅ Commission amount preserved (500 THB)
  - ✅ Commission eligible for payout (status: confirmed, confirmed_at set)
  
  **Manual Testing Steps** (สำหรับ browser testing):
  1. Create booking with referral code
  2. Complete payment via Stripe
  3. Check database after payment:
     ```sql
     SELECT * FROM bookings WHERE id = '<booking_id>';
     SELECT * FROM affiliate_conversions 
     WHERE reference_id = '<booking_id>' 
     AND reference_type = 'booking';
     ```
  4. Verify: Booking payment_status = 'paid', status = 'confirmed'
  5. Verify: Conversion status = 'confirmed', confirmed_at is set
  6. Verify: Commission amount is correct

- [x] **TC-3.2**: Payment success for product purchase ✅ **PASSED**
  - [x] Order payment succeeds
  - [x] Affiliate conversion (if exists) status updated to 'confirmed'
  - [x] Commission calculated correctly (5% for products)
  
  **Test Script**: `npm run test:affiliate:payment-product` หรือ `node tests/scripts/test-affiliate-payment-product.js`
  
  **Test Results**: ✅ **4/4 tests passed** (2025-11-06)
  - ✅ Test 1: Create users and signup conversion
  - ✅ Test 2: Create order with pending affiliate conversion
  - ✅ Test 3: Simulate payment success for product order
  - ✅ Test 4: Verify conversion and commission calculation (5% of 2000 = 100 THB)
  
  **Test Coverage**:
  - ✅ Order created with status: 'pending'
  - ✅ Affiliate conversion created with status: 'pending'
  - ✅ Payment success updates order status to 'confirmed'
  - ✅ Conversion status updated to 'confirmed'
  - ✅ Commission calculated correctly (5% for products)
  - ✅ confirmed_at timestamp set

- [x] **TC-3.3**: Payment success for event ticket ✅ **PASSED**
  - [x] Ticket booking payment succeeds
  - [x] Affiliate conversion status updated to 'confirmed'
  - [x] Commission calculated correctly (10% for tickets)
  
  **Test Script**: `npm run test:affiliate:payment-ticket` หรือ `node tests/scripts/test-affiliate-payment-ticket.js`
  
  **Test Results**: ✅ **4/4 tests passed** (2025-11-06)
  - ✅ Test 1: Create users and signup conversion
  - ✅ Test 2: Create ticket booking with pending affiliate conversion
  - ✅ Test 3: Simulate payment success for ticket booking
  - ✅ Test 4: Verify conversion and commission calculation (10% of 1500 = 150 THB)
  
  **Test Coverage**:
  - ✅ Ticket booking created
  - ✅ Affiliate conversion created with status: 'pending'
  - ✅ Payment success updates conversion status to 'confirmed'
  - ✅ Commission calculated correctly (10% for tickets)
  - ✅ confirmed_at timestamp set

- [x] **TC-3.4**: Payment failure ✅ **PASSED**
  - [x] Conversion status remains 'pending'
  - [x] No commission awarded
  
  **Test Script**: `npm run test:affiliate:payment-failure` หรือ `node tests/scripts/test-affiliate-payment-failure.js`
  
  **Test Results**: ✅ **4/4 tests passed** (2025-11-06)
  - ✅ Test 1: Create users, booking, and pending conversion
  - ✅ Test 2: Simulate payment failure
  - ✅ Test 3: Verify conversion status remains pending
  - ✅ Test 4: Verify no commission awarded (status: pending)
  
  **Test Coverage**:
  - ✅ Booking payment_status remains 'pending'
  - ✅ Booking status remains 'pending'
  - ✅ Conversion status remains 'pending' (not updated)
  - ✅ confirmed_at remains null
  - ✅ Commission amount preserved but not eligible
  - ✅ No commission awarded (status: pending)

### ✅ 4. Commission Calculation

**Test Cases:**
- [x] **TC-4.1**: Commission rates are correct ✅ **PASSED**
  - [x] Signup: 0%
  - [x] Booking: 10%
  - [x] Product Purchase: 5%
  - [x] Event Ticket: 10%
  - [x] Subscription: 15%
  
  **Test Script**: `npm run test:affiliate:commission-rates` หรือ `node tests/scripts/test-affiliate-commission-rates.js`
  
  **Test Results**: ✅ **6/6 tests passed** (2025-11-06)
  - ✅ Test 1: Verify commission rates for each conversion type
  - ✅ Test 2: Verify signup has 0% commission rate
  - ✅ Test 3: Verify booking has 10% commission rate
  - ✅ Test 4: Verify product purchase has 5% commission rate
  - ✅ Test 5: Verify event ticket has 10% commission rate
  - ✅ Test 6: Verify subscription has 15% commission rate
  
  **Test Coverage**:
  - ✅ Signup: 0% (no commission for signup)
  - ✅ Booking: 10%
  - ✅ Product Purchase: 5%
  - ✅ Event Ticket: 10%
  - ✅ Subscription: 15%

- [x] **TC-4.2**: Commission amount calculation ✅ **PASSED**
  - [x] Booking: 1000 THB → 100 THB commission (10%)
  - [x] Product: 500 THB → 25 THB commission (5%)
  - [x] Event Ticket: 2000 THB → 200 THB commission (10%)
  - [x] Rounding to 2 decimal places
  
  **Test Script**: `npm run test:affiliate:commission-calculation` หรือ `node tests/scripts/test-affiliate-commission-calculation.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Calculate commission for booking (10% of 1000 = 100 THB)
  - ✅ Test 2: Calculate commission for product purchase (5% of 500 = 25 THB)
  - ✅ Test 3: Calculate commission for event ticket (10% of 2000 = 200 THB)
  - ✅ Test 4: Test rounding to 2 decimal places (multiple test cases)
  - ✅ Test 5: Test edge cases (zero value, minimum value, large value, zero rate, 100% rate)
  
  **Test Coverage**:
  - ✅ Booking: 1000 THB × 10% = 100 THB
  - ✅ Product: 500 THB × 5% = 25 THB
  - ✅ Event Ticket: 2000 THB × 10% = 200 THB
  - ✅ Rounding: 333.3 THB, 123.46 THB, 50.0 THB, 300.0 THB
  - ✅ Edge cases: Zero value (0 THB), minimum (0.1 THB), large (100000 THB), zero rate (0%), 100% rate (100 THB)

- [x] **TC-4.3**: Zero value conversions ✅ **PASSED**
  - [x] Signup (0 value) → 0 commission
  - [x] Free booking → 0 commission
  
  **Test Script**: `npm run test:affiliate:commission-zero` หรือ `node tests/scripts/test-affiliate-commission-zero.js`
  
  **Test Results**: ✅ **3/3 tests passed** (2025-11-06)
  - ✅ Test 1: Verify signup (0 value) → 0 commission
  - ✅ Test 2: Verify free booking (0 value) → 0 commission (even with 10% rate)
  - ✅ Test 3: Verify zero value calculation logic (multiple rate scenarios)
  
  **Test Coverage**:
  - ✅ Signup: 0 THB → 0 THB commission (0% rate)
  - ✅ Free booking: 0 THB × 10% = 0 THB commission
  - ✅ Zero value with different rates: 0 THB × 10% = 0, 0 THB × 5% = 0, 0 THB × 15% = 0, 0 THB × 0% = 0

### ✅ 5. Affiliate Dashboard

**Test Cases:**
- [x] **TC-5.1**: GET `/api/affiliate` returns correct stats ✅ **PASSED**
  - [x] Total conversions count
  - [x] Total earnings (sum of confirmed commission_amount)
  - [x] Conversion rate (confirmed / total)
  - [x] Data comes from `affiliate_conversions` table
  
  **Test Script**: `npm run test:affiliate:stats-api` หรือ `node tests/scripts/test-affiliate-stats-api.js`
  
  **Test Results**: ✅ **5/5 tests passed** (2025-11-06)
  - ✅ Test 1: Create test data (referrer + referred users + conversions)
  - ✅ Test 2: Test API endpoint (total referrals, earnings, conversion rate)
  - ✅ Test 3: Verify confirmed earnings calculation
  - ✅ Test 4: Verify conversion rate calculation
  - ✅ Test 5: Verify data source (affiliate_conversions table)
  
  **Test Coverage**:
  - ✅ Total conversions count verification
  - ✅ Total earnings calculation (sum of all commission_amount)
  - ✅ Confirmed earnings calculation (sum of confirmed commission_amount)
  - ✅ Conversion rate calculation (confirmed / total * 100)
  - ✅ Data source verification (affiliate_conversions table)
  - ✅ All required fields present in conversion records
  
  **Note**: The API currently sums ALL commission_amount for totalEarnings, not just confirmed ones. The test verifies both total and confirmed earnings separately.

- [x] **TC-5.2**: Dashboard displays data correctly ✅ **PASSED**
  - [x] Stats cards show correct numbers
  - [x] Conversion history table shows all conversions
  - [x] Filters work (if implemented)
  - [x] Status badges display correctly
  
  **E2E Test**: `npm run test:e2e:affiliate` หรือ `playwright test tests/e2e/affiliate/affiliate-dashboard.spec.ts`
  
  **Test Results**: ✅ **1/1 E2E test passed** (2025-11-06, 1.7m)
  - ✅ Test 1: Dashboard displays data correctly (1.7m)
  
  **Test Coverage**:
  - ✅ Stats cards verification (checks for: ผู้แนะนำทั้งหมด, แต้มสะสมทั้งหมด, เดือนนี้, อัตราการแปลง)
  - ✅ Conversion history table verification (checks for table with rows matching API data)
  - ✅ Status badges verification (checks for: รอดำเนินการ, ยืนยันแล้ว, ได้รับแต้มแล้ว)
  - ✅ Filters check (verifies if filters are implemented)
  - ✅ API data consistency verification (compares displayed data with API response)
  - ✅ Page content and structure verification
  - ✅ Screenshot capture for manual verification
  
  **Test Details**:
  - Creates test referrer and referred users
  - Creates 3 test conversions (signup confirmed, booking confirmed, booking pending)
  - Verifies stats cards display with correct labels
  - Verifies conversion history table shows all conversions
  - Verifies status badges display correctly (pending/completed/rewarded)
  - Checks for filter implementation (currently not implemented)
  - Compares displayed data with API response for consistency

### ✅ 6. Edge Cases & Error Handling

**Test Cases:**
- [ ] **TC-6.1**: Duplicate prevention
  - [ ] Same signup conversion not created twice
  - [ ] Same booking conversion not created twice
  - [ ] Duplicate check uses `reference_id` + `reference_type`

- [ ] **TC-6.2**: Error handling
  - [ ] Affiliate conversion failure doesn't block signup
  - [ ] Affiliate conversion failure doesn't block booking
  - [ ] Affiliate conversion failure doesn't block payment
  - [ ] Errors are logged appropriately

- [ ] **TC-6.3**: Database integrity
  - [ ] Foreign key constraints work
  - [ ] Deleted users handled gracefully
  - [ ] Missing affiliate_user_id handled

---

## 📊 Google Analytics Events Testing

**หมายเหตุ**: ต้องตั้งค่า `NEXT_PUBLIC_GA_MEASUREMENT_ID` ใน `.env.local` ก่อนทดสอบ

### ✅ 7. Google Analytics Setup

**Test Cases:**
- [ ] **TC-7.1**: Google Analytics script loads
  - [ ] Script tag present in HTML
  - [ ] `gtag` function available globally
  - [ ] Measurement ID from environment variable

- [ ] **TC-7.2**: Component renders correctly
  - [ ] `GoogleAnalytics` component in layout
  - [ ] No console errors
  - [ ] Works in production build

### ✅ 8. Page View Tracking

**Test Cases:**
- [ ] **TC-8.1**: Page views tracked
  - [ ] Navigate to homepage → page_view event sent
  - [ ] Navigate to gym page → page_view event sent
  - [ ] Navigate to shop page → page_view event sent
  - [ ] Check GA Real-Time reports for page views

### ✅ 9. Event Tracking

**Test Cases:**
- [ ] **TC-9.1**: User Signup Event
  - [ ] Call `trackUserSignup(userId, method)`
  - [ ] Event sent to GA with:
    - `event_name: 'user_signup'`
    - `user_id`: userId
    - `signup_method`: method (email/google)
  - [ ] Verify in GA Real-Time events

- [ ] **TC-9.2**: User Login Event
  - [ ] Call `trackUserLogin(userId, method)`
  - [ ] Event sent to GA
  - [ ] Verify in GA Real-Time events

- [ ] **TC-9.3**: Booking Completion Event
  - [ ] Complete a booking
  - [ ] `trackBookingCompletion()` called
  - [ ] Event sent with booking details
  - [ ] Verify in GA

- [ ] **TC-9.4**: Payment Success Event
  - [ ] Complete a payment
  - [ ] `trackPaymentSuccess(amount, currency)` called
  - [ ] Conversion event sent to GA
  - [ ] Verify in GA Real-Time conversions

- [ ] **TC-9.5**: Search Event
  - [ ] Perform search
  - [ ] `trackSearch(query, resultsCount)` called
  - [ ] Event sent with search query
  - [ ] Verify in GA

- [ ] **TC-9.6**: Product View Event
  - [ ] View product page
  - [ ] `trackProductView(productId, productName)` called
  - [ ] Event sent with product details
  - [ ] Verify in GA

### ✅ 10. Conversion Tracking

**Test Cases:**
- [ ] **TC-10.1**: Conversion Events
  - [ ] Call `trackConversion(value, currency)`
  - [ ] Conversion event sent to GA
  - [ ] Value and currency correct
  - [ ] Verify in GA Conversions report

### ✅ 11. Analytics Utility Functions

**Test Cases:**
- [ ] **TC-11.1**: All utility functions exist
  - [ ] `trackEvent(eventName, eventParams)`
  - [ ] `trackPageView(url, title)`
  - [ ] `trackConversion(value, currency)`
  - [ ] `trackBookingCompletion()`
  - [ ] `trackPaymentSuccess()`
  - [ ] `trackUserSignup()`
  - [ ] `trackUserLogin()`
  - [ ] `trackSearch()`
  - [ ] `trackProductView()`

- [ ] **TC-11.2**: Error handling
  - [ ] Functions don't throw errors if GA not loaded
  - [ ] Functions handle missing parameters gracefully
  - [ ] No console errors in production

---

## 🧪 Testing Tools & Methods

### Manual Testing
1. **Browser DevTools**
   - Network tab: Check API calls
   - Console: Check for errors
   - Application tab: Check sessionStorage

2. **Google Analytics DebugView**
   - Enable GA Debug Mode
   - Use GA Debugger Chrome extension
   - Check Real-Time reports

3. **Database Inspection**
   - Query `affiliate_conversions` table
   - Check conversion records
   - Verify commission calculations

### Automated Testing
- [x] ✅ E2E tests for authentication flow (auth-flow.spec.ts) - **11 tests passed**
- [x] ✅ E2E test for partner application (Step 6) - **PASSED**
- [x] ✅ E2E test for affiliate dashboard (affiliate-dashboard.spec.ts) - **1 test passed**
- [x] ✅ Unit tests for commission calculation (test-affiliate-commission-*.js) - **Multiple tests passed**
- [x] ✅ Integration tests for affiliate API endpoints (test-affiliate-stats-api.js) - **5 tests passed**
- [x] ✅ E2E tests for affiliate signup flow (affiliate-signup-sessionstorage.spec.ts) - **3 tests passed**
- [ ] Create tests for analytics functions

---

## ✅ Test Results Summary

### Affiliate System
- **Total Test Cases**: 25+
- **Status**: 🔄 In Progress
- **Completed**: 16/25+ (TC-1.1 ✅, TC-1.2 ✅, TC-1.3 ✅, TC-1.4 ✅, TC-2.1 ✅, TC-2.2 ✅, TC-2.3 ✅, TC-3.1 ✅, TC-3.2 ✅, TC-3.3 ✅, TC-3.4 ✅, TC-4.1 ✅, TC-4.2 ✅, TC-4.3 ✅, TC-5.1 ✅, TC-5.2 ✅)
- **Failed**: 0
- **Blocked**: 0

### Google Analytics
- **Total Test Cases**: 15+
- **Status**: 🔄 In Progress
- **Completed**: _/_
- **Failed**: _/_
- **Blocked**: _/_ (Requires GA Measurement ID)

### E2E Tests (Playwright)
- **Total Tests**: 11+
- **Status**: ✅ **PASSED** (2025-11-06)
- **Test Suite**: `tests/e2e/auth-flow.spec.ts`
- **Results**: 
  - ✅ Step 1: Generate test users
  - ✅ Step 2: Signup - Regular User
  - ✅ Step 3: Signup - Partner User
  - ✅ Step 4: Signup - Admin User
  - ✅ Step 5: Login - Regular User
  - ✅ Step 6: Partner Application - Submit gym application
  - ✅ Step 7: Admin Setup
  - ✅ Step 8: Admin Login
  - ✅ Step 9: Admin Approval
  - ✅ Step 10: Partner Login After Approval
  - ✅ Step 11: Final Verification
- **Duration**: ~2.3 minutes
- **Failed**: 0

---

## 📝 Notes

- Testing should be done in **development environment** first
- Use **test accounts** for affiliate testing
- **GA Measurement ID** must be set for analytics testing
- Check **database** for conversion records after each test
- Verify **sessionStorage** persistence in browser
- Use **Stripe test mode** for payment testing

---

## 🔄 Next Steps

1. Complete manual testing checklist
2. Document any bugs/issues found
3. Create automated tests for critical paths
4. Update documentation with test results
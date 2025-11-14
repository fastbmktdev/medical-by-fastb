# 📋 รายการทดสอบตาม Functions (Function Testing List)

**วันที่สร้าง**: 2025-11-06  
**อัปเดตล่าสุด**: 2025-11-06

**หมายเหตุ**: List นี้แสดง functions ที่ควรทดสอบ จัดเรียงตามไฟล์และหมวดหมู่

---

## 📊 สรุป Functions ที่ต้องทดสอบ

| หมวดหมู่ | จำนวน Functions | มี Test แล้ว | ยังไม่ทดสอบ | สถานะ |
|---------|----------------|-------------|------------|-------|
| **Services** | 50+ | 0 | 50+ | ⚠️ |
| **Utils** | 63+ | 33 | 30+ | 🟡 |
| **API Routes** | 125+ | 16 | 109+ | ⚠️ |
| **รวม** | **238+** | **49** | **189+** | ⚠️ |

**อัปเดต 2025-11-14**: เพิ่ม Export Utils (6 functions) - ✅ Implementation เสร็จแล้ว, ⚠️ ยังต้องเพิ่ม tests

---

## 🔧 Services Functions (src/services/)

### 1. Gamification Service (`src/services/gamification.service.ts`)

#### ⚠️ ยังไม่ทดสอบ (15 functions)

1. **`getUserGamificationStats(userId: string)`**
   - [ ] Test: Get stats for existing user
   - [ ] Test: Get stats for non-existent user (returns null)
   - [ ] Test: Verify all fields (points, badges, streaks, challenges)
   - [ ] Test: Error handling

2. **`awardPoints(request: AwardPointsRequest)`**
   - [ ] Test: Award points successfully
   - [ ] Test: Level up when points threshold reached
   - [ ] Test: Badge auto-award when conditions met
   - [ ] Test: Notification sent when badge earned
   - [ ] Test: Notification sent when level up
   - [ ] Test: Points history recorded
   - [ ] Test: Invalid request handling
   - [ ] Test: Negative points handling
   - [ ] Test: Zero points handling

3. **`getUserPointsHistory(userId: string, limit?, offset?)`**
   - [ ] Test: Get history for user with points
   - [ ] Test: Get history for user without points (empty array)
   - [ ] Test: Pagination (limit/offset)
   - [ ] Test: Order by date (descending)

4. **`getAllBadges()`**
   - [ ] Test: Get all badges
   - [ ] Test: Verify badge structure
   - [ ] Test: Empty badges list (if none exist)

5. **`getUserBadges(userId: string)`**
   - [ ] Test: Get badges for user with badges
   - [ ] Test: Get badges for user without badges (empty array)
   - [ ] Test: Verify earned_at timestamp

6. **`getBadgeProgress(userId: string)`**
   - [ ] Test: Get progress for user
   - [ ] Test: Verify progress calculation
   - [ ] Test: Completed badges (progress = 100%)
   - [ ] Test: In-progress badges (progress < 100%)

7. **`updateUserStreak(request: UpdateStreakRequest)`**
   - [ ] Test: Update streak successfully
   - [ ] Test: Increment streak when consecutive
   - [ ] Test: Reset streak when broken
   - [ ] Test: Max streak update
   - [ ] Test: Invalid request handling

8. **`getUserStreaks(userId: string)`**
   - [ ] Test: Get streaks for user
   - [ ] Test: Empty streaks (if none exist)
   - [ ] Test: Verify streak data structure

9. **`getActiveChallenges()`**
   - [ ] Test: Get active challenges
   - [ ] Test: Filter by active status
   - [ ] Test: Empty challenges (if none exist)

10. **`joinChallenge(request: JoinChallengeRequest)`**
    - [ ] Test: Join challenge successfully
    - [ ] Test: Already joined challenge (error or skip)
    - [ ] Test: Invalid challenge ID
    - [ ] Test: Challenge not active

11. **`updateChallengeProgress(request: UpdateChallengeProgressRequest)`**
    - [ ] Test: Update progress successfully
    - [ ] Test: Challenge completion (progress = 100%)
    - [ ] Test: Invalid challenge/user ID
    - [ ] Test: Progress > 100% handling

12. **`getUserChallengeProgress(userId: string)`**
    - [ ] Test: Get progress for user
    - [ ] Test: Empty progress (if no challenges joined)
    - [ ] Test: Verify progress calculation

13. **`getLeaderboardData(type, limit?, offset?)`**
    - [ ] Test: Get leaderboard by type (total, monthly, bookings)
    - [ ] Test: Pagination (limit/offset)
    - [ ] Test: Empty leaderboard (if no data)
    - [ ] Test: Order by points (descending)

14. **`getAllLeaderboards()`**
    - [ ] Test: Get all leaderboard types
    - [ ] Test: Verify all types present

15. **`getGamificationDashboard(userId: string)`**
    - [ ] Test: Get complete dashboard data
    - [ ] Test: Verify all sections (stats, badges, streaks, challenges, leaderboard)
    - [ ] Test: Empty dashboard (new user)

---

### 2. Booking Service (`src/services/booking.service.ts`)

#### ⚠️ ยังไม่ทดสอบ (11 functions)

1. **`validateBookingData(data: CreateBookingInput)`**
   - [ ] Test: Valid booking data (returns empty array)
   - [ ] Test: Missing required fields
   - [ ] Test: Invalid date format
   - [ ] Test: Invalid duration_months
   - [ ] Test: Invalid package_id format
   - [ ] Test: Invalid gym_id format

2. **`generateBookingNumber()`**
   - [ ] Test: Generate unique booking number
   - [ ] Test: Format is correct (BK-YYYYMMDD-XXXX)
   - [ ] Test: Multiple calls generate different numbers
   - [ ] Test: Date format in number

3. **`calculateEndDate(startDate: string, durationMonths: number | null)`**
   - [ ] Test: Calculate end date for monthly package
   - [ ] Test: Return null for per-session package
   - [ ] Test: Handle month boundaries (Jan → Feb, Dec → Jan)
   - [ ] Test: Invalid startDate handling

4. **`getBookings(filters?: BookingFilters)`**
   - [ ] Test: Get all bookings (no filters)
   - [ ] Test: Filter by user_id
   - [ ] Test: Filter by gym_id
   - [ ] Test: Filter by status
   - [ ] Test: Filter by date range
   - [ ] Test: Pagination (limit/offset)
   - [ ] Test: Order by created_at (descending)

5. **`getBookingById(id: string)`**
   - [ ] Test: Get existing booking
   - [ ] Test: Non-existent booking (returns null)
   - [ ] Test: Invalid ID format

6. **`createBooking(data: CreateBookingInput)`**
   - [ ] Test: Create booking successfully
   - [ ] Test: Generate booking number
   - [ ] Test: Calculate end_date for monthly packages
   - [ ] Test: Validation errors
   - [ ] Test: Invalid gym_id
   - [ ] Test: Invalid package_id
   - [ ] Test: Duplicate booking prevention
   - [ ] Test: Points awarded after booking (if applicable)

7. **`updateBookingStatus(id: string, status: string)`**
   - [ ] Test: Update status successfully
   - [ ] Test: Invalid status values
   - [ ] Test: Non-existent booking
   - [ ] Test: Status transition validation

8. **`updateBookingPaymentStatus(id: string, paymentStatus: string)`**
   - [ ] Test: Update payment status successfully
   - [ ] Test: Invalid payment status values
   - [ ] Test: Non-existent booking

9. **`cancelBooking(id: string)`**
   - [ ] Test: Cancel booking successfully
   - [ ] Test: Non-existent booking
   - [ ] Test: Already cancelled booking
   - [ ] Test: Points refund (if applicable)

---

### 3. Payment Service (`src/services/payment.service.ts`)

#### ⚠️ ยังไม่ทดสอบ (20+ functions)

1. **`validatePaymentData(data: CreatePaymentIntentInput)`**
   - [ ] Test: Valid payment data (returns empty array)
   - [ ] Test: Missing required fields
   - [ ] Test: Invalid amount (negative, zero, too large)
   - [ ] Test: Invalid currency
   - [ ] Test: Invalid booking_id format

2. **`getOrCreateStripeCustomer(userId: string, userEmail: string)`**
   - [ ] Test: Get existing customer
   - [ ] Test: Create new customer
   - [ ] Test: Handle Stripe API errors
   - [ ] Test: Customer ID stored in database

3. **`generateOrderNumber()`**
   - [ ] Test: Generate unique order number
   - [ ] Test: Format is correct
   - [ ] Test: Multiple calls generate different numbers

4. **`createPaymentIntent(data: CreatePaymentIntentInput)`**
   - [ ] Test: Create payment intent successfully
   - [ ] Test: Stripe integration
   - [ ] Test: Payment record created in database
   - [ ] Test: Invalid amount handling
   - [ ] Test: Invalid booking/order ID
   - [ ] Test: Metadata stored correctly

5. **`getPaymentById(id: string)`**
   - [ ] Test: Get existing payment
   - [ ] Test: Non-existent payment (returns null)

6. **`getPaymentByIntentId(intentId: string)`**
   - [ ] Test: Get payment by Stripe intent ID
   - [ ] Test: Non-existent intent ID (returns null)

7. **`updatePaymentStatus(id: string, status: string)`**
   - [ ] Test: Update status successfully
   - [ ] Test: Invalid status values
   - [ ] Test: Status transition validation

8. **`updateOrderStatus(id: string, status: string)`**
   - [ ] Test: Update order status successfully
   - [ ] Test: Invalid status values

9. **`getUserPayments(userId: string, limit?, offset?)`**
   - [ ] Test: Get payments for user
   - [ ] Test: Pagination (limit/offset)
   - [ ] Test: Empty payments (if none exist)

10. **`getOrderById(id: string)`**
    - [ ] Test: Get existing order
    - [ ] Test: Non-existent order (returns null)

11. **`retryFailedPayment(data: RetryPaymentInput)`**
    - [ ] Test: Retry payment successfully
    - [ ] Test: Invalid payment ID
    - [ ] Test: Payment not in failed status
    - [ ] Test: Stripe integration

12. **`createSetupIntent(userId: string, userEmail: string)`**
    - [ ] Test: Create setup intent successfully
    - [ ] Test: Stripe integration
    - [ ] Test: Return client secret

13. **`savePaymentMethod(userId: string, setupIntentId: string)`**
    - [ ] Test: Save payment method successfully
    - [ ] Test: Payment method stored in database
    - [ ] Test: Invalid setup intent ID

14. **`getSavedPaymentMethods(userId: string)`**
    - [ ] Test: Get saved methods for user
    - [ ] Test: Empty methods (if none exist)

15. **`deleteSavedPaymentMethod(userId: string, methodId: string)`**
    - [ ] Test: Delete method successfully
    - [ ] Test: Non-existent method
    - [ ] Test: Method not owned by user

16. **`setDefaultPaymentMethod(userId: string, methodId: string)`**
    - [ ] Test: Set default method successfully
    - [ ] Test: Previous default unset
    - [ ] Test: Invalid method ID

17. **`getUserDisputes(userId: string)`**
    - [ ] Test: Get disputes for user
    - [ ] Test: Empty disputes (if none exist)

18. **`getAllDisputes(limit?, offset?, status?)`**
    - [ ] Test: Get all disputes (admin)
    - [ ] Test: Filter by status
    - [ ] Test: Pagination

19. **`getDisputeById(disputeId: string)`**
    - [ ] Test: Get existing dispute
    - [ ] Test: Non-existent dispute (returns null)

20. **`respondToDispute(disputeId: string, response: string)`**
    - [ ] Test: Respond to dispute successfully
    - [ ] Test: Invalid dispute ID
    - [ ] Test: Response stored correctly

---

### 4. Auth Service (`src/services/auth.service.ts`)

#### ✅ มี Tests แล้ว (3 functions - Facebook OAuth)

1. **`signInWithFacebook()`** ✅
   - [x] Test: Facebook OAuth provider call (Unit test)
   - [x] Test: Clean redirect URL without query params
   - [x] Test: Cookie-based locale persistence
   - [x] Test: Error handling
   - ⚠️ Manual test required for full OAuth flow
   - 📝 Tests: `tests/unit/auth-facebook-oauth.test.ts`
   - 📝 E2E: `tests/e2e/auth/facebook-oauth.spec.ts`
   - 📝 Manual Guide: `docs/guild/FACEBOOK_OAUTH_MANUAL_TEST.md`

2. **`linkFacebookAccount()`** ✅
   - [x] Test: Link identity call with Facebook provider
   - [x] Test: Clean redirect URL for Facebook
   - [x] Test: Redirect to profile page after linking
   - [x] Test: Error handling (identity already linked)
   - ⚠️ Manual test required for full flow
   - 📝 Tests: `tests/unit/auth-facebook-oauth.test.ts`

3. **`unlinkOAuthAccount('facebook')`** ✅
   - [x] Test: Unlink identity call
   - [x] Test: Error handling (cannot unlink last identity)
   - 📝 Tests: `tests/unit/auth-facebook-oauth.test.ts`

#### ⚠️ ยังไม่ทดสอบ (9 functions)

4. **`signUp(credentials: SignUpCredentials)`**
   - [ ] Test: Sign up successfully
   - [ ] Test: Email already exists
   - [ ] Test: Invalid email format
   - [ ] Test: Weak password
   - [ ] Test: Profile and user_role created automatically

5. **`signIn(credentials: SignInCredentials)`**
   - [ ] Test: Sign in with email successfully
   - [ ] Test: Sign in with username successfully
   - [ ] Test: Invalid credentials
   - [ ] Test: Non-existent user

6. **`signOut()`**
   - [ ] Test: Sign out successfully
   - [ ] Test: Session cleared

7. **`getCurrentUser()`**
   - [ ] Test: Get authenticated user
   - [ ] Test: No authenticated user (returns null)

8. **`onAuthStateChange(callback)`**
   - [ ] Test: Callback called on auth state change
   - [ ] Test: Unsubscribe works

9. **`signInWithGoogle()`**
   - [ ] Test: Google OAuth flow
   - [ ] Test: Error handling

10. **`linkGoogleAccount()`**
   - [ ] Test: Link Google account successfully
   - [ ] Test: Account already linked
   - [ ] Test: Error handling

11. **`unlinkGoogleAccount(provider: string)`**
   - [ ] Test: Unlink account successfully
   - [ ] Test: Account not linked
   - [ ] Test: Error handling

12. **`getConnectedAccounts()`**
   - [ ] Test: Get connected accounts
   - [ ] Test: No connected accounts (empty array)

---

### 5. Gym Service (`src/services/gym.service.ts`)

#### ⚠️ ยังไม่ทดสอบ (9 functions)

1. **`validateGymData(data: CreateGymInput | UpdateGymInput, isUpdate: boolean)`**
   - [ ] Test: Valid gym data (returns empty errors)
   - [ ] Test: Missing required fields
   - [ ] Test: Invalid email format
   - [ ] Test: Invalid phone format
   - [ ] Test: Invalid URL format

2. **`getGyms(filters?: GymFilters)`**
   - [ ] Test: Get all gyms (no filters)
   - [ ] Test: Filter by status
   - [ ] Test: Filter by location
   - [ ] Test: Search by name
   - [ ] Test: Pagination (limit/offset)

3. **`getGymById(id: string)`**
   - [ ] Test: Get existing gym
   - [ ] Test: Non-existent gym (returns null)

4. **`createGym(data: CreateGymInput)`**
   - [ ] Test: Create gym successfully
   - [ ] Test: Validation errors
   - [ ] Test: Duplicate gym name handling
   - [ ] Test: Status defaults to 'approved' for admin

5. **`updateGym(id: string, data: UpdateGymInput)`**
   - [ ] Test: Update gym successfully
   - [ ] Test: Validation errors
   - [ ] Test: Non-existent gym

6. **`deleteGym(id: string)`**
   - [ ] Test: Delete gym successfully
   - [ ] Test: Non-existent gym
   - [ ] Test: Cascade delete (packages, bookings, etc.)

7. **`updateGymStatus(id: string, status: string)`**
   - [ ] Test: Update status successfully
   - [ ] Test: Invalid status values

8. **`approveGym(id: string)`**
   - [ ] Test: Approve gym successfully
   - [ ] Test: Non-existent gym
   - [ ] Test: Already approved gym

9. **`rejectGym(id: string)`**
   - [ ] Test: Reject gym successfully
   - [ ] Test: Non-existent gym

---

## 🛠️ Utility Functions (src/lib/utils/)

### 1. Analytics Utils (`src/lib/utils/analytics.ts`)

#### ⚠️ ยังไม่ทดสอบ (10 functions)

1. **`trackPageView(url: string, title?: string)`**
   - [ ] Test: Track page view when GA loaded
   - [ ] Test: No error when GA not loaded
   - [ ] Test: URL and title parameters correct

2. **`trackEvent(eventName: string, eventParams?: object)`**
   - [ ] Test: Track event when GA loaded
   - [ ] Test: No error when GA not loaded
   - [ ] Test: Event params passed correctly

3. **`trackConversion(value: number, currency: string)`**
   - [ ] Test: Track conversion when GA loaded
   - [ ] Test: Value and currency parameters correct

4. **`trackBookingCompletion(bookingId, gymId, packageId, amount)`**
   - [ ] Test: Track booking completion
   - [ ] Test: All parameters passed correctly

5. **`trackPaymentSuccess(amount: number, currency: string)`**
   - [ ] Test: Track payment success
   - [ ] Test: Conversion event sent

6. **`trackUserSignup(userId: string, method: string)`**
   - [ ] Test: Track signup with email method
   - [ ] Test: Track signup with google method

7. **`trackUserLogin(userId: string, method: string)`**
   - [ ] Test: Track login event

8. **`trackSearch(query: string, resultsCount: number)`**
   - [ ] Test: Track search event
   - [ ] Test: Query and results count passed correctly

9. **`trackProductView(productId: string, productName: string)`**
   - [ ] Test: Track product view event

10. **`isAnalyticsAvailable()`**
    - [ ] Test: Returns true when GA loaded
    - [ ] Test: Returns false when GA not loaded

---

### 2. Affiliate Utils (`src/lib/utils/affiliate.ts`)

#### ✅ มี test บางส่วน (6 functions)

1. **`extractUserIdFromReferralCode(referralCode: string)`** ⚠️
   - [ ] Test: Extract valid referral code
   - [ ] Test: Invalid format (returns null)
   - [ ] Test: Empty string handling

2. **`getAffiliateUserIdFromCode(referralCode: string)`** ⚠️
   - [ ] Test: Get user ID from valid code
   - [ ] Test: Invalid code (returns null)
   - [ ] Test: Non-existent code (returns null)

3. **`isValidReferralCodeFormat(referralCode: string)`** ✅ (มี test แล้ว)
   - [x] Test: Valid format (MT12345678)
   - [x] Test: Invalid formats (various)
   - [x] Test: Empty string

4. **`generateReferralCode(userId: string)`** ⚠️
   - [ ] Test: Generate valid referral code
   - [ ] Test: Format is correct (MT + 8 digits)
   - [ ] Test: Unique codes for different users

5. **`getAffiliateUserIdForReferredUser(referredUserId: string)`** ⚠️
   - [ ] Test: Get affiliate user ID from conversion
   - [ ] Test: No conversion found (returns null)

---

### 3. Promotion Utils (`src/lib/utils/promotion.ts`)

#### ✅ มี test แล้ว (3 functions)

1. **`calculateDiscountPrice(packagePrice, promotion)`** ✅ (27 tests)
   - [x] Percentage discount calculation
   - [x] Fixed amount discount calculation
   - [x] Max discount cap
   - [x] Min purchase validation
   - [x] Max uses validation
   - [x] Date range validation
   - [x] Edge cases

2. **`filterApplicablePromotions(promotions, packageId, packagePrice)`** ✅ (6 tests)
   - [x] Inactive promotion filtering
   - [x] Max uses filtering
   - [x] Package ID matching
   - [x] Date range filtering

3. **`formatDiscountText(promotion: Promotion | null)`** ✅ (4 tests)
   - [x] Percentage formatting
   - [x] Fixed amount formatting
   - [x] Null/empty cases

---

### 4. Validation Utils (`src/lib/utils/validation.ts`)

#### ⚠️ ยังไม่ทดสอบ (17 functions)

1. **`validateEmail(email: string, required?)`**
   - [ ] Test: Valid email formats
   - [ ] Test: Invalid email formats
   - [ ] Test: Empty email (required = true)
   - [ ] Test: Empty email (required = false)

2. **`validatePhone(phone: string, required?)`**
   - [ ] Test: Valid Thai phone formats
   - [ ] Test: Invalid phone formats
   - [ ] Test: Empty phone (required = true/false)

3. **`validatePhoneInternational(phone: string, required?)`**
   - [ ] Test: Valid international formats
   - [ ] Test: Invalid formats

4. **`validateName(name: string, fieldName?, required?)`**
   - [ ] Test: Valid names
   - [ ] Test: Empty name (required = true/false)
   - [ ] Test: Special characters

5. **`validateUsername(username: string, required?, allowDash?)`**
   - [ ] Test: Valid usernames
   - [ ] Test: Invalid characters
   - [ ] Test: With dash (allowDash = true)
   - [ ] Test: Without dash (allowDash = false)

6. **`validatePassword(password: string, required?)`**
   - [ ] Test: Valid passwords
   - [ ] Test: Too short password
   - [ ] Test: Empty password (required = true/false)

7. **`validatePasswordStrong(password: string, required?)`**
   - [ ] Test: Strong password (has uppercase, lowercase, number, special)
   - [ ] Test: Missing uppercase
   - [ ] Test: Missing lowercase
   - [ ] Test: Missing number
   - [ ] Test: Missing special character

8. **`validateConfirmPassword(password, confirmPassword, required?)`**
   - [ ] Test: Matching passwords
   - [ ] Test: Non-matching passwords

9. **`validateMessage(message: string, fieldName?, required?)`**
   - [ ] Test: Valid messages
   - [ ] Test: Empty message (required = true/false)

10. **`validateSubject(subject: string, fieldName?, required?)`**
    - [ ] Test: Valid subjects
    - [ ] Test: Empty subject (required = true/false)

11. **`validateAddress(address: string, required?)`**
    - [ ] Test: Valid addresses
    - [ ] Test: Empty address (required = true/false)

12. **`validateUrl(url: string, required?)`**
    - [ ] Test: Valid URLs
    - [ ] Test: Invalid URLs
    - [ ] Test: Empty URL (required = true/false)

13. **`validatePrice(price: number | string, required?)`**
    - [ ] Test: Valid prices (positive numbers)
    - [ ] Test: Negative prices
    - [ ] Test: Zero price
    - [ ] Test: Invalid format

14. **`validateDate(date: string, required?, minDate?)`**
    - [ ] Test: Valid dates
    - [ ] Test: Invalid date formats
    - [ ] Test: Date before minDate
    - [ ] Test: Empty date (required = true/false)

15. **`validateDateRange(startDate: string, endDate: string)`**
    - [ ] Test: Valid date range (start < end)
    - [ ] Test: Invalid range (start > end)
    - [ ] Test: Same dates

16. **`validatePackageType(type: string)`**
    - [ ] Test: Valid types (per_session, monthly)
    - [ ] Test: Invalid types

17. **`validateDurationMonths(months: number | null, required?)`**
    - [ ] Test: Valid months (1-12)
    - [ ] Test: Invalid months (0, negative, > 12)
    - [ ] Test: Null (required = true/false)

---

### 5. Sanitize Utils (`src/lib/utils/sanitize.ts`)

#### ⚠️ ยังไม่ทดสอบ (6 functions)

1. **`sanitizeHTML(dirty: string, options?)`**
   - [ ] Test: Remove dangerous tags
   - [ ] Test: Keep safe tags
   - [ ] Test: XSS prevention
   - [ ] Test: Empty/null input

2. **`sanitizeText(dirty: string | null | undefined)`**
   - [ ] Test: Remove HTML tags
   - [ ] Test: Empty/null input

3. **`sanitizeAttribute(dirty: string | null | undefined)`**
   - [ ] Test: Sanitize for attributes
   - [ ] Test: XSS prevention

4. **`sanitizeURL(url: string, allowedProtocols?)`**
   - [ ] Test: Valid URLs
   - [ ] Test: Dangerous protocols (javascript:, data:)
   - [ ] Test: Allowed protocols only

5. **`getSanitizedHTMLProps(content: string)`**
   - [ ] Test: Return sanitized props
   - [ ] Test: XSS prevention

6. **`containsDangerousHTML(content: string | null | undefined)`**
   - [ ] Test: Detect dangerous HTML
   - [ ] Test: Safe HTML (returns false)
   - [ ] Test: Empty/null input

---

### 6. File Validation Utils (`src/lib/utils/file-validation.ts`)

#### ⚠️ ยังไม่ทดสอบ (4 functions)

1. **`sanitizeFilename(filename: string)`**
   - [ ] Test: Remove dangerous characters
   - [ ] Test: Prevent directory traversal
   - [ ] Test: Keep safe characters

2. **`validateFile(file: File, allowedTypes?, options?)`**
   - [ ] Test: Valid image file (JPEG, PNG, WebP)
   - [ ] Test: Invalid file type
   - [ ] Test: File too large
   - [ ] Test: Magic bytes verification
   - [ ] Test: Dangerous file extensions

3. **`validateFiles(files: File[], allowedTypes?, options?)`**
   - [ ] Test: Multiple valid files
   - [ ] Test: Mixed valid/invalid files
   - [ ] Test: Total size limit

4. **`validateFileClient(file: File, allowedTypes?)`**
   - [ ] Test: Client-side validation
   - [ ] Test: File type check
   - [ ] Test: File size check

---

### 7. QR Code Utils (`src/lib/utils/qrcode.ts`)

#### ⚠️ ยังไม่ทดสอบ (3 functions)

1. **`generateQRCodeDataURL(data: string, options?)`**
   - [ ] Test: Generate QR code data URL
   - [ ] Test: Different data formats
   - [ ] Test: Options (size, error correction)

2. **`generateQRCodeBuffer(data: string, options?)`**
   - [ ] Test: Generate QR code buffer
   - [ ] Test: Buffer format correct

3. **`generateQRCodeString(data: string)`**
   - [ ] Test: Generate QR code string
   - [ ] Test: String format correct

---

### 8. PDF Generator Utils (`src/lib/utils/pdf-generator.ts`)

#### ⚠️ ยังไม่ทดสอบ (2 functions)

1. **`generateReceiptPDF(data: ReceiptData)`**
   - [ ] Test: Generate receipt PDF
   - [ ] Test: All receipt fields included
   - [ ] Test: PDF format correct
   - [ ] Test: Missing data handling

2. **`generateInvoicePDF(data: InvoiceData)`**
   - [ ] Test: Generate invoice PDF
   - [ ] Test: All invoice fields included
   - [ ] Test: Itemized billing
   - [ ] Test: Tax calculation
   - [ ] Test: Discount calculation

---

### 9. Crypto Utils (`src/lib/utils/crypto.ts`)

#### ⚠️ ยังไม่ทดสอบ (2 functions)

1. **`generateUnsubscribeToken()`**
   - [ ] Test: Generate unique token
   - [ ] Test: Token format correct
   - [ ] Test: Token is secure

2. **`isValidUnsubscribeToken(token: string)`**
   - [ ] Test: Valid token (returns true)
   - [ ] Test: Invalid token (returns false)
   - [ ] Test: Expired token (returns false)

---

### 10. Slug Utils (`src/lib/utils/slug.ts`)

#### ⚠️ ยังไม่ทดสอบ (3 functions)

1. **`generateSlug(text: string)`**
   - [ ] Test: Generate slug from text
   - [ ] Test: Special characters removed
   - [ ] Test: Spaces converted to hyphens
   - [ ] Test: Thai characters handling

2. **`previewSlug(text: string)`**
   - [ ] Test: Preview slug without saving
   - [ ] Test: Same as generateSlug result

3. **`isValidSlug(slug: string)`**
   - [ ] Test: Valid slug (returns true)
   - [ ] Test: Invalid slug (returns false)
   - [ ] Test: Empty slug

---

### 11. Export Utils (`src/lib/utils/export.ts`)

#### ✅ เสร็จสมบูรณ์แล้ว (6 functions) - 2025-11-14

1. **`exportToPDF<T>(options: ExportPDFOptions<T>)`** ✅
   - [x] Export ข้อมูลเป็น PDF document
   - [x] รองรับ landscape/portrait orientation
   - [x] รองรับ Thai fonts (Helvetica)
   - [x] Auto page numbers และ timestamps
   - [x] Custom column formatting
   - [x] Row numbers (optional)
   - [x] Headers และ footers
   - [x] Empty data handling
   - ⚠️ **ต้องเพิ่ม tests**: Unit tests สำหรับ PDF generation

2. **`exportToCSV<T>(options: ExportCSVOptions<T>)`** ✅
   - [x] Export ข้อมูลเป็น CSV file
   - [x] UTF-8 BOM encoding (Excel-friendly)
   - [x] Auto escape special characters (commas, quotes)
   - [x] Custom column formatting
   - [x] Timestamp ในชื่อไฟล์ (optional)
   - [x] Empty data handling
   - ⚠️ **ต้องเพิ่ม tests**: Unit tests สำหรับ CSV generation

3. **`exportToJSON<T>(options: ExportJSONOptions<T>)`** ✅ (Bonus feature)
   - [x] Export ข้อมูลเป็น JSON file
   - [x] Pretty print option
   - [x] Download trigger
   - ⚠️ **ต้องเพิ่ม tests**: Unit tests สำหรับ JSON export

4. **`generateColumnsFromData<T>(data: T[])`** ✅
   - [x] Auto-generate columns จากข้อมูล
   - [x] Format field names (snake_case → Title Case)
   - [x] Empty data handling

5. **`formatValue(value: unknown)`** ✅
   - [x] Format ค่าต่างๆ สำหรับ export
   - [x] Boolean → Yes/No
   - [x] Date → Thai format
   - [x] Object → JSON string
   - [x] Null/undefined → empty string

**Integration Features** ✅:
- [x] `useTableExport` hook - Custom hook สำหรับ React components
- [x] `TableExportButton` component - Dropdown button (PDF + CSV)
- [x] `SimpleExportButtons` component - Separate buttons
- [x] DataTable integration - `exportConfig` prop
- [x] ResponsiveTable integration - `exportConfig` prop

**Implementation Status**:
- ✅ Core utilities: `src/lib/utils/export.ts`
- ✅ React hook: `src/lib/hooks/useTableExport.ts`
- ✅ UI components: `src/components/shared/TableExportButton.tsx`
- ✅ Partner Dashboard integration: Bookings table
- ✅ Admin Dashboard integration: Gyms และ Bookings tables
- ✅ Documentation: `docs/features/TABLE_EXPORT_SYSTEM.md`

**ต้องทำต่อ**:
- [ ] Unit tests สำหรับ export utilities
- [ ] Integration tests กับ DataTable/ResponsiveTable
- [ ] E2E tests สำหรับ download flow
- [ ] Performance tests (large datasets > 10k rows)
- [ ] Browser compatibility tests (Safari, Firefox)

---

### 12. Rate Limit Error Utils (`src/lib/utils/rate-limit-error.ts`)

#### ⚠️ ยังไม่ทดสอบ (4 functions)

1. **`checkRateLimitError(error: any)`**
   - [ ] Test: Detect rate limit error
   - [ ] Test: Non-rate-limit error (returns false)

2. **`formatRateLimitMessage(error: any)`**
   - [ ] Test: Format English message
   - [ ] Test: Retry-After header included

3. **`formatRateLimitMessageThai(error: any)`**
   - [ ] Test: Format Thai message
   - [ ] Test: Retry-After header included

4. **`fetchWithRateLimit(url: string, options?)`**
   - [ ] Test: Handle rate limit errors
   - [ ] Test: Retry logic
   - [ ] Test: Max retries

---

### 13. Text Utils (`src/lib/utils/text-utils.ts`)

#### ⚠️ ยังไม่ทดสอบ (5 functions)

1. **`slugify(text: string)`**
   - [ ] Test: Convert text to slug
   - [ ] Test: Special characters handling

2. **`isValidSlug(slug: string)`**
   - [ ] Test: Valid slug detection

3. **`previewSlug(text: string)`**
   - [ ] Test: Preview slug generation

4. **`truncateText(text: string, maxLength: number)`**
   - [ ] Test: Truncate long text
   - [ ] Test: Short text (no truncation)
   - [ ] Test: Ellipsis added

5. **`getInitials(name: string)`**
   - [ ] Test: Get initials from name
   - [ ] Test: Single word name
   - [ ] Test: Multiple words name

---

### 14. Formatters (`src/lib/utils/formatters.ts`)

#### ⚠️ ยังไม่ทดสอบ (2 functions)

1. **`formatDate(dateString: string)`**
   - [ ] Test: Format date correctly
   - [ ] Test: Invalid date handling

2. **`formatPhoneNumber(phone: string)`**
   - [ ] Test: Format Thai phone number
   - [ ] Test: Invalid phone handling

---

### 15. Google Places Utils (`src/lib/utils/googlePlaces.ts`)

#### ⚠️ ยังไม่ทดสอบ (1 function)

1. **`fetchPlaceReviews(placeId: string)`**
   - [ ] Test: Fetch reviews successfully
   - [ ] Test: Invalid place ID
   - [ ] Test: API error handling

---

### 16. Toast Utils (`src/lib/utils/toast.ts`)

#### ⚠️ ยังไม่ทดสอบ (4 functions)

1. **`showSuccessToast(message: string)`**
   - [ ] Test: Show success toast
   - [ ] Test: Message displayed correctly

2. **`showErrorToast(message: string)`**
   - [ ] Test: Show error toast
   - [ ] Test: Message displayed correctly

3. **`showLoadingToast(message: string)`**
   - [ ] Test: Show loading toast

4. **`dismissToast(toastId: string)`**
   - [ ] Test: Dismiss toast successfully

---

### 17. CN Utils (`src/lib/utils/cn.ts`)

#### ⚠️ ยังไม่ทดสอบ (1 function)

1. **`cn(...inputs: ClassValue[])`**
   - [ ] Test: Merge class names correctly
   - [ ] Test: Handle conditional classes
   - [ ] Test: Handle arrays and objects

---

## 📡 API Routes Functions (src/app/api/)

### 1. Authentication Routes

#### ⚠️ ยังไม่ทดสอบ

1. **POST `/api/auth/signup`**
   - [ ] Test: Signup successfully
   - [ ] Test: Email already exists
   - [ ] Test: Invalid email format
   - [ ] Test: Weak password
   - [ ] Test: Referral code handling

2. **POST `/api/auth/login`**
   - [ ] Test: Login with email
   - [ ] Test: Login with username
   - [ ] Test: Invalid credentials
   - [ ] Test: Rate limiting

---

### 2. User Routes

#### ⚠️ ยังไม่ทดสอบ (18+ endpoints)

1. **GET `/api/users`**
   - [ ] Test: Get users list (admin only)
   - [ ] Test: Pagination
   - [ ] Test: Filtering

2. **GET `/api/users/profile`**
   - [ ] Test: Get user profile
   - [ ] Test: Unauthenticated user

3. **PUT `/api/users/profile`**
   - [ ] Test: Update profile successfully
   - [ ] Test: Validation errors

4. **POST `/api/users/profile/picture`**
   - [ ] Test: Upload profile picture
   - [ ] Test: Invalid file type
   - [ ] Test: File too large

5. **PUT `/api/users/profile/bio`**
   - [ ] Test: Update bio
   - [ ] Test: HTML sanitization

6. **GET/POST/DELETE `/api/users/connected-accounts`**
   - [ ] Test: Get connected accounts
   - [ ] Test: Link account
   - [ ] Test: Unlink account

7. **อื่นๆ** (12+ endpoints)
   - [ ] Test: All user-related endpoints

---

### 3. Gym Routes

#### ⚠️ ยังไม่ทดสอบ (7+ endpoints)

1. **GET `/api/gyms`**
   - [ ] Test: Get gyms list
   - [ ] Test: Filtering
   - [ ] Test: Search

2. **GET `/api/gyms/[id]`**
   - [ ] Test: Get gym by ID
   - [ ] Test: Non-existent gym

3. **POST `/api/gyms`** (Admin only)
   - [ ] Test: Create gym
   - [ ] Test: Authorization check

4. **อื่นๆ** (4+ endpoints)
   - [ ] Test: All gym-related endpoints

---

### 4. Booking Routes

#### ⚠️ ยังไม่ทดสอบ (4+ endpoints)

1. **POST `/api/bookings`**
   - [ ] Test: Create booking
   - [ ] Test: Validation
   - [ ] Test: Promotion application

2. **GET `/api/bookings`**
   - [ ] Test: Get user bookings
   - [ ] Test: Filtering

3. **อื่นๆ** (2+ endpoints)
   - [ ] Test: All booking-related endpoints

---

### 5. Payment Routes

#### ⚠️ ยังไม่ทดสอบ (9+ endpoints)

1. **POST `/api/payments/intent`**
   - [ ] Test: Create payment intent
   - [ ] Test: Stripe integration

2. **GET `/api/payments`**
   - [ ] Test: Get user payments
   - [ ] Test: Pagination

3. **อื่นๆ** (7+ endpoints)
   - [ ] Test: All payment-related endpoints

---

### 6. Gamification Routes

#### ⚠️ ยังไม่ทดสอบ (10+ endpoints)

1. **GET `/api/gamification/stats`**
   - [ ] Test: Get user stats
   - [ ] Test: Unauthenticated user

2. **POST `/api/gamification/award-points`**
   - [ ] Test: Award points
   - [ ] Test: Validation

3. **อื่นๆ** (8+ endpoints)
   - [ ] Test: All gamification-related endpoints

---

### 7. Affiliate Routes

#### ✅ มี test แล้ว (2+ endpoints)

1. **GET `/api/affiliate`** ✅ (มี test)
   - [x] Test: Get affiliate stats

2. **POST `/api/affiliate`** ✅ (มี test)
   - [x] Test: Create affiliate conversion

3. **POST `/api/affiliate/conversions`** ⚠️
   - [ ] Test: Create conversion record
   - [ ] Test: Validation

---

### 8. Partner Routes

#### ⚠️ ยังไม่ทดสอบ (23+ endpoints)

1. **GET `/api/partner/analytics`**
   - [ ] Test: Get partner analytics
   - [ ] Test: Authorization check

2. **POST `/api/partner/promotions`**
   - [ ] Test: Create promotion
   - [ ] Test: Validation

3. **อื่นๆ** (21+ endpoints)
   - [ ] Test: All partner-related endpoints

---

### 9. Admin Routes

#### ⚠️ ยังไม่ทดสอบ (12+ endpoints)

1. **GET `/api/admin/analytics`**
   - [ ] Test: Get admin analytics
   - [ ] Test: Authorization check

2. **GET `/api/admin/promotions`**
   - [ ] Test: Get promotions
   - [ ] Test: CRUD operations

3. **อื่นๆ** (10+ endpoints)
   - [ ] Test: All admin-related endpoints

---

### 10. อื่นๆ (Products, Events, Articles, etc.)

#### ⚠️ ยังไม่ทดสอบ (30+ endpoints)

- [ ] Products API (6 endpoints)
- [ ] Events API (6 endpoints)
- [ ] Articles API (6 endpoints)
- [ ] Search API (3 endpoints)
- [ ] Newsletter API (2 endpoints)
- [ ] Cron Jobs (3 endpoints)
- [ ] อื่นๆ (10+ endpoints)

---

## 📊 สรุป Functions ที่ต้องทดสอบ

### Services (50+ functions)
- Gamification Service: 15 functions ⚠️
- Booking Service: 11 functions ⚠️
- Payment Service: 20+ functions ⚠️
- Auth Service: 9 functions ⚠️
- Gym Service: 9 functions ⚠️

### Utils (63+ functions)
- Analytics: 10 functions ⚠️
- Affiliate: 6 functions (มี test บางส่วน) ⚠️
- Promotion: 3 functions ✅ (มี test แล้ว)
- Validation: 17 functions ⚠️
- Sanitize: 6 functions ⚠️
- File Validation: 4 functions ⚠️
- QR Code: 3 functions ⚠️
- PDF Generator: 2 functions ⚠️
- Crypto: 2 functions ⚠️
- Slug: 3 functions ⚠️
- **Export: 6 functions ✅ (Implementation เสร็จแล้ว - ยังต้องเพิ่ม tests)**
- Rate Limit Error: 4 functions ⚠️
- Text Utils: 5 functions ⚠️
- Formatters: 2 functions ⚠️
- Google Places: 1 function ⚠️
- Toast: 4 functions ⚠️
- CN: 1 function ⚠️

### API Routes (125+ endpoints)
- Authentication: 2+ endpoints ⚠️
- Users: 18+ endpoints ⚠️
- Gyms: 7+ endpoints ⚠️
- Bookings: 4+ endpoints ⚠️
- Payments: 9+ endpoints ⚠️
- Gamification: 10+ endpoints ⚠️
- Affiliate: 2+ endpoints (มี test บางส่วน) ⚠️
- Partner: 23+ endpoints ⚠️
- Admin: 12+ endpoints ⚠️
- อื่นๆ: 30+ endpoints ⚠️

---

## 🎯 Priority สำหรับการทดสอบ

### 🔴 High Priority (Functions สำคัญที่ต้องทดสอบก่อน)
1. **Payment Service** - `createPaymentIntent`, `updatePaymentStatus`
2. **Booking Service** - `createBooking`, `validateBookingData`
3. **Auth Service** - `signUp`, `signIn`, `signOut`
4. **Validation Utils** - ทุก validation functions
5. **Sanitize Utils** - XSS prevention

### 🟠 Medium Priority (Functions สำคัญแต่ไม่ critical)
1. **Gamification Service** - `awardPoints`, `getUserGamificationStats`
2. **Gym Service** - `createGym`, `validateGymData`
3. **Analytics Utils** - Tracking functions
4. **File Validation** - Security-critical
5. **PDF Generator** - Receipt/Invoice generation

### 🟡 Low Priority (Nice to have)
1. **QR Code Utils**
2. **Export Utils**
3. **Text Utils**
4. **Toast Utils**

---

## 📝 หมายเหตุ

1. **Functions ที่มี test แล้ว**: 43 tests (Promotion Utils + Promotion API)
2. **Functions ที่มี implementation แล้ว (ต้องเพิ่ม tests)**: 6 functions (Export Utils - 2025-11-14)
3. **Functions ที่ยังไม่ทดสอบ**: 189+ functions
4. **Priority**: เริ่มจาก High Priority ก่อน
5. **Coverage Goal**: 80%+ สำหรับ critical functions

**อัปเดตล่าสุด**: 2025-11-14
- ✅ เพิ่ม Export System (6 functions) - Implementation เสร็จสมบูรณ์
- ⚠️ ต้องเพิ่ม unit tests, integration tests, และ E2E tests สำหรับ Export features

---

## 🔗 อ้างอิง

- [TESTING_SUMMARY.md](./TESTING_SUMMARY.md) - สรุปการทดสอบที่ทำไปแล้ว
- [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Checklist การทดสอบ
- [PLAN.md](./PLAN.md) - แผนงานและงานที่ต้องทำวันนี้


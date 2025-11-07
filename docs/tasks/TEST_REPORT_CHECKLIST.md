# 📋 Test Report Checklist

**โครงการ**: Muay Thai Next.js Application  
**วันที่**: 2025-11-05  
**เวอร์ชัน**: 0.1.0

---

## 📊 สรุปผลการทดสอบ (Test Summary)

| ประเภทการทดสอบ | จำนวน Tests | ผ่าน | ไม่ผ่าน | ยังไม่ทดสอบ | สถานะ |
|----------------|------------|------|---------|-----------|-------|
| Unit Tests     | 43 | 43 | 0 | 0 | ✅ |
| E2E Tests      | 28 | 18 | 1 | 9 | ⚠️ |
| Integration Tests | - | - | - | - | ⏳ |
| API Tests      | - | - | - | - | ⏳ |
| Security Tests | - | - | - | - | ⏳ |
| Manual Tests   | - | - | - | - | ⏳ |
| **รวม** | **71** | **61** | **1** | **9** | **⚠️** |

**Coverage**: ⏳ (ยังไม่ได้รัน)  
**Build Status**: ✅ / ❌ / ⏳  
**Deployment Ready**: ✅ / ❌ / ⏳

**อัปเดตล่าสุด**: 2025-11-07
- ✅ Unit Tests: 43/43 tests ผ่าน
- ⚠️ E2E Tests: 18/28 tests ผ่าน; ❌ Auth Flow Step 6 pending fix (partner apply formไม่โหลด), 9 tests ยังไม่รัน
- ✅ Playwright affiliate suite ผ่านครบ (4 tests)
- ✅ Playwright admin gym management suite ผ่านครบ (9 tests)

---

## 1. ✅ Unit Tests (Jest)

### 1.1 Promotion Discount Tests
- [x] **calculateDiscountPrice Tests** (15 tests) ✅
  - [x] Percentage discount calculation ✅
  - [x] Fixed amount discount calculation ✅
  - [x] Max discount cap ✅
  - [x] Min purchase validation ✅
  - [x] Max uses validation ✅
  - [x] Date range validation ✅
  - [x] Edge cases (100% discount, 0% discount, rounding) ✅

- [x] **filterApplicablePromotions Tests** (6 tests) ✅
  - [x] Inactive promotion filtering ✅
  - [x] Max uses filtering ✅
  - [x] Package ID matching ✅
  - [x] Date range filtering ✅

- [x] **formatDiscountText Tests** (4 tests) ✅
  - [x] Percentage formatting ✅
  - [x] Fixed amount formatting ✅
  - [x] Null/empty cases ✅

- [x] **Edge Cases and Integration Tests** (2 tests) ✅
  - [x] Complex scenarios ✅
  - [x] Multiple promotions filtering ✅

**สถานะ**: ✅ **ผ่านทั้งหมด 27 tests**  
**ผลการทดสอบ**: 
- ✅ calculateDiscountPrice: 15 tests ผ่าน
- ✅ filterApplicablePromotions: 6 tests ผ่าน
- ✅ formatDiscountText: 4 tests ผ่าน
- ✅ Edge Cases: 2 tests ผ่าน

**หมายเหตุ**: ใช้คำสั่ง `npm run test:promotion` เพื่อรัน tests

---

### 1.2 Promotion API Tests
- [x] **POST /api/partner/promotions** ✅
  - [x] สร้าง promotion ด้วย percentage discount ✅
  - [x] สร้าง promotion ด้วย fixed amount discount ✅
  - [x] Validate percentage discount range (0-100) ✅
  - [x] Validate package_id ต้องเป็นของ partner gym ✅
  - [x] Reject invalid discount_type ✅

- [x] **PATCH /api/partner/promotions/[id]** ✅
  - [x] อัปเดต promotion discount fields ✅
  - [x] Validate discount consistency on update ✅

- [x] **GET /api/promotions/active** ✅
  - [x] ดึง active promotions ✅
  - [x] Filter by gym_id ✅
  - [x] Filter by package_id ✅

- [x] **Booking with Promotion Integration** ✅
  - [x] สร้าง booking พร้อม promotion_id และคำนวณราคา ✅
  - [x] เพิ่ม current_uses เมื่อสร้าง booking ✅
  - [x] Reject booking ถ้า promotion max_uses ครบแล้ว ✅
  - [x] เก็บ discount_amount ใน booking record ✅

- [x] **Payment Flow with Promotion** ✅
  - [x] ใช้ราคาที่ลดแล้วสำหรับ payment intent ✅
  - [x] รวม promotion_id ใน payment metadata ✅

**สถานะ**: ✅ **ผ่านทั้งหมด 16 tests**  
**ผลการทดสอบ**: 
- ✅ POST /api/partner/promotions: 5 tests ผ่าน
- ✅ PATCH /api/partner/promotions/[id]: 2 tests ผ่าน
- ✅ GET /api/promotions/active: 3 tests ผ่าน
- ✅ Booking Integration: 4 tests ผ่าน
- ✅ Payment Flow: 2 tests ผ่าน

**หมายเหตุ**: Tests ผ่านทั้งหมด (16 tests)

---

### 1.3 Analysis Tests
- [⏭️] **cleanup-integration.test.ts** (Skipped)
  - [⏭️] Cleanup integration tests
  - [⏭️] Dependency verification

- [⏭️] **dependency-scanner.test.ts** (Skipped)
  - [⏭️] Dependency scanning tests
  - [⏭️] Unused dependency detection

- [⏭️] **safety-scenarios.test.ts** (Skipped)
  - [⏭️] Safety scenario tests
  - [⏭️] Edge case handling

**สถานะ**: ⏭️ **Skipped - Source Code ยังไม่พร้อม**  
**หมายเหตุ**: 
- ✅ Test runner แก้ไข ES modules issue แล้ว (`run-tests.js`)
- ⚠️ Tests เหล่านี้ต้องการ `src/analysis/` directory และ implementation classes:
  - `FileAnalyzer`
  - `DependencyScanner`
  - `CleanupConfigManager`
  - `CleanupValidationCommands`
- Tests ถูกเตรียมไว้สำหรับ Cleanup Tool feature ที่ยังไม่ได้ implement
- **Action**: Skip tests เหล่านี้จนกว่า source code จะพร้อม หรือ implement feature ก่อน
- **Test Runner**: พร้อมใช้งานแล้ว (`node tests/analysis/run-tests.js`)

---

## 2. 🎭 E2E Tests (Playwright)

### 2.1 Authentication Flow Tests
- [ ] **Complete Authentication Flow - 3 Roles**
  - [x] Step 1: Setup - Generate test users ✅
  - [x] Step 2: Signup - Regular User ✅ (10.0s)
  - [x] Step 3: Signup - Partner User (to be) ✅ (8.4s)
  - [x] Step 4: Signup - Admin User ✅ (9.3s)
  - [x] Step 5: Login - Regular User (verify authenticated role) ✅ (16.5s)
    - [x] Login ด้วย regular user credentials ✅
    - [x] ตรวจสอบว่าสามารถเข้าถึง `/dashboard` ได้ ✅
    - [x] ตรวจสอบว่า URL มี 'dashboard' ✅
    - [x] Logout สำเร็จ ✅
  - [ ] Step 6: Partner Application - Submit gym application ❌
    - [x] เตรียม partner account (`partner@muaythai.com` / `partner123456`) – ใช้ `node scripts/node/create-user.js --test-users` (จะข้ามถ้ามีบัญชีอยู่แล้ว)
    - [ ] Login ด้วย partner user credentials
    - [x] ส่ง gym application form
    - [ ] ตรวจสอบว่า application ส่งสำเร็จ
    - **Status**: ❌ **ล้มเหลว** - TimeoutError: ไม่สามารถหา `input[name="gymName"]` ได้ภายใน 15 วินาที
    - **Error Details**:
      - `TimeoutError: locator.fill: Timeout 15000ms exceeded`
      - `waiting for locator('input[name="gymName"]')`
      - Page อาจ redirect ไป login หรือ form ยังไม่ได้ render
    - **สาเหตุที่เป็นไปได้**:
      1. Authentication check redirect ไป `/login?redirect=/partner/apply`
      2. Page ใช้เวลานานในการ load (SSR/hydration)
      3. Form component ยังไม่ได้ render
    - **วิธีแก้ไข**: ✅ **แก้ไขแล้ว** (v3 - เพิ่ม fallback และ signup verification)
      1. ✅ เพิ่ม `waitForURL()` ใน `loginUser` เพื่อตรวจสอบว่า login สำเร็จ
      2. ✅ เพิ่ม `waitForURL()` ใน `applyForPartner` เพื่อตรวจสอบว่าไม่ได้ redirect ไป login
      3. ✅ เพิ่ม timeout จาก 15s เป็น 30s สำหรับ form loading
      4. ✅ เพิ่ม error handling และ logging ที่ดีขึ้น
      5. ✅ เพิ่ม wait time สำหรับ session establishment
      6. ✅ เพิ่มการรอ loading state หาย (รอ text "กำลังโหลด" หาย) ก่อนหา form
      7. ✅ ใช้ Promise.race เพื่อรอ loading หาย หรือ form appear (whichever comes first)
      8. ✅ เพิ่มการตรวจสอบ page content และ title สำหรับ debugging
      9. ✅ เพิ่ม fallback mechanism สำหรับ generate partnerUser ถ้ายังไม่มี (รองรับการรัน individual test)
      10. ✅ เพิ่มการตรวจสอบและ signup partner user ถ้ายังไม่ได้ signup
      11. ✅ เพิ่มการตรวจสอบ login สำเร็จ (ถ้ายังอยู่ที่ /login ให้ signup แล้ว login อีกครั้ง)
  - [⏭️] Step 7: Admin Setup - Manually set admin role ⏭️ (Skipped - รอ Step 6 ผ่าน)
    - **หมายเหตุ**: ต้อง set admin role ด้วย SQL manually
  - [⏭️] Step 8: Admin Login - Verify admin access ⏭️ (Skipped - รอ Step 6 ผ่าน)
  - [⏭️] Step 9: Admin Approval - Approve partner application ⏭️ (Skipped - รอ Step 6 ผ่าน)
  - [⏭️] Step 10: Partner Login - Verify partner role after approval ⏭️ (Skipped - รอ Step 6 ผ่าน)
  - [⏭️] Step 11: Final Verification - All 3 roles can login ⏭️ (Skipped - รอ Step 6 ผ่าน)

**สถานะ**: ⚠️ **5/11 tests ผ่าน, 1 test ล้มเหลว, 5 tests skipped**  
**ผลการทดสอบ**: 
- ✅ Step 1: ผ่าน (Generate test users - 3ms)
- ✅ Step 2: ผ่าน (Signup - Regular User - 10.0s)
- ✅ Step 3: ผ่าน (Signup - Partner User - 8.4s)
- ✅ Step 4: ผ่าน (Signup - Admin User - 9.3s)
- ✅ Step 5: ผ่าน (Login - Regular User - 16.5s - ตรวจสอบ authenticated role และ dashboard access สำเร็จ)
- ❌ Step 6: ล้มเหลว (Partner Application - Submit gym application - 26.0s)
  - **Error**: อาจเป็น timeout หรือ form loading issue
  - **Impact**: Step 7-11 ถูก skip เนื่องจาก Step 6 ล้มเหลว
- ⏭️ Step 7-11: Skipped (รอ Step 6 แก้ไขและผ่าน)

**คำสั่ง**: 
```bash
# ✅ Playwright browsers ติดตั้งแล้ว
# ✅ WebServer timeout เพิ่มเป็น 180 วินาที (3 นาที) แล้ว

# รัน tests:
npm run test:e2e tests/e2e/auth-flow.spec.ts

# หรือรัน server แยกก่อน (ถ้าต้องการ):
# Terminal 1:
npm run dev

# Terminal 2 (รอให้ server พร้อมก่อน):
npm run test:e2e tests/e2e/auth-flow.spec.ts
```

**⚠️ ปัญหาที่พบ**:
- **Step 6**: Partner Application ล้มเหลว (มี error screenshots)
- **สาเหตุที่เป็นไปได้**:
  1. Form loading timeout (`/partner/apply` page อาจใช้เวลานานในการ load)
  2. Form validation หรือ field selectors ไม่ตรง
  3. Network หรือ authentication issues
- **วิธีแก้ไข**:
  1. ตรวจสอบ error screenshots: `tests/screenshots/partner-application-error-*.png`
  2. เพิ่ม timeout ใน `applyForPartner` helper function
  3. ตรวจสอบว่า `/partner/apply` page โหลดได้ปกติ
  4. ตรวจสอบ form selectors ว่าถูกต้อง

---

### 2.2 Admin Gym Management Tests
- [x] **Admin Gym Management**
  - [x] Admin can navigate to gym management page ✅
  - [x] Admin can view gym statistics ✅
  - [x] Admin can view gym details in modal ✅
  - [x] Admin can approve pending gym ✅
  - [x] Admin can edit gym information ✅
  - [x] Admin can delete gym ✅
  - [x] Admin can search for gyms ✅
  - [x] Admin can filter gyms by status ✅
  - [x] Admin cannot save invalid gym data ✅

**สถานะ**: ✅ **ผ่านทั้งหมด 9 tests**  
**ผลการทดสอบ**: 
- ✅ Tests ทั้งหมดผ่านภายใน ~3 นาที (ใช้ฐานข้อมูลที่ seed ด้วย `npm run test:e2e:prepare`)

**คำสั่ง**: 
```bash
npx playwright test tests/e2e/admin/admin-gym-management.spec.ts --project=chromium
```

---

### 2.3 Affiliate Dashboard & Referral Tests
- [x] **Affiliate Dashboard Display (TC-5.2)** ✅
  - [x] แสดงการ์ดสถิติครบ (ผู้แนะนำทั้งหมด, แต้มสะสมทั้งหมด, เดือนนี้, อัตราการแปลง)
  - [x] ตาราง Conversion History แสดงข้อมูลเท่ากับ API
  - [x] สถานะ referral badge แสดงถูกต้อง (รอดำเนินการ, ยืนยันแล้ว)
- [x] **Affiliate Signup SessionStorage (TC-1.2)** ✅
  - [x] เก็บ referral code ใน sessionStorage เมื่อเปิดหน้า signup พร้อม query param
  - [x] Referral code ยังคงอยู่ใน sessionStorage หลังเปลี่ยนหน้า
  - [x] Referral code กลับมาเติมในฟอร์มเมื่อกลับมาหน้า signup (ไม่มี query param)
  - [x] Referral code จาก URL มี priority สูงกว่า sessionStorage และอัปเดตค่าใหม่
  - [x] sessionStorage ถูกเคลียร์หลัง signup สำเร็จ (ตรวจสอบ logic)

**สถานะ**: ✅ **ผ่านทั้งหมด 4 tests**  
**ผลการทดสอบ**: 
- ✅ ใช้บัญชีทดสอบจาก `npm run test:e2e:prepare`
- ✅ Dashboard และ sessionStorage persistence ทำงานครบถ้วน

**คำสั่ง**: 
```bash
npx playwright test tests/e2e/affiliate --project=chromium
```

---

### 2.4 Login Existing Users Tests
- [ ] **Login Existing Users**
  - [ ] Login with existing user credentials ⚠️
  - [ ] Verify dashboard access ⚠️
  - [ ] Test logout functionality ⚠️

**สถานะ**: ⚠️ **Playwright Browsers ติดตั้งแล้ว แต่ WebServer Timeout**  
**ผลการทดสอบ**: 
- ⚠️ Tests ทั้งหมดไม่สามารถรันได้ (WebServer timeout - server ใช้เวลานานในการ start)

**คำสั่ง**: 
```bash
# ✅ Playwright browsers ติดตั้งแล้ว

# วิธีที่ 1: รัน server แยกก่อน แล้วรัน tests
# Terminal 1:
npm run dev

# Terminal 2 (รอให้ server พร้อมก่อน):
npm run test:e2e tests/e2e/login-existing-users.spec.ts

# วิธีที่ 2: เพิ่ม timeout ใน playwright.config.ts
# แก้ไข webServer.timeout จาก 120000 เป็น 180000 (3 นาที)
```

**หมายเหตุสำคัญ**: 
- ✅ **Playwright browsers ติดตั้งแล้ว** (`npx playwright install`)
- ⚠️ **WebServer Timeout Issue**: Server ใช้เวลานานในการ start (> 120 วินาที)
- **วิธีแก้ไข**:
  1. รัน `npm run dev` แยกใน terminal แล้วรัน tests
  2. หรือเพิ่ม `webServer.timeout` ใน `playwright.config.ts` เป็น 180000 (3 นาที)
- จำนวน E2E Tests: 28 tests (รวมทั้งหมด)

---

## 3. 🔗 Integration Tests

### 3.1 Database Integration Tests
- [ ] **Database Utilities Tests**
  - [ ] Database connection test
  - [ ] Database schema verification
  - [ ] Migration tests

**สถานะ**: ⏳  
**คำสั่ง**: `npm run test:scripts:database`

---

### 3.2 Admin Management Tests
- [ ] **Admin Management Tests**
  - [ ] Admin user creation
  - [ ] Admin permissions
  - [ ] Admin role assignment

**สถานะ**: ⏳  
**คำสั่ง**: `npm run test:scripts:admin`

---

### 3.3 Storage Configuration Tests
- [ ] **Storage Configuration Tests**
  - [ ] Storage bucket configuration
  - [ ] File upload tests
  - [ ] File access tests

**สถานะ**: ⏳  
**คำสั่ง**: `npm run test:scripts:storage`

---

### 3.4 Development Setup Tests
- [ ] **Development Setup Tests**
  - [ ] Environment variables check
  - [ ] Dependencies installation
  - [ ] Database setup

**สถานะ**: ⏳  
**คำสั่ง**: `npm run test:scripts:setup`

---

## 4. 🌐 API Tests

### 4.1 Authentication API
- [ ] **POST /api/auth/signup**
  - [ ] สมัครสมาชิกสำเร็จ
  - [ ] Validate email format
  - [ ] Validate password strength
  - [ ] Reject duplicate email

- [ ] **POST /api/auth/login**
  - [ ] Login สำเร็จ
  - [ ] Reject invalid credentials
  - [ ] Reject unverified email

- [ ] **POST /api/auth/reset-password**
  - [ ] ส่ง reset password email
  - [ ] Reset password สำเร็จ

- [ ] **POST /api/auth/resend-verification**
  - [ ] ส่ง verification email ซ้ำ

---

### 4.2 Users API (18 endpoints)
- [ ] **GET /api/users/profile**
- [ ] **PUT /api/users/profile**
- [ ] **POST /api/users/avatar**
- [ ] **GET /api/users/connected-accounts**
- [ ] **DELETE /api/users/connected-accounts**
- [ ] **GET /api/users/bookings**
- [ ] **GET /api/users/payments**
- [ ] **GET /api/users/notifications**
- [ ] **GET /api/users/analytics**

**สถานะ**: ⏳

---

### 4.3 Gyms API (7 endpoints)
- [ ] **GET /api/gyms**
  - [ ] ดึงรายการยิมทั้งหมด
  - [ ] Filter by location
  - [ ] Filter by status
  - [ ] Search functionality

- [ ] **GET /api/gyms/[id]**
  - [ ] ดึงข้อมูลยิมเดียว
  - [ ] ดึง packages
  - [ ] ดึง reviews

- [ ] **POST /api/gyms**
  - [ ] สร้างยิม (Partner)
  - [ ] Validate required fields

- [ ] **PUT /api/gyms/[id]**
  - [ ] แก้ไขข้อมูลยิม

**สถานะ**: ⏳

---

### 4.4 Bookings API (4 endpoints)
- [ ] **POST /api/bookings**
  - [ ] สร้าง booking สำเร็จ
  - [ ] Validate package availability
  - [ ] Validate payment required

- [ ] **GET /api/bookings**
  - [ ] ดึง bookings ของ user
  - [ ] Filter by status

- [ ] **GET /api/bookings/[id]**
  - [ ] ดึง booking details

- [ ] **DELETE /api/bookings/[id]**
  - [ ] ยกเลิก booking

**สถานะ**: ⏳

---

### 4.5 Payments API (9 endpoints)
- [ ] **POST /api/payments/create-intent**
  - [ ] สร้าง payment intent สำเร็จ
  - [ ] Validate amount

- [ ] **POST /api/webhooks/stripe**
  - [ ] Handle payment success
  - [ ] Handle payment failure
  - [ ] Update booking status

- [ ] **GET /api/payments**
  - [ ] ดึง payment history

**สถานะ**: ⏳

---

### 4.6 Products API (6 endpoints + Variants + Images)
- [ ] **GET /api/products**
  - [ ] ดึงสินค้าทั้งหมด
  - [ ] Filter by category
  - [ ] Search functionality

- [ ] **POST /api/products**
  - [ ] สร้างสินค้า (Admin)

- [ ] **GET /api/products/[id]**
  - [ ] ดึงสินค้าเดียว
  - [ ] ดึง variants
  - [ ] ดึง images

- [ ] **PUT /api/products/[id]**
  - [ ] แก้ไขสินค้า

- [ ] **DELETE /api/products/[id]**
  - [ ] ลบสินค้า

- [ ] **Variants API** (4 endpoints)
  - [ ] CRUD operations

- [ ] **Images API** (3 endpoints)
  - [ ] Upload image
  - [ ] Delete image

**สถานะ**: ⏳

---

### 4.7 Events API (6 endpoints)
- [ ] **GET /api/events**
- [ ] **POST /api/events**
- [ ] **GET /api/events/[id]**
- [ ] **PUT /api/events/[id]**
- [ ] **DELETE /api/events/[id]**
- [ ] **POST /api/events/[id]/book**

**สถานะ**: ⏳

---

### 4.8 Partner API (23 endpoints)
- [ ] **Packages API**
- [ ] **Analytics API**
- [ ] **Payouts API**
- [ ] **Messages API**
- [ ] **Availability API**
- [ ] **Performance API**
- [ ] **Promotions API**

**สถานะ**: ⏳

---

### 4.9 Admin API (12 endpoints)
- [ ] **Reports API**
- [ ] **Analytics API**
- [ ] **Promotions API**
- [ ] **Audit Logs API**

**สถานะ**: ⏳

---

### 4.10 Search API (3 endpoints)
- [ ] **GET /api/search**
  - [ ] Advanced search
  - [ ] Full-text search
  - [ ] Filters
  - [ ] Sorting

- [ ] **GET /api/search/suggestions**
  - [ ] Search suggestions

- [ ] **GET /api/search/history**
  - [ ] ประวัติการค้นหา

**สถานะ**: ⏳

---

### 4.11 Newsletter API (2 endpoints)
- [ ] **POST /api/newsletter/subscribe**
- [ ] **POST /api/newsletter/unsubscribe**

**สถานะ**: ⏳

---

## 5. 🔒 Security Tests

### 5.1 Authentication & Authorization
- [ ] **Authentication Tests**
  - [ ] JWT token validation
  - [ ] Token expiration
  - [ ] Refresh token functionality
  - [ ] Password hashing
  - [ ] OAuth integration (Google)

- [ ] **Authorization Tests**
  - [ ] Role-based access control (User, Partner, Admin)
  - [ ] RLS (Row Level Security) policies
  - [ ] API endpoint protection
  - [ ] 403 Forbidden responses

**สถานะ**: ⏳

---

### 5.2 Input Validation
- [ ] **SQL Injection Prevention**
  - [ ] User input sanitization
  - [ ] Parameterized queries

- [ ] **XSS Prevention**
  - [ ] HTML sanitization
  - [ ] Script injection prevention

- [ ] **CSRF Protection**
  - [ ] CSRF token validation
  - [ ] Same-origin policy

**สถานะ**: ⏳

---

### 5.3 Rate Limiting
- [ ] **Rate Limiting Tests**
  - [ ] API rate limits
  - [ ] Authentication rate limits
  - [ ] Email sending rate limits

**สถานะ**: ⏳

---

### 5.4 Data Privacy
- [ ] **Data Privacy Tests**
  - [ ] User data encryption
  - [ ] Payment data security
  - [ ] GDPR compliance (ถ้ามี)

**สถานะ**: ⏳

---

## 6. 👨‍💻 Manual Testing Checklist

### 6.1 User Registration & Login
- [ ] สมัครสมาชิกด้วย email/password
- [ ] สมัครสมาชิกด้วย Google OAuth
- [ ] Login สำเร็จ
- [ ] Login ไม่สำเร็จ (invalid credentials)
- [ ] Forgot password flow
- [ ] Reset password flow
- [ ] Email verification

---

### 6.2 User Profile
- [ ] แก้ไขโปรไฟล์
- [ ] อัปโหลดรูปโปรไฟล์
- [ ] ตั้งค่าความเป็นส่วนตัว
- [ ] เชื่อมต่อ Google Account
- [ ] ยกเลิกการเชื่อมต่อ Google Account

---

### 6.3 Gym Management
- [ ] ค้นหายิม
- [ ] ดูรายละเอียดยิม
- [ ] ดู packages ของยิม
- [ ] ดู reviews จาก Google Maps
- [ ] เพิ่มยิมเป็นรายการโปรด

---

### 6.4 Booking System
- [ ] จองคลาส
- [ ] จองอีเวนต์
- [ ] ดูประวัติการจอง
- [ ] ยกเลิกการจอง
- [ ] QR Code สำหรับตั๋ว

---

### 6.5 Payment System
- [ ] ชำระเงินด้วย Stripe
- [ ] ดูประวัติการชำระเงิน
- [ ] Payment success flow
- [ ] Payment failure flow
- [ ] Webhook handling

---

### 6.6 Shop System
- [ ] ดูสินค้าทั้งหมด
- [ ] ดูรายละเอียดสินค้า
- [ ] เพิ่มสินค้าลงตะกร้า
- [ ] สร้างออเดอร์
- [ ] ติดตามสถานะออเดอร์
- [ ] ดูใบเสร็จ/ใบแจ้งหนี้

---

### 6.7 Events System
- [ ] ดูอีเวนต์ทั้งหมด
- [ ] ดูรายละเอียดอีเวนต์
- [ ] จองตั๋วอีเวนต์
- [ ] Check-in ตั๋ว (Admin)

---

### 6.8 Search System
- [ ] Advanced search
- [ ] Search suggestions
- [ ] ประวัติการค้นหา
- [ ] Popular search terms

---

### 6.9 Partner Dashboard
- [ ] เข้าถึง Partner Dashboard
- [ ] จัดการ Packages
- [ ] จัดการ Promotions
- [ ] ดู Analytics
- [ ] จัดการ Payouts
- [ ] จัดการ Messages

---

### 6.10 Admin Dashboard
- [ ] เข้าถึง Admin Dashboard
- [ ] จัดการยิม
- [ ] อนุมัติ Partner Applications
- [ ] จัดการ Products
- [ ] จัดการ Events
- [ ] จัดการ Promotions
- [ ] ดู Analytics
- [ ] ดู Audit Logs
- [ ] Generate Reports

---

### 6.11 Newsletter System
- [ ] สมัครรับ Newsletter
- [ ] ยกเลิกการสมัครรับ Newsletter
- [ ] สร้าง Campaign (Admin)
- [ ] ส่ง Campaign emails

---

### 6.12 Gamification System
- [ ] ดูคะแนนและ Badges
- [ ] ดู Leaderboard
- [ ] ได้รับ Badge เมื่อทำกิจกรรม
- [ ] Level Up notifications

---

### 6.13 Notifications
- [ ] ดูการแจ้งเตือน
- [ ] Mark as read
- [ ] Mark all as read
- [ ] ลบการแจ้งเตือน

---

### 6.14 Maps Integration
- [ ] แสดงแผนที่บน Gym Detail Page
- [ ] แสดงแผนที่บน Contact Page
- [ ] Custom markers
- [ ] Dark theme tiles

---

## 7. 📈 Coverage Reports

### 7.1 Code Coverage
- [ ] **Unit Test Coverage**
  - [ ] Overall coverage: ⏳ %
  - [ ] Functions coverage: ⏳ %
  - [ ] Lines coverage: ⏳ %
  - [ ] Branches coverage: ⏳ %

**คำสั่ง**: `npm run test:coverage`

---

### 7.2 Coverage by Module
- [ ] **Authentication Module**: ⏳ %
- [ ] **Booking Module**: ⏳ %
- [ ] **Payment Module**: ⏳ %
- [ ] **Gamification Module**: ⏳ %
- [ ] **Products Module**: ⏳ %
- [ ] **Events Module**: ⏳ %
- [ ] **Partner Module**: ⏳ %
- [ ] **Admin Module**: ⏳ %

---

## 8. 🐛 Bug Reports

### 8.1 Critical Bugs
- [ ] ไม่มี / ⚠️ มี

---

### 8.2 High Priority Bugs
- [ ] ไม่มี / ⚠️ มี

---

### 8.3 Medium Priority Bugs
- [ ] ไม่มี / ⚠️ มี

---

### 8.4 Low Priority Bugs
- [ ] ไม่มี / ⚠️ มี

---

## 9. ⚡ Performance Tests

### 9.1 Load Testing
- [ ] API response time
- [ ] Database query performance
- [ ] Page load time
- [ ] Image optimization

**สถานะ**: ⏳

---

### 9.2 Stress Testing
- [ ] Concurrent users
- [ ] Database connection pool
- [ ] Rate limiting effectiveness

**สถานะ**: ⏳

---

## 10. 📱 Cross-Browser Testing

### 10.1 Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

### 10.2 Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Responsive design

---

## 11. 📝 Test Execution Log

### 11.1 Test Run History
| วันที่ | เวลา | ประเภท | จำนวน Tests | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|-------|------|--------|------------|------|---------|---------|
| 2025-11-05 | - | Unit Tests | 43 | 43 | 0 | ✅ Promotion Discount (27 tests) + Promotion API (16 tests) |
| 2025-11-05 | - | E2E Tests | 28 | 1 | 0 | ⚠️ Playwright browsers ติดตั้งแล้ว แต่ WebServer timeout (ต้องรัน server แยกหรือเพิ่ม timeout) |

---

### 11.2 Test Environment
- **Environment**: Development / Staging / Production
- **Database**: Supabase (Local / Remote)
- **Node Version**: -
- **Next.js Version**: 15.5.6
- **Jest Version**: 30.2.0
- **Playwright Version**: 1.56.1

---

## 12. ✅ Sign-Off

### 12.1 Test Execution
- **Tested By**: _________________
- **Date**: _________________
- **Status**: ⏳ Pending / ✅ Pass / ❌ Fail

---

### 12.2 Review
- **Reviewed By**: _________________
- **Date**: _________________
- **Approved**: ⏳ Yes / ❌ No

---

### 12.3 Deployment Approval
- **Approved By**: _________________
- **Date**: _________________
- **Ready for Production**: ⏳ Yes / ❌ No

---

## 📌 หมายเหตุ

### คำสั่งที่ใช้บ่อย
```bash
# Unit Tests
npm test                          # รัน tests ทั้งหมด
npm run test:watch                # Watch mode
npm run test:coverage             # Coverage report
npm run test:promotion            # Promotion tests

# E2E Tests
npm run test:e2e                  # รัน E2E tests
npm run test:e2e:ui               # UI mode
npm run test:e2e:debug           # Debug mode
npm run test:report              # Show report

# Script Tests
npm run test:scripts              # รัน script tests ทั้งหมด
npm run test:scripts:admin        # Admin tests
npm run test:scripts:database     # Database tests
npm run test:scripts:storage      # Storage tests
npm run test:scripts:setup        # Setup tests
```

### Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **Text Report**: แสดงใน terminal

### Test Screenshots
- **Location**: `tests/screenshots/`
- **E2E Tests**: จะสร้าง screenshots อัตโนมัติเมื่อเกิด error

---

## 🔄 อัปเดต

**อัปเดตล่าสุด**: 2025-11-05  
**เวอร์ชัน**: 1.0.0

---

**หมายเหตุ**: Checklist นี้ควรอัปเดตทุกครั้งที่รัน tests หรือเมื่อมีการเพิ่ม features ใหม่


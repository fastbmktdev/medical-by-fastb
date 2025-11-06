# 📋 Test Organization Plan

**วันที่**: 2025-11-06
**สถานะ**: Proposed

---

## 🎯 เป้าหมาย

จัดระเบียบไฟล์ test ให้มีโครงสร้างที่ชัดเจน ง่ายต่อการหาและบำรุงรักษา

---

## 📊 ปัญหาที่พบ

### 1. โครงสร้างไฟล์ไม่ชัดเจน
- ✅ Tests กระจายอยู่หลายที่ (unit, integration, affiliate, e2e, analysis)
- ❌ ไม่มีโฟลเดอร์ `api/` สำหรับ API tests
- ❌ Component tests อยู่ที่ `src/components/design-system/__tests__/`

### 2. ไฟล์ซ้ำ
- `promotion-discount.test.ts` และ `promotion-discount.test.js`
- `promotion-api.test.ts` และต้องมีการทำความสะอาด

### 3. Scripts ที่อ้างอิงไฟล์ที่ไม่มี
- `test:scripts`, `test:affiliate:*` scripts อ้างถึง `tests/scripts/` ที่ไม่มี
- ควรย้ายไฟล์เหล่านี้ไปที่ถูกต้อง

### 4. ไม่มี Test Categories ที่ชัดเจน
- ไม่แยกระหว่าง unit, integration, e2e, api อย่างชัดเจน

---

## 🎨 โครงสร้างที่เสนอ (Proposed Structure)

```
tests/
├── README.md                          # Documentation หลัก
├── jest.config.js                     # Jest config (if needed)
├── playwright.config.ts               # Playwright config (if needed)
│
├── unit/                              # Unit Tests (Jest)
│   ├── README.md
│   ├── utils/                         # Utility functions
│   │   ├── promotion.test.ts          # Promotion utils
│   │   ├── affiliate.test.ts          # Affiliate utils
│   │   ├── validation.test.ts         # Validation utils
│   │   ├── sanitize.test.ts           # Sanitize utils
│   │   ├── file-validation.test.ts
│   │   ├── qrcode.test.ts
│   │   └── ...
│   ├── services/                      # Service layer tests
│   │   ├── gamification.service.test.ts
│   │   ├── booking.service.test.ts
│   │   ├── payment.service.test.ts
│   │   ├── auth.service.test.ts
│   │   └── gym.service.test.ts
│   └── lib/                           # Lib functions
│       └── ...
│
├── integration/                       # Integration Tests
│   ├── README.md
│   ├── affiliate/                     # Affiliate system integration
│   │   ├── signup-flow.test.ts
│   │   ├── booking-flow.test.ts
│   │   ├── payment-flow.test.ts
│   │   ├── commission.test.ts
│   │   └── dashboard.test.ts
│   ├── database/                      # Database integration
│   │   ├── admin-management.test.js
│   │   ├── database-utilities.test.js
│   │   └── storage-configuration.test.js
│   ├── payments/                      # Payment integration
│   │   ├── stripe-webhook.test.ts
│   │   └── payment-flow.test.ts
│   └── analytics/                     # Analytics integration
│       └── google-analytics.test.js
│
├── api/                               # API Route Tests (NEW)
│   ├── README.md
│   ├── auth/
│   │   ├── signup.test.ts
│   │   └── login.test.ts
│   ├── users/
│   │   ├── profile.test.ts
│   │   └── ...
│   ├── gyms/
│   │   ├── gyms.test.ts
│   │   └── ...
│   ├── bookings/
│   │   ├── bookings.test.ts
│   │   └── ...
│   ├── payments/
│   │   ├── intent.test.ts
│   │   └── ...
│   ├── gamification/
│   │   ├── stats.test.ts
│   │   └── ...
│   ├── affiliate/
│   │   ├── affiliate.test.ts
│   │   └── conversions.test.ts
│   └── partner/
│       ├── promotions.test.ts
│       └── ...
│
├── e2e/                               # End-to-End Tests (Playwright)
│   ├── README.md
│   ├── helpers.ts                     # Test helpers
│   ├── fixtures/                      # Test fixtures
│   ├── auth/
│   │   ├── auth-flow.spec.ts
│   │   └── login-existing-users.spec.ts
│   ├── affiliate/
│   │   ├── affiliate-signup-sessionstorage.spec.ts
│   │   └── affiliate-dashboard.spec.ts
│   └── admin/
│       └── admin-gym-management.spec.ts
│
├── component/                         # Component Tests (NEW)
│   ├── README.md
│   ├── design-system/
│   │   ├── primitives/
│   │   │   ├── Button.test.tsx
│   │   │   └── BaseInput.test.tsx
│   │   └── compositions/
│   │       ├── Modal.test.tsx
│   │       └── DataTable.test.tsx
│   └── ...
│
├── analysis/                          # Code Analysis Tests
│   ├── README.md
│   ├── dependency-scanner.test.ts
│   ├── cleanup-integration.test.ts
│   └── safety-scenarios.test.ts
│
├── fixtures/                          # Test Data & Fixtures
│   ├── users.json
│   ├── gyms.json
│   ├── bookings.json
│   └── ...
│
├── helpers/                           # Test Helpers & Utilities
│   ├── test-utils.ts
│   ├── test-database.ts
│   ├── test-api.ts
│   └── mock-data.ts
│
├── screenshots/                       # E2E Test Screenshots
│   └── ...
│
└── scripts/                           # Test Runner Scripts (NEW)
    ├── run-all-tests.js
    ├── run-unit-tests.js
    ├── run-integration-tests.js
    ├── run-api-tests.js
    └── run-e2e-tests.js
```

---

## 🔄 การย้ายไฟล์ (Migration Plan)

### Phase 1: เตรียมโครงสร้างใหม่
1. สร้างโฟลเดอร์ใหม่ตามโครงสร้างที่เสนอ
2. สร้าง README.md สำหรับแต่ละ category
3. ย้าย component tests จาก `src/components/design-system/__tests__/`

### Phase 2: จัดระเบียบ Unit Tests
1. ย้าย utils tests ไปที่ `tests/unit/utils/`
2. ลบไฟล์ซ้ำ (`.test.js` ถ้ามี `.test.ts`)
3. สร้าง service tests ใหม่ที่ `tests/unit/services/`

### Phase 3: จัดระเบียบ Integration Tests
1. ย้าย affiliate tests ไปที่ `tests/integration/affiliate/`
2. ย้าย database tests ไปที่ `tests/integration/database/`
3. ย้าย analytics tests ไปที่ `tests/integration/analytics/`

### Phase 4: สร้าง API Tests (NEW)
1. สร้างโครงสร้าง `tests/api/`
2. เริ่มเขียน API tests ตาม priority
   - High: Auth, Bookings, Payments
   - Medium: Gamification, Affiliate, Partner
   - Low: Products, Events, Articles

### Phase 5: จัดระเบียบ E2E Tests
1. แยก E2E tests ตาม feature ไปยัง subfolders
2. สร้าง helpers และ fixtures ที่เป็น shared

### Phase 6: สร้าง Test Helpers
1. สร้าง `tests/helpers/` สำหรับ shared utilities
2. สร้าง `tests/fixtures/` สำหรับ test data

### Phase 7: อัปเดต Scripts
1. แก้ไข package.json scripts ให้ชี้ไปที่ตำแหน่งใหม่
2. สร้าง test runner scripts ใหม่
3. อัปเดต documentation

---

## 📝 Test Naming Conventions

### Unit Tests
- ไฟล์: `[function-name].test.ts` หรือ `[service-name].service.test.ts`
- ตัวอย่าง: `promotion.test.ts`, `booking.service.test.ts`

### Integration Tests
- ไฟล์: `[feature-name]-flow.test.ts` หรือ `[feature-name].test.ts`
- ตัวอย่าง: `signup-flow.test.ts`, `payment-flow.test.ts`

### API Tests
- ไฟล์: `[endpoint-name].test.ts`
- ตัวอย่าง: `signup.test.ts`, `bookings.test.ts`

### E2E Tests
- ไฟล์: `[feature-name].spec.ts`
- ตัวอย่าง: `auth-flow.spec.ts`, `affiliate-dashboard.spec.ts`

### Component Tests
- ไฟล์: `[ComponentName].test.tsx`
- ตัวอย่าง: `Button.test.tsx`, `Modal.test.tsx`

---

## 🛠️ Package.json Scripts (Updated)

```json
{
  "scripts": {
    // ===== Unit Tests =====
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:unit:utils": "jest tests/unit/utils",
    "test:unit:services": "jest tests/unit/services",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",

    // ===== Integration Tests =====
    "test:integration": "jest tests/integration",
    "test:integration:affiliate": "jest tests/integration/affiliate",
    "test:integration:database": "jest tests/integration/database",
    "test:integration:payments": "jest tests/integration/payments",
    "test:integration:analytics": "jest tests/integration/analytics",

    // ===== API Tests =====
    "test:api": "jest tests/api",
    "test:api:auth": "jest tests/api/auth",
    "test:api:users": "jest tests/api/users",
    "test:api:gyms": "jest tests/api/gyms",
    "test:api:bookings": "jest tests/api/bookings",
    "test:api:payments": "jest tests/api/payments",
    "test:api:gamification": "jest tests/api/gamification",
    "test:api:affiliate": "jest tests/api/affiliate",
    "test:api:partner": "jest tests/api/partner",

    // ===== E2E Tests =====
    "test:e2e": "playwright test",
    "test:e2e:auth": "playwright test tests/e2e/auth",
    "test:e2e:affiliate": "playwright test tests/e2e/affiliate",
    "test:e2e:admin": "playwright test tests/e2e/admin",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:report": "playwright show-report",

    // ===== Component Tests =====
    "test:component": "jest tests/component",
    "test:component:design-system": "jest tests/component/design-system",

    // ===== Analysis Tests =====
    "test:analysis": "jest tests/analysis",

    // ===== All Tests =====
    "test:all": "npm run test:unit && npm run test:integration && npm run test:api && npm run test:e2e",
    "test:all:coverage": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## ✅ ประโยชน์ของโครงสร้างใหม่

1. **ชัดเจน**: แยก test types ตามหมวดหมู่อย่างชัดเจน
2. **ง่ายต่อการหา**: ค้นหาไฟล์ test ได้ง่าย
3. **Scalable**: เพิ่ม tests ใหม่ได้ง่าย
4. **Maintainable**: บำรุงรักษาง่าย
5. **Organized Scripts**: Scripts ใน package.json มีระเบียบ
6. **Shared Helpers**: ใช้ helpers และ fixtures ร่วมกันได้
7. **Better Coverage**: ครอบคลุมทุก layer (unit, integration, api, e2e, component)

---

## 🎯 Next Steps

1. ✅ รับ approval จาก user
2. ⏳ เริ่ม Phase 1: สร้างโครงสร้างใหม่
3. ⏳ ทำ Phase 2-7 ตามลำดับ
4. ⏳ อัปเดต scripts ใน package.json
5. ⏳ อัปเดต documentation

---

## 📚 อ้างอิง

- [TESTING_SUMMARY.md](./TESTING_SUMMARY.md)
- [FUNCTION_TESTING_LIST.md](./FUNCTION_TESTING_LIST.md)
- [TEST_REPORT_CHECKLIST.md](./TEST_REPORT_CHECKLIST.md)
